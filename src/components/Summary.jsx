import React, { useState } from 'react';
import { summarizeDay } from '../utils/summarizeDay';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import Overview from './Overview';
import StorageManager from '../utils/StorageManager';

const Summary = () => {
    /**
     * AI summary of person's day
     * Alignment with user goals
     */

    // data structure for summary
    const [summary, setSummary] = useState({
        shortTerm: "",
        longTerm: "",
        goalAlignment: "",
        oneLiner: ""
    });
    
    const [loading, setLoading] = useState(false);
    const [showContent, setShowContent] = useState(false);

    // fetch data
    const handleSummarize = async () => {
        setLoading(true);
        try {
            const shortTermStats = await StorageManager.get(StorageManager.STORAGE_KEYS.SHORT_TERM);
            const weeklyStats = await StorageManager.get(StorageManager.STORAGE_KEYS.WEEKLY);
            
            const rawSummary = await summarizeDay();
            console.log('Raw summary:', rawSummary);
            
            if (!rawSummary) {
                throw new Error("Failed to generate summary");
            }
            
            const sections = parseSummary(rawSummary);
            console.log('Parsed sections:', sections);  // Debug log
            
            setSummary(sections);
            setShowContent(true);
        } catch (error) {
            console.error("Error summarizing day:", error);
            setSummary({
                shortTerm: "Error generating summary. Please check your API key and try again.",
                longTerm: "",
                goalAlignment: "",
                oneLiner: ""
            });
        } finally {
            setLoading(false);
        }
    }

    const parseSummary = (text) => {
        // initialize section objects
        const sections = {
            shortTerm: '',
            longTerm: '',
            goalAlignment: '',
            oneLiner: ''
        };

        let currentSection = null;
        const lines = text.split('\n');

        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (trimmedLine.includes('[SHORT_TERM]')) {
                currentSection = 'shortTerm';
                sections[currentSection] = trimmedLine.replace('[SHORT_TERM]', '').trim();
                continue;
            } else if (trimmedLine.includes('[LONG_TERM]')) {
                currentSection = 'longTerm';
                sections[currentSection] = trimmedLine.replace('[LONG_TERM]', '').trim();
                continue;
            } else if (trimmedLine.includes('[GOAL_ALIGNMENT]')) {
                currentSection = 'goalAlignment';
                sections[currentSection] = trimmedLine.replace('[GOAL_ALIGNMENT]', '').trim();
                continue;
            } else if (trimmedLine.includes('[ONE_LINER]')) {
                currentSection = 'oneLiner';
                sections[currentSection] = trimmedLine.replace('[ONE_LINER]', '').trim();
                continue;
            }

            if (currentSection && trimmedLine && !trimmedLine.startsWith('[')) {
                sections[currentSection] += ' ' + trimmedLine;
            }
        }

        // Clean up extra spaces
        Object.keys(sections).forEach(key => {
            sections[key] = sections[key].trim();
        });

        return sections;
    };

    return (
        <div className="card summary">
            <div className="heading">Summary of your day</div>
            <button
                onClick={handleSummarize}
                className="generate"
                disabled={loading}
            >
                {loading ? 'generating...' : 'generate!'}
            </button>
            
            {(loading || showContent) && (
                <>
                    <Overview loading={loading} />
                    <div className="summary-container">
                        <div className="summary-section">
                            <div className="subheading">⚡️ one-liner</div>
                            <hr />
                            {loading ? (
                                <Skeleton count={2} height={20} />
                            ) : (
                                <p>{summary.oneLiner}</p>
                            )}
                        </div>
                        <div className="summary-section">
                            <div className="subheading">📝️ alignment with goals</div>
                            <hr />
                            {loading ? (
                                <Skeleton count={3} height={20} />
                            ) : (
                                <p>{summary.goalAlignment}</p>
                            )}
                        </div>
                        <div className="summary-section">
                            <div className="subheading">✨ today's summary</div>
                            <hr />
                            {loading ? (
                                <Skeleton count={4} height={20} />
                            ) : (
                                <p>{summary.shortTerm}</p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default Summary;