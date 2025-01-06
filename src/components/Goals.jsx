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
    const [checkedGoals, setCheckedGoals] = useState(new Set());
    const [goalType, setGoalType] = useState(null);

    // misc
    const [isExpanded, setIsExpanded] = useState(true);
    const [editIndex, setEditIndex] = useState({ type: null, index: null });
    const [editValue, setEditValue] = useState("");
    const [showAddInput, setShowAddInput] = useState(false);

    // handle data loading
    useEffect(() => {
        async function loadGoals() {
            const goals = await StorageManager.get(StorageManager.STORAGE_KEYS.GOALS);
            const checkedGoalsData = await StorageManager.get('checkedGoals') || new Set();
            
            if (goals) {
                // Filter out expired short-term goals
                const now = Date.now();
                const filteredGoals = {
                    ...goals,
                    shortTerm: goals.shortTerm
                        .filter(goal => now - goal.timestamp < 24 * 60 * 60 * 1000)
                        .map(goal => ({
                            id: goal.id || goal.timestamp,
                            text: goal.text,
                            timestamp: goal.timestamp
                        }))
                };
                setGoals(filteredGoals);
                setCheckedGoals(new Set(checkedGoalsData));
            }
        }
        loadGoals();
    }, []);

    const handleAddGoal = (type) => {
        if (!newGoal.trim()) return;
        
        const updatedGoals = {...goals};
        if (type === 'shortTerm') {
            const newId = Date.now();
            updatedGoals.shortTerm = [
                ...goals.shortTerm,
                { 
                    id: newId,
                    text: newGoal.trim(), 
                    timestamp: Date.now()
                }
            ];
        } else {
            updatedGoals.longTerm = [...goals.longTerm, newGoal.trim()];
        }

        StorageManager.set(StorageManager.STORAGE_KEYS.GOALS, updatedGoals);
        setGoals(updatedGoals);
        setNewGoal("");
    };

    // handle clearing of short term goals
    const handleClearGoal = (goalId) => {
        const updatedGoals = {...goals};
        updatedGoals.shortTerm = goals.shortTerm.filter(goal => goal.id !== goalId); // remove goal from short term goals
        
        // remove from memory
        StorageManager.set(StorageManager.STORAGE_KEYS.GOALS, updatedGoals);
        setGoals(updatedGoals);

        // remove checked goals
        if (checkedGoals.has(goalId)) {
            const newCheckedGoals = new Set(checkedGoals); // create a new set for checked goals
            newCheckedGoals.delete(goalId);
            setCheckedGoals(newCheckedGoals);
            StorageManager.set('checkedGoals', Array.from(newCheckedGoals));
        }
    }

    // handle clean up when goals change
    useEffect(() => {
        // remove expired short term goals
        const cleanup = setInterval(() => {
            const now = Date.now();
            const updatedGoals = {
                ...goals,
                shortTerm: goals.shortTerm.filter(goal =>
                    now - goal.timestamp < 24 * 60 * 60 * 1000
                )
            };

            if (updatedGoals.shortTerm.length !== goals.shortTerm.length) {
                StorageManager.set(StorageManager.STORAGE_KEYS.GOALS, updatedGoals);
                setGoals(updatedGoals);
            }
        }, 1000 * 60 * 60 * 24); // run every 24 hours

        return () => clearInterval(cleanup);
    }, [goals]);

    const handleCheckGoal = (goalId) => {
        const newCheckedGoals = new Set(checkedGoals);
        if (newCheckedGoals.has(goalId)) {
            newCheckedGoals.delete(goalId);
        } else {
            newCheckedGoals.add(goalId);
        }
        setCheckedGoals(newCheckedGoals);
        StorageManager.set('checkedGoals', Array.from(newCheckedGoals));
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
                    {goals.shortTerm.map((goal) => (
                        <div key={goal.id} className="goal-item short-term">
                            <input
                                type="checkbox"
                                id={`goal-${goal.id}`}
                                checked={checkedGoals.has(goal.id)}       // check if goal is checked off
                                onChange={() => handleCheckGoal(goal.id)} // handle checkbox click
                                className="checkbox"
                            />
                            <label 
                                htmlFor={`goal-${goal.id}`}
                                style={{ 
                                    textDecoration: checkedGoals.has(goal.id) ? 'line-through' : 'none',
                                    color: checkedGoals.has(goal.id) ? '#666' : 'inherit'
                                }}
                            >
                                {goal.text}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Long term goals section */}
            <div className="card goals" style={{ gap: '0px' }}>
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
                            <div className="input-container">
                                <input
                                    type="text"
                                    value={newGoal}
                                    onChange={(e) => setNewGoal(e.target.value)}
                                    placeholder="Enter your long term goal..."
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddGoal('longTerm')}
                                    style={{ marginTop: '12px' }}
                                />
                                <button onClick={() => setShowAddInput(false)}>
                                    X
                                </button>
                            </div>
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