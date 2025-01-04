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
import { MonitoringService } from './utils/monitoring';

// Constants
const IDLE_TIMEOUT = 30; // seconds
const UPDATE_INTERVAL = 5000; // 5 seconds
const MONITORING_INTERVAL = 60000; // 1 minute

// State management
let activeTab = null;
let lastActiveTime = Date.now();

// Initialize monitoring
let monitoringInterval;

async function startMonitoring() {
    const usage = await MonitoringService.checkStorageUsage();
    console.log('Initial storage usage:', usage);
    
    monitoringInterval = setInterval(async () => {
        await MonitoringService.checkStorageUsage();
    }, MONITORING_INTERVAL);
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
async function handleTabChange(newTab) {
    if (activeTab) {
        const timeSpent = Date.now() - lastActiveTime;
        if (timeSpent >= UPDATE_INTERVAL) {
            await StorageManager.trackVisit(activeTab.url, timeSpent);
        }
    }

    activeTab = newTab;
    lastActiveTime = Date.now();
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