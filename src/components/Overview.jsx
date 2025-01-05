import React, { useState, useEffect } from 'react';
import Skeleton from 'react-loading-skeleton';
import StorageManager from '../utils/StorageManager';
import 'react-loading-skeleton/dist/skeleton.css';

const Overview = ({loading}) => {
    const [domains, setDomains] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isSubscribed = true;

        async function fetchDomainStats() {
            try {
                const shortTermMemory = await StorageManager.get(StorageManager.STORAGE_KEYS.SHORT_TERM_MEMORY);
                console.log('Short term memory:', shortTermMemory);

                // Use all visits, both from history and tracked
                const allVisits = shortTermMemory.filter(visit => {
                    try {
                        const url = new URL(visit.url);
                        return !url.hostname.startsWith('chrome://');
                    } catch (e) {
                        return false;
                    }
                });

                if (allVisits.length === 0) {
                    setError('No browsing data available');
                    setDomains([]);
                    return;
                }

                // Count domain occurrences from all sources
                const domainCounts = allVisits.reduce((acc, entry) => {
                    try {
                        const url = new URL(entry.url);
                        const domain = url.hostname;
                        acc[domain] = (acc[domain] || 0) + 1;
                    } catch (e) {
                        // Skip invalid URLs
                    }
                    return acc;
                }, {});

                const totalVisits = Object.values(domainCounts).reduce((a, b) => a + b, 0);

                // Calculate percentages using all visits
                const topDomains = Object.entries(domainCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([domain, visits]) => ({
                        domain,
                        percentage: Math.round((visits / totalVisits) * 100)
                    }));

                setDomains(topDomains);
            } catch (error) {
                console.error('Error fetching domain stats:', error);
                setError('Error analyzing browsing data');
            }
        }

        fetchDomainStats();

        const handleStorageChange = (changes) => {
            if (changes[StorageManager.STORAGE_KEYS.SHORT_TERM_MEMORY]) {
                fetchDomainStats();
            }
        };

        chrome.storage.onChanged.addListener(handleStorageChange);

        return () => {
            isSubscribed = false;
            chrome.storage.onChanged.removeListener(handleStorageChange);
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
                        <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer">
                            {domain}
                        </a>
                    </div>
                ))
            ) : (
                <div className="no-data">
                    {error || "No browsing data available"}
                </div>
            )}
        </div>
    );
};

export default Overview;
