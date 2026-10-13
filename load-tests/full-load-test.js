import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, API_KEY, getRandomTelemetryPayload } from './config.js';

export const options = {
    scenarios: {
        telemetry_high_concurrency: {
            executor: 'ramping-vus',
            startVUs: 10,
            stages: [
                { duration: '30s', target: 200 }, // Ramp up to 200 concurrent users
                { duration: '4m', target: 200 },  // Maintain 200 concurrent users for 4 minutes
                { duration: '30s', target: 50 },   // Graceful ramp down
            ],
            gracefulRampDown: '10s',
        },
    },
    thresholds: {
        // 99.9%+ success rate (< 0.1% failures)
        http_req_failed: ['rate<0.001'],
        // Telemetry pipeline latency requirements under load
        http_req_duration: ['avg<350', 'p(95)<500'],
    },
};

export default function () {
    const payload = JSON.stringify(getRandomTelemetryPayload());
    const params = {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
        },
    };

    const res = http.post(`${BASE_URL}/api/hit`, payload, params);

    check(res, {
        'status is 202 (queued)': (r) => r.status === 202,
        'has eventId': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.success === true && !!body.data?.eventId;
            } catch (_) {
                return false;
            }
        },
    });
}

export function handleSummary(data) {
    const totalRequests = data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0;
    const reqRate = data.metrics.http_reqs ? data.metrics.http_reqs.values.rate.toFixed(2) : 0;
    const failedRate = data.metrics.http_req_failed ? (data.metrics.http_req_failed.values.rate * 100).toFixed(3) : 0;
    const successRate = (100 - failedRate).toFixed(2);
    const avgDuration = data.metrics.http_req_duration ? data.metrics.http_req_duration.values.avg.toFixed(2) : 0;
    const medDuration = data.metrics.http_req_duration ? data.metrics.http_req_duration.values.med.toFixed(2) : 0;
    const p90Duration = data.metrics.http_req_duration ? (data.metrics.http_req_duration.values['p(90)'] || 0).toFixed(2) : 0;
    const p95Duration = data.metrics.http_req_duration ? (data.metrics.http_req_duration.values['p(95)'] || 0).toFixed(2) : 0;
    const p99Duration = data.metrics.http_req_duration ? (data.metrics.http_req_duration.values['p(99)'] || 0).toFixed(2) : 0;

    const summaryReport = `
================================================================================
           API MONITORING PLATFORM - K6 LOAD TEST EXECUTION REPORT
================================================================================
  Target Endpoint:    ${BASE_URL}/api/hit
  Concurrent Users:   200 Virtual Users (VUs)
  Total Duration:     5 minutes (300 seconds)
--------------------------------------------------------------------------------
  KEY PERFORMANCE METRICS:
  * Total Requests Handled:  ${totalRequests.toLocaleString()} requests
  * Throughput:              ${reqRate} Requests/Sec (RPS)
  * Success Rate:            ${successRate}% (${failedRate}% failed)
  * Average Latency:         ${avgDuration} ms
  * Median Latency:          ${medDuration} ms
  * p90 Latency:             ${p90Duration} ms
  * p95 Latency:             ${p95Duration} ms
  * p99 Latency:             ${p99Duration} ms
================================================================================
`;

    return {
        stdout: summaryReport,
        'load-tests/results/full-load-test-summary.json': JSON.stringify(data, null, 2),
    };
}
