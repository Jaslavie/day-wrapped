import React, { useState, useEffect } from 'react';
import Skeleton from 'react-loading-skeleton';
import StorageManager from '../utils/StorageManager';
import 'react-loading-skeleton/dist/skeleton.css';

const Overview = ({loading}) => {
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
                const shortTermStats = await StorageManager.get(StorageManager.STORAGE_KEYS.SHORT_TERM);
                
                if (!shortTermStats || !isSubscribed) return;

                const totalTime = Object.values(shortTermStats.domains || {}).reduce((a, b) => a + b, 0);
                
                const topDomains = Object.entries(shortTermStats.domains || {})
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3) // return top 3 domains
                    .map(([domain, time]) => ({ // map the domains to the percentage of time spent
                        domain,
                        percentage: Math.round((time / totalTime) * 100)
                    }));

                setDomains(topDomains);
            } catch (error) {
                console.error('Error fetching domain stats:', error);
            }
        }

        // fetch data
        fetchDomainStats();

        chrome.storage.onChanged.addListener((changes) => {
            if (changes[StorageManager.STORAGE_KEYS.SHORT_TERM]) {
                fetchDomainStats();
            }
        });

        return () => {
            isSubscribed = false;
        };
    }, []);

    return (
        <div className="card overview">
            {loading ? (
                <Skeleton count={3} height={24} />
            ) : domains.length > 0 ? (
                domains.map(({domain, percentage}) => (
                    <div key={domain} className="item">
                        <span className="title">{percentage}%</span>
                        <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer">{domain}</a>
                    </div>
                ))
            ) : (
                <div className="no-data">No browsing data yet</div>
            )}
        </div>
   
    );
};

export default Overview;
