/**
 * Helper functions for handling Indian Standard Time (IST / UTC+05:30) timestamps.
 */

/**
 * Returns an ISO format timestamp string with +05:30 IST offset.
 * Example: "2026-09-28T18:05:12.000+05:30"
 * @param {Date|number|string} [date=new Date()]
 * @returns {string}
 */
export function getISTTimestamp(date = new Date()) {
    const d = new Date(date);
    const istMs = d.getTime() + (5.5 * 60 * 60 * 1000);
    return new Date(istMs).toISOString().replace('Z', '+05:30');
}

/**
 * Returns a formatted IST string for logging or readable output.
 * Example: "2026-09-28 18:05:12 IST"
 * @param {Date|number|string} [date=new Date()]
 * @returns {string}
 */
export function formatISTString(date = new Date()) {
    const d = new Date(date);
    const istMs = d.getTime() + (5.5 * 60 * 60 * 1000);
    return new Date(istMs).toISOString().replace('T', ' ').slice(0, 19) + ' IST';
}
