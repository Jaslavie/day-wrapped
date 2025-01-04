/**
 * Storage schema for data
 */

import { cleanup } from './cleanup';

// keys to access data in chrome storage
const STORAGE_KEYS = {
    TODAY: 'todayStats',
    SHORT_TERM: 'shortTermStats',
    WEEKLY: 'weeklyStats'
};

// memory limits
const MEMORY_LIMITS = {
    MAX_DOMAINS: 1000, // max 1000 domains 
    CLEANUP_THRESHOLD: 800, // cleanup if 800 domains are stored
    MAX_WEEKLY_ENTRIES: 4,
    ROLLUP_INTERVAL: 7 * 24 * 60 * 60 * 1000,    // 7 days
    BATCH_SIZE: 100,
}

// in-memory cache
const memoryCache = {
    domains: new Map(), // key: domain, value: time spent
    lastFlush: Date.now(), // last time the cache was flushed to storage
    dirty: false // indicate if cache was modified
};

// domain extraction function (ex: https://www.google.com -> google.com)
const getDomain = (() => {
    const parser = document.createElement('a');
    return (url) => {
        parser.href = url;
        return parser.hostname;
    }
})();

export const StorageManager = {
    /**
     * Manages data storage, retrieval, and cleaning
     */
    STORAGE_KEYS,

    // initialize cleanup and migration
    async initialize() {
        await this.migrateOldData();
        await this.pruneStorage();
    },

    // migrate old data 
    async migrateOldData() {
        const { shortTermMemory } = await chrome.storage.local.get('shortTermMemory');
        
        if (shortTermMemory) {
            // Store stats representing short term memory
            const shortTermStats = {
                domains: {},
                total: 0,
                lastUpdate: Date.now()
            };

            // add visits to the stats based on the memory stored in the cache
            Object.entries(shortTermMemory.domains || {}).forEach(([domain, count]) => {
                shortTermStats.domains[domain] = count;
                shortTermStats.total += count;
            });

            // save stats to short term storage and remove old data
            await chrome.storage.local.set({ [STORAGE_KEYS.SHORT_TERM]: shortTermStats });
            await chrome.storage.local.remove('shortTermMemory');
        }
    },

    async pruneStorage() {
        const stats = await chrome.storage.local.get([
            STORAGE_KEYS.SHORT_TERM,
            STORAGE_KEYS.WEEKLY
        ]);

        // Prune short-term stats
        if (stats.shortTermStats?.domains) {
            const entries = Object.entries(stats.shortTermStats.domains);
            if (entries.length > MEMORY_LIMITS.CLEANUP_THRESHOLD) {
                const topDomains = entries
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, MEMORY_LIMITS.MAX_DOMAINS / 2);
                
                stats.shortTermStats.domains = Object.fromEntries(topDomains);
                await chrome.storage.local.set({ 
                    [STORAGE_KEYS.SHORT_TERM]: stats.shortTermStats 
                });
            }
        }

        // Prune weekly stats
        if (stats.weeklyStats?.length > MEMORY_LIMITS.MAX_WEEKLY_ENTRIES) {
            stats.weeklyStats = stats.weeklyStats.slice(-MEMORY_LIMITS.MAX_WEEKLY_ENTRIES);
            await chrome.storage.local.set({ 
                [STORAGE_KEYS.WEEKLY]: stats.weeklyStats 
            });
        }
    },

    // add single visit to cache
    async trackVisit(url) {
        const domain = getDomain(url);
        const currentCount = memoryCache.domains.get(domain) || 0;
        memoryCache.domains.set(domain, currentCount + 1); // increment visit count
        memoryCache.dirty = true; // mark cache as modified

        // flush cache after 10 seconds
        if (Date.now() - memoryCache.lastFlush > 5000) {
            await this.flushCache();
        }
    },

    // flush memory cache to storage
    async flush() {
        if (!memoryCache.dirty) return;
        
        try {
            const { shortTermStats = { domains: {}, total: 0 } } =
                await chrome.storage.local.get(STORAGE_KEYS.SHORT_TERM);

            // Process in batches
            const entries = Array.from(memoryCache.domains.entries());
            for (let i = 0; i < entries.length; i += MEMORY_LIMITS.BATCH_SIZE) {
                const batch = entries.slice(i, i + MEMORY_LIMITS.BATCH_SIZE);
                
                for (const [domain, count] of batch) {
                    shortTermStats.domains[domain] = 
                        (shortTermStats.domains[domain] || 0) + count;
                    shortTermStats.total += count;
                }
                
                // Force cleanup between batches
                cleanup.clearObject(batch);
                await new Promise(resolve => setTimeout(resolve, 0)); // Allow GC
            }

            // Clear cache immediately
            cleanup.clearMap(memoryCache.domains);
            memoryCache.lastFlush = Date.now();
            memoryCache.dirty = false;

            await chrome.storage.local.set({
                [STORAGE_KEYS.SHORT_TERM]: shortTermStats
            });

            // Force cleanup
            cleanup.clearObject(shortTermStats);
        } catch (error) {
            console.error('Flush error:', error);
        }
    },

    // Weekly data aggregation
    async weeklyRollup(stats) {
        const { weeklyStats = [] } =
            await chrome.storage.local.get(STORAGE_KEYS.WEEKLY);

        // get the most visited domains
        const topDomains = Object.entries(stats.domains)
            .sort(([, a], [, b]) => b - a) // sort by the visit count by descending order
            .slice(0, 10) // get top 10 domains
            .map(([domain]) => domain); // extract domain names
        
        // add to weekly stats
        weeklyStats.push({
            week: this.getCurrentWeek(),
            topDomains,
            total: stats.total
        });

        // keep only the last 4 weeks
        while (weeklyStats.length > 4) weeklyStats.shift();

        await chrome.storage.local.set({
            [STORAGE_KEYS.WEEKLY]: weeklyStats
        });
    },

    async getStorageUsage() {
        const stats = await chrome.storage.local.get(null);
        return Object.entries(stats).reduce((acc, [key, value]) => {
            const size = new TextEncoder().encode(JSON.stringify(value)).length;
            acc[key] = (size / 1024).toFixed(2) + ' KB';
            return acc;
        }, {});
    },

    async logStorageOperation(operation, key, dataSize) {
        const size = (dataSize / 1024).toFixed(2);
        console.log(`Storage operation: ${operation} | Key: ${key} | Size: ${size}KB`);
        
        if (size > 100) { // Log warning for operations over 100KB
            console.warn(`Large storage operation detected: ${operation} ${key} (${size}KB)`);
        }
    }
}