/**
 * High-performance In-Memory LRU (Least Recently Used) Cache with TTL support.
 * Designed to eliminate redundant database reads during high-throughput API key authentication.
 */
export class LRUCache {
    /**
     * @param {Object} options
     * @param {number} [options.maxSize=5000] - Maximum number of entries before LRU eviction.
     * @param {number} [options.ttlMs=600000] - Time to live in ms (default: 10 minutes).
     */
    constructor({ maxSize = 5000, ttlMs = 10 * 60 * 1000 } = {}) {
        this.maxSize = maxSize;
        this.ttlMs = ttlMs;
        this.cache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            sets: 0,
        };
    }

    /**
     * Retrieve an item from the cache.
     * Updates key recency on hit (MRU order).
     * @param {string} key
     * @returns {any|null}
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            this.stats.misses++;
            return null;
        }

        // Check TTL expiration
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }

        // Move to the end (MRU) by deleting and re-inserting
        this.cache.delete(key);
        this.cache.set(key, entry);

        this.stats.hits++;
        return entry.value;
    }

    /**
     * Store an item in the cache with TTL.
     * If capacity is reached, evicts the least recently used (first inserted/accessed) item.
     * @param {string} key
     * @param {any} value
     * @param {number} [customTtlMs]
     */
    set(key, value, customTtlMs) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            // Evict oldest (least recently used)
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey !== undefined) {
                this.cache.delete(oldestKey);
                this.stats.evictions++;
            }
        }

        const expiresAt = Date.now() + (customTtlMs !== undefined ? customTtlMs : this.ttlMs);
        this.cache.set(key, { value, expiresAt });
        this.stats.sets++;
        return this;
    }

    /**
     * Invalidate a key from cache.
     * @param {string} key
     * @returns {boolean}
     */
    delete(key) {
        return this.cache.delete(key);
    }

    /**
     * Clear all cached items and optionally reset metrics.
     */
    clear(resetStats = false) {
        this.cache.clear();
        if (resetStats) {
            this.stats = { hits: 0, misses: 0, evictions: 0, sets: 0 };
        }
    }

    /**
     * Get current metrics (hits, misses, hit rate, reduction in DB queries).
     */
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) + '%' : '0.00%';
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            ttlMinutes: this.ttlMs / (60 * 1000),
            hits: this.stats.hits,
            misses: this.stats.misses,
            totalRequests: total,
            hitRate,
            evictions: this.stats.evictions,
            redundantDbReadsSaved: this.stats.hits,
            reductionPercentage: hitRate,
        };
    }
}

export default LRUCache;
