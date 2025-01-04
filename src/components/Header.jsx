import React, { useState, useEffect } from 'react';
import { getGreeting } from '../utils/getGreeting';
import StorageManager from '../utils/StorageManager';
const Header = () => {
    /**
     * Header component displays user's name and greeting
     */
    const [name, setName] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [greeting, setGreeting] = useState("");
    const [tempName, setTempName] = useState("");

    useEffect(() => {
        // try to load user name from storage
        async function loadUserName() {
            const name = await StorageManager.get(StorageManager.STORAGE_KEYS.USER_NAME);
            if (name) {
                setName(name);
            } else {
                setIsEditing(true); // Force editing mode if no name exists
            }
        }

        // set initial greeting
        setGreeting(getGreeting());

        // load user name
        loadUserName();
    }, []);

    // handle name change
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!tempName.trim()) return;

        await StorageManager.set(StorageManager.STORAGE_KEYS.USER_NAME, tempName.trim());
        setName(tempName.trim());
        setIsEditing(false);
    }

    const startEditing = () => {
        setTempName(name);
        setIsEditing(true);
    }

    const handleCancel = () => {
        if (name) { // Only allow cancel if name exists
            setTempName(name);
            setIsEditing(false);
        }
    }

    // return if not editing
    return (
        <div className="header">
            <div className="heading">
                {/* set greeting and name*/}
                {greeting} {' '}
                {/* set name input if is editing*/}
                {isEditing ? (
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onBlur={name ? handleCancel : undefined}
                            placeholder="Enter your name..."
                            autoFocus
                            required
                        />
                    </form>
                ) : (
                <div
                    onMouseEnter={startEditing}
                    onMouseLeave={handleCancel}
                    className="username"
                >
                        {name}
                </div>
                )}
            </div>
        </div>
    )
}

export default Header;