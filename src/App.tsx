import React, { useState, useEffect } from 'react';
import './styles/index.css';
import { Sidebar, ViewKey } from './layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ProjectBoard } from './components/Projects/ProjectBoard';
import { CancellationList } from './components/CancellationList/CancellationList';
import { OfferDates } from './components/OfferDates/OfferDates';
import { IntakeAssistant } from './components/IntakeAssistant/IntakeAssistant';
import { Clients } from './components/Clients/Clients';
import { POS } from './components/POS/POS';
import { Calendar } from './components/Calendar/Calendar';
import { Settings } from './components/Settings/Settings';
import { ReferenceManager } from './components/References/ReferenceManager';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewKey>('DASHBOARD');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const renderView = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard />;
      case 'CALENDAR':
        return <Calendar />;
      case 'PROJECTS':
        return <ProjectBoard />;
      case 'CLIENTS':
        return <Clients />;
      case 'INTAKE':
        return <IntakeAssistant />;
      case 'OFFER_DATES':
        return <OfferDates />;
      case 'CANCELLATIONS':
        return <CancellationList />;
      case 'REFERENCES':
        return <ReferenceManager />;
      case 'POS':
        return <POS />;
      case 'SETTINGS':
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        currentView={currentView}
        onChangeView={setCurrentView}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <main className="main-content">
        <div className="content-container">{renderView()}</div>
      </main>
    </div>
  );
};
