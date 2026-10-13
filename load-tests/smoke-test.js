import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, API_KEY, getRandomTelemetryPayload } from './config.js';

export const options = {
    vus: 5,
    duration: '10s',
    thresholds: {
        http_req_failed: ['rate<0.01'], // <1% errors
        http_req_duration: ['p(95)<500'], // 95% of requests should be < 500ms
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
        'response has eventId': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.success === true && body.data && !!body.data.eventId;
            } catch (_) {
                return false;
            }
        },
    });

    sleep(0.05); // 50ms pause between requests per VU
}
