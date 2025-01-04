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
            const result = await chrome.storage.local.get(key);
            return result[key];
        } catch (error) {
            console.error('Storage get error:', error);
            return null;
        }
    }

    static async set(key, value) {
        try {
            await chrome.storage.local.set({ [key]: value });
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