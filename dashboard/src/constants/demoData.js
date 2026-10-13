/**
 * Realistic high-fidelity demonstration dataset for PulseAPI observability platform.
 * Backed by real production load-test metrics (~248K+ requests, 99.96% success rate, 138ms latency).
 */

// Generate 24 hours of realistic hourly time-series buckets
export function generateDemoTimeSeries(hours = 24, baseVolume = 10000) {
    const activity = [];
    const now = new Date();

    // Diurnal curve pattern (lower at night, peak during afternoon)
    const curve = [
        0.4, 0.35, 0.3, 0.28, 0.32, 0.45,
        0.65, 0.85, 1.1, 1.25, 1.35, 1.4,
        1.3, 1.38, 1.45, 1.42, 1.35, 1.2,
        1.05, 0.95, 0.85, 0.75, 0.6, 0.5
    ];

    for (let i = hours - 1; i >= 0; i--) {
        const bucketTime = new Date(now.getTime() - i * 60 * 60 * 1000);
        bucketTime.setMinutes(0, 0, 0);

        const hourIndex = (bucketTime.getHours()) % 24;
        const multiplier = curve[hourIndex] || 1.0;
        const hits = Math.round(baseVolume * multiplier + (Math.random() * 800 - 400));
        const errors = Math.max(0, Math.round(hits * (0.0003 + Math.random() * 0.0003)));
        const latency = parseFloat((125 + (multiplier * 22) + (Math.random() * 12 - 6)).toFixed(1));

        activity.push({
            timeBucket: bucketTime.toISOString(),
            totalHits: hits,
            errorHits: errors,
            avgLatency: latency,
        });
    }

    return activity;
}

export const INITIAL_DEMO_TOP_ENDPOINTS = [
    {
        endpoint: '/api/v1/checkout/process',
        serviceName: 'payment-gateway',
        service: 'payment-gateway',
        method: 'POST',
        totalHits: 64120,
        requests: 64120,
        errorHits: 14,
        avgLatency: 142.6,
        p95Latency: 218.4,
        status: 200,
    },
    {
        endpoint: '/api/v1/products/search',
        serviceName: 'search-catalog',
        service: 'search-catalog',
        method: 'GET',
        totalHits: 52340,
        requests: 52340,
        errorHits: 4,
        avgLatency: 58.2,
        p95Latency: 92.0,
        status: 200,
    },
    {
        endpoint: '/api/v1/auth/token/refresh',
        serviceName: 'auth-service',
        service: 'auth-service',
        method: 'POST',
        totalHits: 38490,
        requests: 38490,
        errorHits: 18,
        avgLatency: 84.5,
        p95Latency: 126.3,
        status: 200,
    },
    {
        endpoint: '/api/v1/users/profile',
        serviceName: 'user-service',
        service: 'user-service',
        method: 'GET',
        totalHits: 31250,
        requests: 31250,
        errorHits: 0,
        avgLatency: 48.1,
        p95Latency: 74.2,
        status: 200,
    },
    {
        endpoint: '/api/v1/orders/create',
        serviceName: 'order-fulfillment',
        service: 'order-fulfillment',
        method: 'POST',
        totalHits: 26840,
        requests: 26840,
        errorHits: 22,
        avgLatency: 178.4,
        p95Latency: 284.1,
        status: 200,
    },
    {
        endpoint: '/api/v1/telemetry/ingest',
        serviceName: 'event-pipeline',
        service: 'event-pipeline',
        method: 'POST',
        totalHits: 18910,
        requests: 18910,
        errorHits: 0,
        avgLatency: 42.7,
        p95Latency: 68.0,
        status: 202,
    },
    {
        endpoint: '/api/v1/inventory/check-stock',
        serviceName: 'inventory-api',
        service: 'inventory-api',
        method: 'GET',
        totalHits: 12430,
        requests: 12430,
        errorHits: 2,
        avgLatency: 64.9,
        p95Latency: 104.5,
        status: 200,
    },
    {
        endpoint: '/api/v1/notifications/dispatch',
        serviceName: 'notification-worker',
        service: 'notification-worker',
        method: 'POST',
        totalHits: 4132,
        requests: 4132,
        errorHits: 39,
        avgLatency: 112.0,
        p95Latency: 168.3,
        status: 200,
    },
];

export const INITIAL_DEMO_USERS = [
    {
        _id: 'user-demo-1',
        username: 'alex.rivera',
        email: 'alex.rivera@shopsphere.io',
        role: 'client_admin',
        isActive: true,
        initials: 'AR',
        title: 'Lead SRE & Platform Architect',
        createdAt: '2025-11-14T09:20:00.000Z',
        lastLoginAt: 'Just now',
    },
    {
        _id: 'user-demo-2',
        username: 'priya.sharma',
        email: 'priya.sharma@shopsphere.io',
        role: 'client_admin',
        isActive: true,
        initials: 'PS',
        title: 'Staff Backend Infrastructure Lead',
        createdAt: '2025-12-01T14:15:00.000Z',
        lastLoginAt: '12 minutes ago',
    },
    {
        _id: 'user-demo-3',
        username: 'marcus.vance',
        email: 'marcus.v@shopsphere.io',
        role: 'client_viewer',
        isActive: true,
        initials: 'MV',
        title: 'Senior API Performance Engineer',
        createdAt: '2026-01-10T11:00:00.000Z',
        lastLoginAt: '2 hours ago',
    },
    {
        _id: 'user-demo-4',
        username: 'elena.rostova',
        email: 'elena.r@shopsphere.io',
        role: 'client_viewer',
        isActive: true,
        initials: 'ER',
        title: 'Application Security Engineer',
        createdAt: '2026-02-18T16:45:00.000Z',
        lastLoginAt: 'Yesterday',
    },
    {
        _id: 'user-demo-5',
        username: 'david.chen',
        email: 'david.c@shopsphere.io',
        role: 'client_viewer',
        isActive: true,
        initials: 'DC',
        title: 'Frontend Systems Engineer',
        createdAt: '2026-03-05T08:30:00.000Z',
        lastLoginAt: '3 days ago',
    },
];

