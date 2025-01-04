import React, { useState, useEffect } from 'react';
import { getGreeting } from '../utils/getGreeting';

const Header = () => {
    /**
     * Header component displays user's name and greeting
     */
    const [name, setName] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [greeting, setGreeting] = useState("");

    useEffect(() => {
        // Check if chrome.storage exists before using it
        if (chrome?.storage?.local) {
            chrome.storage.local.get(['userName'], (data) => {
                if (data.userName) setName(data.userName);
            });
        }

        // set initial greeting
        setGreeting(getGreeting());

        // update greeting every start of an hour
        const interval = setInterval(() => {
            setGreeting(getGreeting());
        }, 60 * 60 * 1000);

        // clean up interval on unmount
        return () => clearInterval(interval);
    }, []);

    const handleNameChange = (e) => {
        const newName = e.target.value;
        setName(newName);
        if (chrome?.storage?.local) {
            chrome.storage.local.set({ userName: newName });
        }
    }

    return (
        <div className="header">
            <div className="heading">
                {/* set greeting and name*/}
                {greeting} {' '}
                {/* set name input */}
                {isEditing ? (
                    <input
                        type="text"
                        value={name}
                        onChange={handleNameChange}
                        onBlur={() => setIsEditing(false)}
                        autoFocus
                    />
                ) : (
                <span
                    onMouseEnter={() => setIsEditing(true)}
                >
                        {name}
                    </span>
                )}
            </div>
        </div>
    )
}

export default Header;