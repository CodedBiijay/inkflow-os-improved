import React from 'react';
import './POS.css';

export const POS: React.FC = () => {
  return (
    <div className="pos-container">
      <header className="pos-header">
        <h2 className="pos-title">POS & Payments</h2>
        <p className="pos-subtitle">
          Take session payments, record deposits and see what each artist earned.
        </p>
      </header>
      <div className="pos-card">
        <div className="form-grid cols-2">
          <div className="form-group">
            <label className="form-label">Client</label>
            <input className="form-input" placeholder="Search clients..." />
          </div>
          <div className="form-group">
            <label className="form-label">Artist</label>
            <input className="form-input" placeholder="Select artist..." />
          </div>
        </div>
        <div className="form-grid cols-3">
          <div className="form-group">
            <label className="form-label">Session total</label>
            <input className="form-input" placeholder="e.g. 450" />
          </div>
          <div className="form-group">
            <label className="form-label">Deposit applied</label>
            <input className="form-input" placeholder="e.g. 100" />
          </div>
          <div className="form-group">
            <label className="form-label">Payment method</label>
            <select className="form-select">
              <option>Card</option>
              <option>Cash</option>
              <option>E-transfer</option>
            </select>
          </div>
        </div>
        <div className="summary-row">
          <p>
            Studio share: <span className="financial-value">$180</span>
          </p>
          <p>
            Artist earns: <span className="financial-value">$270</span>
          </p>
        </div>
        <button className="pos-btn">Record payment</button>
        <p className="pos-note">
          In production this would push to Stripe and your accounting software.
        </p>
      </div>
    </div>
  );
};
