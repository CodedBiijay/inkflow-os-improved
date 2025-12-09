import React from 'react';
import './OfferDates.css';

export const OfferDates: React.FC = () => {
  return (
    <div className="offer-dates-container">
      <header className="offer-header">
        <h2 className="offer-title">Offer Appointment Dates</h2>
        <p className="offer-subtitle">
          Pick a few options, we&apos;ll send them to the client and track who books first.
        </p>
      </header>
      <div className="offer-card">
        <div>
          <label className="input-label">Client</label>
          <input
            className="date-input w-full"
            placeholder="Start typing a client name..."
          />
        </div>

        <div>
          <label className="input-label">
            Choose up to 3 times to offer
          </label>
          <div className="date-inputs">
            <input type="datetime-local" className="date-input" />
            <input type="datetime-local" className="date-input" />
            <input type="datetime-local" className="date-input" />
          </div>
        </div>

        <button className="send-btn">
          Send booking options
        </button>
        <p className="disclaimer">
          In the real system this would text/email the client and reserve these slots for 24 hours.
        </p>
      </div>
    </div>
  );
};
