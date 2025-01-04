import React, { useState, useEffect } from 'react';

const Overview = () => {
    /**
     * Percentage of time spent on each topic (ex: coding, company research, etc.)
     * Percentage of time spent on each website (ex: google, github, etc.)
     * 
     * The domains are sorted in the following data structure, with the number representing percentage of time spent:
     * [
     *  ['github.com', 10],
     *  ['google.com', 5],
     *  ['linkedin.com', 3]
     * ]
     */
    const [domains, setDomains] = useState([]);

    useEffect(() => {
        /**
         * Fetch data from chrome storage and listen for changes
         */
        let isSubscribed = true; // subscription flag to the chrome stream

        // fetch the data from chrome storage
        async function fetchDomainStats() {
            try {
                const { shortTermStats } = await chrome.storage.local.get(StorageManager.STORAGE_KEYS.SHORT_TERM);

                if (!shortTermStats || !isSubscribed) return;

                const topDomains = Object.entries(shortTermStats.domains)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3) // return top 3 domains
                    .map(([domain, time]) => ({ // map the domains to the percentage of time spent
                        domain,
                        percentage: Math.round((time / shortTermStats.total) * 100)
                    }));

                setDomains(topDomains);
            } catch (error) {
                console.error('Error fetching domain stats:', error);
            }
        };

        // fetch data
        fetchDomainStats();

        // listen for changes 
        const storageListener = (changes) => {
            if (changes[StorageManager.STORAGE_KEYS.SHORT_TERM]) {
                fetchDomainStats();
            }
        };

        // when changed, fetch data
        chrome.storage.onChanged.addListener(storageListener);

        // unsubscribe from the chrome stream
        return () => {
            isSubscribed = false;
            chrome.storage.onChanged.removeListener(storageListener);
        }

    }, []);

    return (
        <div className="card overview">
            {domains.map(({domain, percentage}) => (
                <div key={domain} className="item">
                    <div className="title">{percentage}%</div>
                    <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer">
                        {domain}
                    </a>
                </div>
            ))}
        </div>
    );
};

export default Overview;