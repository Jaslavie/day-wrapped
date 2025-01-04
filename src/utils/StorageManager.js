class StorageManager {
    static STORAGE_KEYS = {
        SHORT_TERM: 'shortTermStats',
        LONG_TERM: 'longTermStats',
        GOALS: 'goals',
        USER_NAME: 'userName',
        SHORT_TERM_MEMORY: 'shortTermMemory',
        LONG_TERM_MEMORY: 'longTermMemory'
    };

    static async get(key) {
        return new Promise((resolve) => {
            chrome.storage.local.get([key], (result) => {
                resolve(result[key]);
            });
        });
    }

    static async set(key, value) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [key]: value }, resolve);
        });
    }

    static async getMultiple(keys) {
        return new Promise((resolve) => {
            chrome.storage.local.get(keys, resolve);
        });
    }
}

export default StorageManager; 