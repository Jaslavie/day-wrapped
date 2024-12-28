import React, { useState, useEffect } from 'react';

const Goals = () => {
    /**
     * User enters goals which can be used for context in the summary
     * Goals are stored in two categories:
     * - short term goals for the day
     * - long term goals for their career and life
     */

    // data
    const [shortTermGoal, setShortTermGoal] = useState("");
    const [longTermGoal, setLongTermGoal] = useState("");
    const [goals, setGoals] = useState({ shortTerm: [], longTerm: []});

    // goals
    const [isExpanded, setIsExpanded] = useState(true);
    const [editIndex, setEditIndex] = useState({ type: null, index: null });
    const [editValue, setEditValue] = useState("");

    // load existing goals
    useEffect(() => {
        chrome.storage.local.get(['goals'], (data) => {
            if (data.goals) setGoals(data.goals);
        })
    }, [])

    // handle goal submission
    const handleSubmit = (e) => {
        e.preventDefault();
        
        // update goals based on use input
        const updatedGoals = {
            shortTerm: shortTermGoal ? [...goals.shortTerm, shortTermGoal] : goals.shortTerm,
            longTerm: longTermGoal ? [...goals.longTerm, longTermGoal] : goals.longTerm,
        }

        // save to chrome storage
        chrome.storage.local.set({ goals: updatedGoals });
        setGoals(updatedGoals);

        // clear input fields
        setShortTermGoal("");
        setLongTermGoal("");
    };

    /**
     * handle goal editing
     * @param {string} type - "shortTerm" or "longTerm"
     * @param {number} index - index of the goal to edit
     * @param {string} value - new value for the goal
     */
    const startEdit = (type, index, value) => {
        setEditIndex({ type, index }); // set the index of the goal to edit
        setEditValue(value); // set the value of the goal to edit
    }

    const handleEdit = () => {
        const updatedGoals = {...goals};
        // update the goal at the specified index
        updatedGoals[editIndex.type][editIndex.index] = editValue;
        // save to chrome storage
        chrome.storage.local.set({goals: updatedGoals});
        // update the local goal state
        setGoals(updatedGoals);
        // clear the edit state
        setEditIndex({type:null, index:null});
    }

    return (
        <div className="card goals">
            {/* form to add goals */}
            <form onSubmit={handleSubmit}>
                <div className="input-wrapper">
                    <input 
                        type="text" 
                        placeholder="Short term goal"
                        value={shortTermGoal}
                        onChange={(e) => setShortTermGoal(e.target.value)}
                    />
                    <input 
                        type="text" 
                        placeholder="Long term goal"
                        value={longTermGoal}
                        onChange={(e) => setLongTermGoal(e.target.value)}
                    />
                    <button type="submit">Add goals</button>
                </div>
            </form>

            {/* toggle long term goals */}
            <div className="heading" 
                onClick={() => setIsExpanded(!isExpanded)}
                style={{cursor: "pointer"}}
            >
                Set your goals
                <span>
                    {isExpanded ? '▼' : '▶'}
                </span>
            </div>
            
            {/* content to show if expanded */}
            {!isExpanded && (
                <>
                    {/* collapsible list of goals */}
                    <div className="collapsable goals">
                        <div className="heading">Goals</div>
                        {goals.longTerm.length > 0 && (
                            <div>
                                <div className="subheading">Long term goals</div>
                                <ul>
                                    {goals.longTerm.map((goal, index) => (
                                        <li key = {`long-${index}`}>{goal}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

export default Goals;