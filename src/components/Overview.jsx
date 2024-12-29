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

    // get domains from chrome storage
    useEffect(() => {
        if (chrome?.storage?.local) {
            chrome.storage.local.get(['shortTermMemory'], (data) => {
                if (data.shortTermMemory) {
                    // Calculate domain percentages based on time spent
                    const domainTimes = {};
                    const totalTime = data.shortTermMemory.reduce((sum, entry) => {
                        const timeSpent = entry.time || 0;
                        return sum + timeSpent; // sum up the total time spent on all domains
                    }, 0);

                    // Sum up time spent on each domain
                    data.shortTermMemory.forEach(entry => {
                        const domain = new URL(entry.url).hostname; // ex: github.com
                        const timeSpent = entry.time || 0; // ex: 10000 ms
                        domainTimes[domain] = (domainTimes[domain] || 0) + timeSpent; // ex: {github.com: 10000}
                    });

                    // Convert to percentages and sort
                    const sortedDomains = Object.entries(domainTimes)
                        .map(([domain, time]) => ({
                            domain,
                            percentage: Math.round((time / totalTime) * 100)
                        }))
                        .sort((a, b) => b.percentage - a.percentage)
                        .slice(0, 3); // Get top 3 domains

                    setDomains(sortedDomains);
                }
            });
        }
    }, []);

    return (
        <div className="card overview">
            {domains.map(({domain, percentage}) => (
                <div key = {domain} className="item">
                    <div className="title">{percentage}%</div>
                    <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer">{domain}</a>
                </div>
            ))}
        </div>
    )
}

export default Overview;