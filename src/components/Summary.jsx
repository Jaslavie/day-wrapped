import React, { useState, useEffect } from 'react';
import { summarizeDay } from '../utils/summarizeDay';

const Summary = () => {
    /**
     * AI summary of person's day
     * Alignment with user goals
     */
    const [summary, setSummary] = useState("");

    // fetch data
    const handleSummarize = async () => {
        try {
            // get the data from chrome storage and summarize the day
            const { websites, topics } = await chrome.storage.local.get(["websites", "topics"]);
            const summary = await summarizeDay(websites || [], topics || []);
            setSummary(summary);
        } catch (error) {
            console.error("Error summarizing day:", error);
            setSummary("Error summarizing day");
        }
    }

    return (
        <div className="card summary">
            <div className="heading">Summary of your day</div>
            <button
                onClick = {handleSummarize}
            >
               Generate summary
            </button>
            {summary && (
                <div className="content">{summary}</div>
            )}
        </div>
    )
}

export default Summary;