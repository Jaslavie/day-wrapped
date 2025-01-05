/**
 * Cache Structure:
 * {
 *     activeTab: { id: number, url: string, startTime: number }, // current tab
 *     lastActiveTime: number, // last time user was active
 * }
 * 
 * Shot Term Memory (array of objects):
 * {
 *      [index: number]: {
 *          time: number,                 // time accessed in seconds
 *          url: string                   // exact url accessed
 *      }
 * }
 * 
 * Long Term Memory:
 * {
 *      summaries: [{
 *          week: number,                   // week number
 *          summary: string,                 // nlp summary of the week
 *          topDomains: [{
 *              domain: string,             // domain
 *              count: number               // number of times visited
 *          }]
 *      }],
 *      lastCleanup: number,                // last time user was active
 * }
 * 
 * goals:
 * {
 *      shortTerm: [string],
 *      longTerm: [string]
 * }
 */
class StorageManager {
    static STORAGE_KEYS = {
        GOALS: 'goals',
        USER_NAME: 'userName',
        SHORT_TERM_MEMORY: 'shortTermMemory',
        LONG_TERM_MEMORY: 'longTermMemory'
    };

    static async initialize() {
        const now = Date.now();
        const defaults = {
            [this.STORAGE_KEYS.GOALS]: { 
                shortTerm: [], 
                longTerm: [] 
            },
            [this.STORAGE_KEYS.SHORT_TERM_MEMORY]: [],
            [this.STORAGE_KEYS.LONG_TERM_MEMORY]: { 
                summaries: [], 
                lastCleanup: now 
            }
        };

        for (const [key, value] of Object.entries(defaults)) {
            const existing = await this.get(key);
            if (!existing) {
                await this.set(key, value);
            }
        }
    }

    static async get(key) {
        try {
            if (key === this.STORAGE_KEYS.SHORT_TERM_MEMORY) {
                // Get last 24 hours of history from Chrome
                const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
                const historyItems = await chrome.history.search({
                    text: '',
                    startTime: oneDayAgo,
                    maxResults: 10000
                });
                
                // Convert history items to our format
                const historyVisits = historyItems.map(item => ({
                    time: item.lastVisitTime,
                    url: item.url,
                    duration: 0, // We don't have duration for history items
                    id: `history-${item.id}`
                }));
                
                // Get our tracked visits
                const storedData = await chrome.storage.local.get(key);
                const trackedVisits = storedData[key] || [];
                
                // Combine and deduplicate visits
                const allVisits = [...historyVisits, ...trackedVisits];
                const uniqueVisits = Array.from(new Map(
                    allVisits.map(item => [item.url + item.time, item])
                ).values());
                
                // Filter last 24 hours and sort
                const recentVisits = uniqueVisits
                    .filter(item => item.time > oneDayAgo)
                    .sort((a, b) => a.time - b.time);
                
                console.log('Chrome History Items:', historyItems.length);
                console.log('Tracked Visits:', trackedVisits.length);
                
                return recentVisits;
            }
            
            const result = await chrome.storage.local.get(key);
            if (!result[key]) {
                console.warn(`No data found for key: ${key}`);
                return null;
            }
            return result[key];
        } catch (error) {
            console.error('Storage get error:', error, {
                key,
                errorMessage: error.message,
                stack: error.stack
            });
            return null;
        }
    }

    static async set(key, value) {
        try {
            if (key === this.STORAGE_KEYS.SHORT_TERM_MEMORY) {
                // Get existing data including history
                const existingData = await this.get(key) || [];
                
                // Add new visit while preserving history items
                const historyItems = existingData.filter(item => item.id?.toString().startsWith('history-'));
                const trackedItems = existingData.filter(item => !item.id?.toString().startsWith('history-'));
                
                // Combine with new visit
                const combinedData = Array.isArray(value) 
                    ? [...historyItems, ...trackedItems, ...value]
                    : [...historyItems, ...trackedItems, value];
                
                // Clean up old data (older than 24 hours)
                const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
                const recentVisits = combinedData.filter(item => 
                    item && item.time && item.time > oneDayAgo
                );
                
                // Sort by time
                recentVisits.sort((a, b) => a.time - b.time);
                
                await chrome.storage.local.set({ [key]: recentVisits });
                
                // Log for debugging
                console.log('Updated memory:', {
                    totalItems: recentVisits.length,
                    historyItems: recentVisits.filter(i => i.id?.toString().startsWith('history-')).length,
                    trackedItems: recentVisits.filter(i => !i.id?.toString().startsWith('history-')).length
                });
            } else {
                await chrome.storage.local.set({ [key]: value });
            }
        } catch (error) {
            console.error('Storage set error:', error);
        }
    }

    static async getMultiple(keys) {
        try {
            return await chrome.storage.local.get(keys);
        } catch (error) {
            console.error('Storage getMultiple error:', error);
            return {};
        }
    }
}

export default StorageManager; 