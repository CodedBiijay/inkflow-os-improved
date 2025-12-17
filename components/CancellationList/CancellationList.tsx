import React from 'react';
import './CancellationList.css';

const waitlist = [
  { name: 'Sarah J', preference: 'Any artist • Afternoons', contacted: false },
  { name: 'Ben T', preference: 'Ashley only • Black & grey', contacted: true },
  { name: 'Maria K', preference: 'Weekends • Colour work', contacted: false },
];

export const CancellationList: React.FC = () => {
  return (
    <div className="cancel-container">
      <header className="cancel-header">
        <h2 className="cancel-title">Cancellation Waitlist</h2>
        <p className="cancel-subtitle">
          When a spot opens, fill it with your best-fit clients in minutes.
        </p>
      </header>
      <div className="waitlist-grid">
        {waitlist.map((item, i) => (
          <div key={i} className="waitlist-card">
            <div className="waitlist-info">
              <p className="waitlist-name">{item.name}</p>
              <p className="waitlist-pref">{item.preference}</p>
            </div>
            <button
              className={`waitlist-action ${item.contacted ? 'action-contacted' : 'action-notify'
                }`}
            >
              {item.contacted ? 'Contacted' : 'Notify about opening'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
