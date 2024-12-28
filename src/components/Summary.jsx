import React, { useState } from 'react';
import { summarizeDay } from '../utils/summarizeDay';

const Summary = () => {
    /**
     * AI summary of person's day
     * Alignment with user goals
     */
    const [summary, setSummary] = useState({
        shortTerm: "",
        longTerm: "",
        goalAlignment: "",
        oneLiner: ""
    });

    // fetch data
    const handleSummarize = async () => {
        try {
            // get the data from chrome storage and summarize the day
            const { websites, topics } = await chrome.storage.local.get(["websites", "topics"]);
            const rawSummary = await summarizeDay(websites || [], topics || []);
            
            if (!rawSummary) {
                throw new Error("Failed to generate summary");
            }
            
            const sections = parseSummary(rawSummary);
            setSummary(sections);
        } catch (error) {
            console.error("Error summarizing day:", error);
            setSummary({
                shortTerm: "Error generating summary. Please check your API key and try again.",
                longTerm: "",
                goalAlignment: "",
                oneLiner: ""
            });
        }
    }

    const parseSummary = (text) => {
        if (!text || typeof text !== 'string') {
            throw new Error("Invalid summary format");
        }

        const sections = {
            shortTerm: "",
            longTerm: "",
            goalAlignment: "",
            oneLiner: ""
        };

        const parts = text.split(/\[(\w+)\]/);
        
        for (let i = 1; i < parts.length - 1; i += 2) {
            const section = parts[i];
            const content = parts[i + 1] || "";
            
            switch (section.toUpperCase()) {
                case 'SHORT_TERM':
                    sections.shortTerm = content.trim();
                    break;
                case 'LONG_TERM':
                    sections.longTerm = content.trim();
                    break;
                case 'GOAL_ALIGNMENT':
                    sections.goalAlignment = content.trim();
                    break;
                case 'ONE_LINER':
                    sections.oneLiner = content.trim();
                    break;
                default:
                    console.warn(`Unknown section: ${section}`);
                    break;
            }
        }

        return sections;
    };

    return (
        <div className="card summary">
            <div className="heading">Summary of your day</div>
            <button
                onClick = {handleSummarize}
            >
                Generate summary
            </button>
            {(summary.shortTerm || summary.longTerm || summary.goalAlignment || summary.oneLiner) && (
                <div className="summary-container">
                    <div className="summary-section">
                        <div className="subheading">Today's summary</div>
                        <p>{summary.shortTerm}</p>
                    </div>
                    <div className="summary-section">
                        <div className="subheading">Long term summary</div>
                        <p>{summary.longTerm}</p>
                    </div>
                    <div className="summary-section">
                        <div className="subheading">Goal alignment</div>
                        <p>{summary.goalAlignment}</p>
                    </div>
                    <div className="summary-section">
                        <div className="subheading">One liner</div>
                        <p>{summary.oneLiner}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Summary;