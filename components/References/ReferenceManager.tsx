import React from 'react';
import './ReferenceManager.css';

export const ReferenceManager: React.FC = () => {
    return (
        <div className="ref-container">
            <header className="ref-header">
                <h2 className="ref-title">Reference Manager</h2>
                <p className="ref-subtitle">
                    Organize client inspo, healed work, and flash sheets.
                </p>
            </header>
            <div className="coming-soon-card">
                <div className="icon-placeholder">✨</div>
                <h3 className="ref-title" style={{ fontSize: '1.5rem' }}>Coming Soon</h3>
                <p className="coming-soon-text">
                    We&apos;re building a visual database for all your tattoo references.
                    Soon you&apos;ll be able to tag, search, and attach images directly to client projects.
                </p>
                <button className="notify-btn">Notify me when ready</button>
            </div>
        </div>
    );
};
