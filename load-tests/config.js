export const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
export const API_KEY = __ENV.API_KEY || 'apim_cff3ff1a650076b8546a0b10572ab0d4dca574de';

const SERVICES = ['auth-service', 'payment-gateway', 'order-processor', 'inventory-service', 'notification-service'];
const ENDPOINTS = [
    '/api/v1/checkout',
    '/api/v1/orders',
    '/api/v1/users/profile',
    '/api/v1/products/search',
    '/api/v1/payments/verify',
    '/api/v1/cart/items'
];
const METHODS = ['GET', 'POST', 'PUT', 'DELETE'];
const STATUS_CODES = [200, 200, 200, 201, 200, 400, 200, 500];

export function getRandomTelemetryPayload() {
    const serviceName = SERVICES[Math.floor(Math.random() * SERVICES.length)];
    const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
    const method = METHODS[Math.floor(Math.random() * METHODS.length)];
    const statusCode = STATUS_CODES[Math.floor(Math.random() * STATUS_CODES.length)];
    // Simulated upstream service latency between 25ms and 350ms
    const latencyMs = parseFloat((25 + Math.random() * 325).toFixed(1));

    return {
        serviceName,
        endpoint,
        method,
        statusCode,
        latencyMs
    };
}
