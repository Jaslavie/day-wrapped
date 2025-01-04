import React, { useState, useEffect } from 'react';
import StorageManager from '../utils/StorageManager';
import chevronUp from '../images/chevronUp.png';
import chevronDown from '../images/chevronDown.png';
import editIcon from '../images/editIcon.png';

const Goals = () => {
    /**
     * User enters goals which can be used for context in the summary
     * Goals are stored in two categories:
     * - short term goals for the day
     * - long term goals for their career and life
     */


    // goals
    const [goals, setGoals] = useState({ 
        shortTerm: [], // 24-hour goals
        longTerm: [] 
    });
    const [newGoal, setNewGoal] = useState("");
    const [goalType, setGoalType] = useState(null);

    // misc
    const [isExpanded, setIsExpanded] = useState(true);
    const [editIndex, setEditIndex] = useState({ type: null, index: null });
    const [editValue, setEditValue] = useState("");
    const [showAddInput, setShowAddInput] = useState(false);

    // load existing goals from chrome storage
    useEffect(() => {
        async function loadGoals() {
            const goals = await StorageManager.get(StorageManager.STORAGE_KEYS.GOALS);
            if (goals) {
                // Filter out expired short-term goals
                const now = Date.now();
                const filteredGoals = {
                    ...goals,
                    shortTerm: goals.shortTerm.filter(goal => 
                        now - goal.timestamp < 24 * 60 * 60 * 1000
                    ).map(goal => goal.text)
                };
                setGoals(filteredGoals);
            }
        }
        loadGoals();
    }, []);

    const handleAddGoal = (type) => {
        if (!newGoal.trim()) return;
        
        const updatedGoals = {...goals};
        if (type === 'shortTerm') {
            updatedGoals.shortTerm = [
                ...goals.shortTerm,
                { text: newGoal.trim(), timestamp: Date.now() }
            ];
        } else {
            updatedGoals.longTerm = [...goals.longTerm, newGoal.trim()];
        }

        StorageManager.set(StorageManager.STORAGE_KEYS.GOALS, updatedGoals);
        setGoals(updatedGoals);
        setNewGoal("");
        setShowAddInput(false); // change back to add more button
    };

    const handleEdit = () => {
        // pull all goals from chrome storage
        const updatedGoals = {...goals};
        // update the goal at the specified index
        updatedGoals[editIndex.type][editIndex.index] = editValue;
        // save to chrome storage
        chrome.storage.local.set({goals: updatedGoals});
        // update the local goal state
        setGoals(updatedGoals);
        setEditIndex({type: null, index: null});
        setEditValue("");
    };

    return (
        <div className="goals-container">
            {/* Short term goals section */}
            <div className="card goals">
                <div className="heading">
                    🌱 what are your goals for today?
                </div>
                <div className="goals-list">
                    <input
                        type="text"
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        placeholder="Type your goals..."
                        onKeyPress={(e) => e.key === 'Enter' && handleAddGoal('shortTerm')}
                    />  
                    {goals.shortTerm.map((goal, index) => (
                        <div key={`short-${index}`} className="goal-item short-term">
                            <input
                                type="checkbox"
                                id={`short-${index}`}
                                className="checkbox"
                            />
                            <label htmlFor={`short-${index}`}>{goal}</label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Long term goals section */}
            <div className="card goals">
                <div onClick={() => setIsExpanded(!isExpanded)}>
                    <div className="heading">
                        🚀 your long term goals
                        {isExpanded ? 
                            <img src={chevronUp} alt="chevron up" style={{ width: '20px', height: '20px' }} /> : 
                            <img src={chevronDown} alt="chevron down" style={{ width: '20px', height: '20px' }} />
                        }
                    </div>
                    <hr />
                </div>
                
                {/* content to show if expanded */}
                {isExpanded && (
                    <div className="goals-list">
                        {goals.longTerm.map((goal, index) => (
                            <div key={`long-${index}`} className="goal-item">
                                {editIndex.type === 'longTerm' && editIndex.index === index ? (
                                    <input
                                        type="text"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleEdit()}
                                        autoFocus
                                    />
                                ) : (
                                    <>
                                        <div className="text">{goal}</div>
                                        <button 
                                            className="edit"
                                            onClick={() => {
                                                setEditIndex({ type: 'longTerm', index });
                                                setEditValue(goal);
                                            }}
                                        >
                                            <img src={editIcon} alt="edit" style={{ width: '10px', height: '10px' }} />
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                        
                        {/* add new goal */}
                        {showAddInput ? (
                            <input
                                type="text"
                                value={newGoal}
                                onChange={(e) => setNewGoal(e.target.value)}
                                placeholder="Enter your long term goal..."
                                onKeyPress={(e) => e.key === 'Enter' && handleAddGoal('longTerm')}
                            />
                        ) : (
                            <button 
                                className="add-more"
                                onClick={() => setShowAddInput(true)}
                            >
                                + add more...
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Goals;