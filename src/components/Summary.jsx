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
        const sections = {
            shortTerm: '',
            longTerm: '',
            goalAlignment: '',
            oneLiner: ''
        };

        let currentSection = '';
        const lines = text.split('\n');
        
        for (const line of lines) {
            const sectionMatch = line.match(/\[(\w+)\]/);
            if (sectionMatch) {
                currentSection = sectionMatch[1].toUpperCase();
                continue;
            }
            
            switch (currentSection) {
                case 'SHORT_TERM':
                    sections.shortTerm += line + '\n';
                    break;
                case 'LONG_TERM':
                    sections.longTerm += line + '\n';
                    break;
                case 'GOAL_ALIGNMENT':
                    sections.goalAlignment += line + '\n';
                    break;
                case 'ONE_LINER':
                    sections.oneLiner += line + '\n';
                    break;
                default:
                    console.warn(`Unknown section: ${currentSection}`);
                    break;
            }
        }

        // Trim whitespace
        Object.keys(sections).forEach(key => {
            sections[key] = sections[key].trim();
        });

        return sections;
    };

    return (
        <div className="card summary">
            <div className="heading">Summary of your day</div>
            <button
                onClick = {handleSummarize}
                className="generate"
            >
                generate!
            </button>
            {(summary.shortTerm || summary.goalAlignment || summary.oneLiner) && (
                <div className="summary-container">
                    <div className="summary-section">
                        <div className="subheading">⚡️ one-liner</div>
                        <p>{summary.oneLiner}</p>
                    </div>
                    <div className="summary-section">
                        <div className="subheading">📝️ alignment with goals</div>
                        <p>{summary.goalAlignment}</p>
                    </div>
                    <div className="summary-section">
                        <div className="subheading">✨ today's summary</div>
                        <p>{summary.shortTerm}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Summary;