import React, { useState } from 'react';
import type { Client } from '../../types/client';
import { ClientProfile } from './ClientProfile';
import './Clients.css';

const INITIAL_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'Sarah Jenkins',
    email: 'sarah.j@example.com',
    phone: '555-0123',
    status: 'Booked',
    depositPaid: true,
    totalSpent: 450,
    notes:
      'Looking for a floral sleeve. Very nervous about pain. Has eczema on left arm. Start with shoulder cap.',
    savedDesigns: [],
  },
  {
    id: '2',
    name: 'Mike Ross',
    email: 'm.ross@example.com',
    phone: '555-0199',
    status: 'Lead',
    depositPaid: false,
    totalSpent: 0,
    notes:
      'Interested in a back piece. Cover up of old text. Budget is tight, prefers multiple sessions.',
    savedDesigns: [],
  },
  {
    id: '3',
    name: 'Elena Fisher',
    email: 'elena@example.com',
    phone: '555-0888',
    status: 'Flagged',
    depositPaid: false,
    totalSpent: 1200,
    notes: 'No-showed twice. Do not book without full deposit.',
    savedDesigns: [],
  },
];

const getStatusClass = (status: string) => {
  switch (status) {
    case 'Booked':
      return 'status-booked';
    case 'Flagged':
      return 'status-flagged';
    default:
      return 'status-lead';
  }
};

export const Clients: React.FC = () => {
  const [clients] = useState<Client[]>(INITIAL_CLIENTS);
  const [selectedId, setSelectedId] = useState<string>('1');

  const selected = clients.find(c => c.id === selectedId) ?? clients[0];

  return (
    <div className="clients-container">
      <div className="clients-list-panel">
        <header className="clients-list-header">
          <h2 className="clients-list-title">Clients</h2>
          <span className="clients-count">{clients.length} total</span>
        </header>
        <div className="clients-list">
          {clients.map(client => (
            <button
              key={client.id}
              onClick={() => setSelectedId(client.id)}
              className={`client-item ${client.id === selectedId ? 'selected' : ''}`}
            >
              <div className="client-item-header">
                <span className="client-name">{client.name}</span>
                <span className={`client-status ${getStatusClass(client.status)}`}>
                  {client.status}
                </span>
              </div>
              <p className="client-notes-preview">{client.notes}</p>
            </button>
          ))}
        </div>
      </div>
      <div className="client-detail-panel">
        <ClientProfile client={selected} />
      </div>
    </div>
  );
};
