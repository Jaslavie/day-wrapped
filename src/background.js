/**
 * Tracks user's browsing history and stores in the chrome db
 * short term = websites visited in the last 24 hours
 * long term = websites visited in the last 30 days
 */

/**
 * Data is stored in chrome storage as key-value pairs:
 * shortTermMemory: [{url: string, time: number}],
 * longTermMemory: [{domain: string, visits: number}],
 * websites: [{url: string, time: number}],
 * topics: [{topic: string, time: number}],
 * goals: {shortTerm: string[], longTerm: string[]}
 * userName: string
 */

// handle extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log("Day Wrapped Extension Installed");
})

// function to store new data
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // if the tab is complete and has a url
    if (changeInfo.status === "complete" && tab.url) {
        const currentTime = Date.now();

        // get short term memory 
        chrome.storage.local.get(["shortTermMemory"], (data) => {
            const shortTermMemory = data.shortTermMemory || [];
            // filter out the websites that are older than 24 hrs
            const filteredShortTermMemory = shortTermMemory.filter(entry => 
                currentTime - entry.time <= 24 * 60 * 60 * 1000 
            );

            // add new entry and add to chrome storage
            filteredShortTermMemory.push({url: tab.url, time: currentTime});
            chrome.storage.local.set({ shortTermMemory: filteredShortTermMemory });

            // save long term memory every 24 hours
            if (currentTime - (shortTermMemory[0]?.time || 0) >= 30 * 24 * 60 * 60 * 1000) {
                saveToContext(shortTermMemory);
            }
        })
    }
})

// function to save memory to long term context
function saveToContext (memory) {
    chrome.storage.local.get(["longTermMemory"], (data) => {
        const longTermMemory = data.longTermMemory || [];
        // create new memory by combining long and short term memory
        const newContext = [...longTermMemory, ...memory];
        // optimize storage
        const optimizedContext = optimizeContext(newContext);
        // save to chrome storage
        chrome.storage.local.set({ longTermMemory: optimizedContext });
        console.log("Sample of long term memory:", optimizedContext.slice(0, 5));
    })
}

// function to optimize context by aggregating visits to each website
function optimizeContext(context) {
    // aggregate number of visits for each website
    const domainVisits = context.reduce((acc, entry) => {
        // extract domain from url
        const domain = new URL(entry.url).hostname;
        // increment count for the domain
        acc[domain] = (acc[domain] || 0) + 1;
        return acc;
    }, {});

    // create an array object mapping each domain to the number of visits
    return Object.entries(domainVisits).map(([domain, visits]) => ({
        domain,
        visits
    }))
}