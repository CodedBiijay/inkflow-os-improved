import React from 'react';

export type ViewKey =
  | 'DASHBOARD'
  | 'CALENDAR'
  | 'PROJECTS'
  | 'CLIENTS'
  | 'INTAKE'
  | 'OFFER_DATES'
  | 'CANCELLATIONS'
  | 'REFERENCES'
  | 'POS'
  | 'SETTINGS';

interface SidebarProps {
  currentView: ViewKey;
  onChangeView: (view: ViewKey) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const menu: { label: string; view: ViewKey }[] = [
  { label: 'Dashboard', view: 'DASHBOARD' },
  { label: 'Calendar', view: 'CALENDAR' },
  { label: 'Projects', view: 'PROJECTS' },
  { label: 'Clients', view: 'CLIENTS' },
  { label: 'Intake Assistant', view: 'INTAKE' },
  { label: 'Offer Dates', view: 'OFFER_DATES' },
  { label: 'Cancellation List', view: 'CANCELLATIONS' },
  { label: 'Reference Manager', view: 'REFERENCES' },
  { label: 'POS & Payments', view: 'POS' },
  { label: 'Settings', view: 'SETTINGS' },
];

import './Sidebar.css';

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onChangeView,
  theme,
  onToggleTheme,
}) => {
  return (
    <aside className="sidebar-container">
      <div className="brand-section">
        <h1 className="brand-title">INKFlow OS</h1>
        <p className="brand-subtitle">Tattoo Studio Operating System</p>
      </div>
      <nav className="nav-menu">
        {menu.map(item => (
          <button
            key={item.view}
            onClick={() => onChangeView(item.view)}
            className={`nav-item ${currentView === item.view ? 'active' : ''}`}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="theme-toggle-btn" onClick={onToggleTheme}>
          {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
        <div className="version-text">v0.1 • Prototype – UI only</div>
      </div>
    </aside>
  );
};
