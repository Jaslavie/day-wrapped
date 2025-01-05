/**
 * Tracks user's browsing history and stores in the chrome db
 * short term = websites visited in the last 24 hours
 * long term = websites visited in the last 30 days
 */

/**
 * Updated data structure:
 * shortTermMemory: {
 *   summary: string,           // Natural language summary of sites visited
 *   lastUpdate: number,        // Timestamp of last update
 *   domains: {                 // Rolling count of domain visits
 *     [domain: string]: number
 *   }
 * }
 * longTermMemory: {
 *   summaries: [{             // Weekly summaries instead of raw data
 *     week: number,           // Week number
 *     summary: string,        // Natural language summary
 *     topDomains: [{domain: string, count: number}] // Limited to top 10
 *   }],
 *   lastCleanup: number
 * }
 */
import StorageManager from './utils/StorageManager';
import MonitoringService from './utils/monitoring';
// Constants
const IDLE_TIMEOUT = 30; // seconds
const UPDATE_INTERVAL = 60000; // 1 minute
const DAY_IN_MS = 86400000; // 24 hours in milliseconds

// State management
let activeTab = null;
let lastActiveTime = Date.now();

// Initialize monitoring
let monitoringInterval;

async function updateShortTermStats(domain, duration) {
    try {
        if (!activeTab?.url) return;
        
        const visit = {
            time: Date.now(),
            url: activeTab.url,
            duration: duration,
            id: `tracked-${Date.now()}`
        };

        await StorageManager.set(StorageManager.STORAGE_KEYS.SHORT_TERM_MEMORY, visit);
    } catch (error) {
        console.error('Error updating short term stats:', error);
    }
}

async function startMonitoring() {
    await StorageManager.initialize();
    
    monitoringInterval = setInterval(async () => {
        if (!activeTab?.url) return;

        try {
            const now = Date.now();
            const duration = Math.floor((now - lastActiveTime) / 1000);
            
            if (duration > 0) {
                const domain = new URL(activeTab.url).hostname;
                await updateShortTermStats(domain, duration);
                lastActiveTime = now;
            }
        } catch (error) {
            console.error('Error in monitoring interval:', error);
        }
    }, UPDATE_INTERVAL);

    // Add initial tab tracking
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (currentTab) {
        await handleTabChange(currentTab);
    }
}

// Installation and update handling
chrome.runtime.onInstalled.addListener(async () => {
    console.log("Day Wrapped Extension Installed");
    await StorageManager.initialize();
    await startMonitoring();
});

// Tab activity monitoring
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    handleTabChange(tab);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.active) {
        handleTabChange(tab);
    }
});

// Idle state detection
chrome.idle.onStateChanged.addListener((state) => {
    if (state === 'active') {
        lastActiveTime = Date.now();
    } else {
        handleInactiveState();
    }
});

// Cleanup on extension unload
chrome.runtime.onSuspend.addListener(async () => {
    if (monitoringInterval) {
        clearInterval(monitoringInterval);
    }
    await handleTabChange(null);
    await StorageManager.flush();
});

// Helper functions
async function handleTabChange(tab) {
    if (!tab?.url || tab.url.startsWith('chrome://')) return;

    const now = Date.now();
    
    // update short term stats if the user accessed a new tab
    if (activeTab && activeTab.url !== tab.url) {
        const duration = Math.floor((now - lastActiveTime) / 1000);
        if (duration > 0) {
            const oldDomain = new URL(activeTab.url).hostname;
            await updateShortTermStats(oldDomain, duration);
        }
    }
    
    activeTab = tab;
    lastActiveTime = now;
}

async function handleInactiveState() {
    if (activeTab) {
        const timeSpent = Date.now() - lastActiveTime;
        await StorageManager.trackVisit(activeTab.url, timeSpent);
        activeTab = null;
    }
}

// Set up idle detection
chrome.idle.setDetectionInterval(IDLE_TIMEOUT);