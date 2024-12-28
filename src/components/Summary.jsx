import React, { useState, useEffect } from 'react';
import { summarizeDay } from '../utils/summarizeDay';

const Summary = () => {
    /**
     * AI summary of person's day
     * Alignment with user goals
     */
    const [summary, setSummary] = useState("");

    // fetch data
    useEffect(() => {
        const fetchData = async () => {
            chrome.storage.local.get(["websites", "topics"], async (data) => {
                const websites = data.websites;
                const topics = data.topics;
                const summary = await summarizeDay(websites, topics);
                setSummary(summary);
            })
        }
        fetchData();
    }, [])
    return (
        <div className="card summary">
            <div className="heading">Summary</div>
            <div className="content">{summary}</div>
        </div>
    )
}

export default Summary;