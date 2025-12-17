import React from 'react';
import './Settings.css';

export const Settings: React.FC = () => {
  return (
    <div className="settings-container">
      <header className="settings-header">
        <h2 className="settings-title">Studio settings</h2>
        <p className="settings-subtitle">
          High level settings that power automations and booking rules.
        </p>
      </header>
      <div className="settings-card">
        <div className="setting-group">
          <label className="setting-label">Default deposit amount</label>
          <input className="setting-input" placeholder="e.g. 100" />
        </div>
        <div className="setting-group">
          <label className="setting-label">Cancellation window (hours)</label>
          <input className="setting-input" placeholder="e.g. 48" />
        </div>
        <div className="setting-group">
          <label className="setting-label">% commission for most artists</label>
          <input className="setting-input" placeholder="e.g. 60" />
        </div>
        <p className="settings-note">
          In production these values would sync to your automations and payout reports.
        </p>
      </div>
    </div>
  );
};
