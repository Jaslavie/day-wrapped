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
        } finally {
            setLoading(false);
        }
    }

    const parseSummary = (text) => {
        const sections = {
            shortTerm: '',
            longTerm: '',
            goalAlignment: '',
            oneLiner: ''
        };

        // If no section markers are found, split into logical sections
        if (!text.includes('[')) {
            const sentences = text.split(/[.!?]+/).filter(s => s.trim());
            
            if (sentences.length >= 3) {
                sections.shortTerm = sentences[0].trim() + '.';
                sections.goalAlignment = sentences[1].trim() + '.';
                sections.oneLiner = sentences[sentences.length - 1].trim() + '.';
            } else {
                sections.shortTerm = text.trim();
            }
            
            return sections;
        }

        // Parse sections with markers
        const markers = {
            '[SHORT_TERM]': 'shortTerm',
            '[LONG_TERM]': 'longTerm',
            '[GOAL_ALIGNMENT]': 'goalAlignment',
            '[ONE_LINER]': 'oneLiner'
        };

        Object.entries(markers).forEach(([marker, sectionKey]) => {
            const startIndex = text.indexOf(marker);
            if (startIndex !== -1) {
                const nextMarkerIndex = Math.min(
                    ...Object.keys(markers)
                        .map(m => text.indexOf(m, startIndex + marker.length))
                        .filter(i => i !== -1),
                    text.length
                );
                
                const content = text.slice(startIndex + marker.length, nextMarkerIndex).trim();
                sections[sectionKey] = content;
            }
        });

        return sections;
    };

    return (
        <div>
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
                                <p>{summary.oneLiner || "No summary available"}</p>
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