import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, API_KEY, getRandomTelemetryPayload } from './config.js';

export const options = {
    scenarios: {
        throughput_benchmark: {
            executor: 'constant-vus',
            vus: 100,
            duration: '30s', // 30-second benchmark per run
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.01'],
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
        'status is 202': (r) => r.status === 202,
    });
}

export function handleSummary(data) {
    const totalRequests = data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0;
    const reqRate = data.metrics.http_reqs ? data.metrics.http_reqs.values.rate.toFixed(2) : 0;
    const avgDuration = data.metrics.http_req_duration ? data.metrics.http_req_duration.values.avg.toFixed(2) : 0;
    const p95Duration = data.metrics.http_req_duration ? (data.metrics.http_req_duration.values['p(95)'] || 0).toFixed(2) : 0;

    const report = `
--------------------------------------------------------------------------------
   THROUGHPUT BENCHMARK RESULT
--------------------------------------------------------------------------------
   Total Requests:    ${totalRequests.toLocaleString()}
   Throughput:        ${reqRate} RPS
   Avg Latency:       ${avgDuration} ms
   p95 Latency:       ${p95Duration} ms
--------------------------------------------------------------------------------
`;

    return {
        stdout: report,
    };
}
