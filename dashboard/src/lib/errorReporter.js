const isDev = import.meta.env.DEV;
const endpoint = import.meta.env.VITE_ERROR_REPORT_URL ?? null;

export function reportError(error, context = {}) {
    if (isDev) {
        console.error('[ErrorReporter]', error, context);
        return;
    }

    if (!endpoint) return;

    const payload = {
        message: error?.message ?? String(error),
        stack: error?.stack ?? null,
        context,
        url: window.location.href,
        timestamp: new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().replace('Z', '+05:30'),
    };

    navigator.sendBeacon(endpoint, JSON.stringify(payload));
}
