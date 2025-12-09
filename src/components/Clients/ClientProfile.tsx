import React from 'react';
import type { Client } from '../../types/client';
import './ClientProfile.css';

interface Props {
  client: Client;
}

export const ClientProfile: React.FC<Props> = ({ client }) => {
  return (
    <div className="profile-container">
      <div className="profile-header-card">
        <div>
          <h2 className="profile-name">{client.name}</h2>
          <div className="profile-contact">
            <p>{client.email}</p>
            <p>{client.phone}</p>
          </div>
        </div>
        <div className="profile-meta">
          <span
            className={`meta-status ${client.status === 'Flagged'
                ? 'flagged'
                : client.status === 'Booked'
                  ? 'booked'
                  : 'lead'
              }`}
          >
            {client.status}
          </span>
          <p className="meta-financial">
            Total spent: <span className="financial-value">${client.totalSpent}</span>
          </p>
          <p className="meta-financial">
            Deposit paid:{' '}
            <span
              className={`financial-value ${client.depositPaid ? 'financial-positive' : 'financial-negative'
                }`}
            >
              {client.depositPaid ? 'Yes' : 'No'}
            </span>
          </p>
        </div>
      </div>

      <div className="profile-grid">
        <div className="detail-card">
          <h3 className="detail-title">Flags & safety notes</h3>
          <p className="detail-text">{client.notes}</p>
        </div>
        <div className="detail-card">
          <h3 className="detail-title">Project quick view</h3>
          <p className="detail-row">
            Next step: <span className="detail-value">Consult & design briefing</span>
          </p>
          <p className="detail-row">
            Preferred artist: <span className="detail-value">Ashley (floral, colour)</span>
          </p>
          <p className="detail-text" style={{ fontSize: '0.7rem', marginTop: '1rem', fontStyle: 'italic' }}>
            In production this would pull from the live project pipeline and calendar.
          </p>
        </div>
      </div>

      <div className="detail-card">
        <h3 className="detail-title">Design references</h3>
        {client.savedDesigns.length === 0 ? (
          <p className="detail-text">
            No references yet. In the full system, photos from email, Instagram DMs or uploads
            would appear here automatically.
          </p>
        ) : (
          <div className="reference-grid">
            {client.savedDesigns.map((url, i) => (
              <div key={i} className="reference-placeholder" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
