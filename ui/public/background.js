/**
 * Tracks user's browsing history and stores in the chrome db
 */

// handle extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log("Day Wrapped Extension Installed");
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // if the tab is complete and has a url
    if (changeInfo.status === "complete" && tab.url) {
        const currentTime = Date.now();

        // get the websites from the chrome db
        chrome.storage.local.get(["websites"], (data) => {
            // create an empty array to store websites
            const websites = data.websites || [];
            // add the current website to the array
            websites.push({url: tab.url, time: currentTime});
            // store the websites in the chrome db
            chrome.storage.local.set({websites});
        })
    }
})