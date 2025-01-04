class StorageManager {
    static STORAGE_KEYS = {
        SHORT_TERM: 'shortTermStats',
        LONG_TERM: 'longTermStats',
        GOALS: 'goals',
        USER_NAME: 'userName',
        SHORT_TERM_MEMORY: 'shortTermMemory',
        LONG_TERM_MEMORY: 'longTermMemory'
    };

    static async initialize() {
        // Initialize storage with empty values
        const defaults = {
            [this.STORAGE_KEYS.SHORT_TERM]: { domains: {}, total: 0 },
            [this.STORAGE_KEYS.LONG_TERM]: { domains: {}, total: 0 },
            [this.STORAGE_KEYS.GOALS]: { shortTerm: [], longTerm: [] },
            [this.STORAGE_KEYS.SHORT_TERM_MEMORY]: { domains: {}, lastUpdate: Date.now() },
            [this.STORAGE_KEYS.LONG_TERM_MEMORY]: { summaries: [], lastCleanup: Date.now() }
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