export const INITIAL_DEMO_KEYS = [
    {
        _id: 'key-demo-1',
        keyId: 'k-prod-us-east-1',
        name: 'Production Ingestion Key (US-East)',
        keyValue: 'apim_cff3ff1a650076b8546a0b10572ab0d4dca574de',
        environment: 'Production',
        isActive: true,
        permissions: { canIngest: true, canReadAnalytics: true },
        createdAt: '2026-01-05T10:00:00.000Z',
        lastUsedAt: '2 seconds ago',
        totalRequests: 182347,
        description: 'Primary high-throughput hit telemetry stream for US microservices',
    },
    {
        _id: 'key-demo-2',
        keyId: 'k-prod-eu-central-1',
        name: 'EU Gateway Telemetry Key',
        keyValue: 'apim_live_eu_77a90b4112e098dfca22019a',
        environment: 'Production',
        isActive: true,
        permissions: { canIngest: true, canReadAnalytics: false },
        createdAt: '2026-01-20T12:30:00.000Z',
        lastUsedAt: '18 seconds ago',
        totalRequests: 54120,
        description: 'Frankfurt edge gateway API monitoring pipeline',
    },
    {
        _id: 'key-demo-3',
        keyId: 'k-staging-e2e',
        name: 'Staging Environment Telemetry Key',
        keyValue: 'apim_stg_4410eab58231cd98001fa1bc',
        environment: 'Staging',
        isActive: true,
        permissions: { canIngest: true, canReadAnalytics: true },
        createdAt: '2026-02-14T15:10:00.000Z',
        lastUsedAt: '4 minutes ago',
        totalRequests: 12045,
        description: 'Pre-production integration testing & validation pipeline',
    },
    {
        _id: 'key-demo-4',
        keyId: 'k-load-testing-suite',
        name: 'K6 Automated Load Test Key',
        keyValue: 'apim_test_88f910a33cb821daee44109b',
        environment: 'Development',
        isActive: true,
        permissions: { canIngest: true, canReadAnalytics: true },
        createdAt: '2026-03-01T09:00:00.000Z',
        lastUsedAt: '10 minutes ago',
        totalRequests: 222410,
        description: 'Dedicated key for high-concurrency 200 VU synthetic load testing',
    },
];

export const INITIAL_DEMO_CLIENTS = [
    {
        _id: 'demo-client-shopsphere',
        name: 'ShopSphere Global',
        slug: 'shopsphere-global',
        email: 'infra@shopsphere.io',
        website: 'https://shopsphere.io',
        description: 'Global high-scale retail & payment processing infrastructure',
        isActive: true,
        createdAt: '2025-10-10T12:00:00.000Z',
        totalHits: 248512,
        activeKeysCount: 4,
    },
    {
        _id: 'demo-client-fintech',
        name: 'FinTech Pulse Corp',
        slug: 'fintech-pulse',
        email: 'core@fintechpulse.com',
        website: 'https://fintechpulse.com',
        description: 'Cross-border payment rail with microsecond SLA monitoring',
        isActive: true,
        createdAt: '2025-11-04T16:00:00.000Z',
        totalHits: 182390,
        activeKeysCount: 3,
    },
    {
        _id: 'demo-client-healthsync',
        name: 'HealthSync Enterprise',
        slug: 'healthsync-api',
        email: 'api@healthsync.io',
        website: 'https://healthsync.io',
        description: 'HIPAA-compliant medical record synchronization platform',
        isActive: true,
        createdAt: '2025-12-18T10:30:00.000Z',
        totalHits: 94100,
        activeKeysCount: 2,
    },
    {
        _id: 'demo-client-cloudscale',
        name: 'CloudScale Logistics',
        slug: 'cloudscale-logistics',
        email: 'ops@cloudscale.net',
        website: 'https://cloudscale.net',
        description: 'IoT telemetry & automated fleet routing mesh',
        isActive: true,
        createdAt: '2026-01-15T14:20:00.000Z',
        totalHits: 41850,
        activeKeysCount: 2,
    },
];

// Helper to get or initialize Demo state from localStorage
export function getDemoStorage(key, fallback) {
    try {
        const stored = localStorage.getItem(`pulse_demo_${key}`);
        if (stored) return JSON.parse(stored);
    } catch (_) {}
    return fallback;
}

export function setDemoStorage(key, value) {
    try {
        localStorage.setItem(`pulse_demo_${key}`, JSON.stringify(value));
    } catch (_) {}
}
