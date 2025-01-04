import React, { useState, useEffect } from 'react';
import StorageManager from '../utils/StorageManager';

const Goals = () => {
    /**
     * User enters goals which can be used for context in the summary
     * Goals are stored in two categories:
     * - short term goals for the day
     * - long term goals for their career and life
     */


    // goals
    const [goals, setGoals] = useState({ shortTerm: [], longTerm: [] }); // goals stored in chrome storage
    const [newGoal, setNewGoal] = useState(""); // new goal added by user to long term goals

    // misc
    const [isExpanded, setIsExpanded] = useState(true);
    const [editIndex, setEditIndex] = useState({ type: null, index: null });
    const [editValue, setEditValue] = useState("");
    const [showAddInput, setShowAddInput] = useState(false);

    // load existing goals from chrome storage
    useEffect(() => {
        async function loadGoals() {
            const goals = await StorageManager.get(StorageManager.STORAGE_KEYS.GOALS);
            if (goals) setGoals(goals);
        }
        loadGoals();
    }, []);

    const handleAddGoal = () => {
        if (!newGoal.trim()) return; 
        
        // update goals based on user input
        const updatedGoals = {
            ...goals,
            longTerm: [...goals.longTerm, newGoal.trim()]
        };

        // save to chrome storage
        chrome.storage.local.set({ goals: updatedGoals });
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
        <div className="card goals">
            <div onClick={() => setIsExpanded(!isExpanded)}>
                <div className="heading">
                    🚀 your long term goals
                    {isExpanded ? 
                        <i className="fa-solid fa-chevron-up" style={{color: '#606060'}}></i> : 
                        <i className="fa-solid fa-chevron-down" style={{color: '#606060'}}></i>
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
                                <div className="edit-mode">
                                    <input
                                        type="text"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                                    />
                                </div>
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
                                        <i className="fa-solid fa-pencil" style={{color: '#606060'}}></i>
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                    
                    {/* add new goal */}
                    {showAddInput ? (
                        <div className="add-goal-input">
                            <input
                                type="text"
                                value={newGoal}
                                onChange={(e) => setNewGoal(e.target.value)}
                                placeholder="Enter your long term goal..."
                                onKeyPress={(e) => e.key === 'Enter' && handleAddGoal()}
                            />
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
    );
};

export default Goals;