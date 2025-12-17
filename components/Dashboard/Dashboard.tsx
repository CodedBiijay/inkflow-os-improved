import React from 'react';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h2 className="dashboard-title">Today at the Studio</h2>
        <p className="dashboard-subtitle">
          Snapshot of bookings, projects and revenue activity.
        </p>
      </header>

      <section className="stats-grid">
        <div className="card stat-card">
          <p className="stat-label">Today&apos;s bookings</p>
          <p className="stat-value">7</p>
          <p className="stat-delta positive">+2 vs. last week</p>
        </div>
        <div className="card stat-card">
          <p className="stat-label">Open projects</p>
          <p className="stat-value">18</p>
          <p className="stat-delta neutral">4 in design, 7 ready to book</p>
        </div>
        <div className="card stat-card">
          <p className="stat-label">Month-to-date revenue</p>
          <p className="stat-value">$24,300</p>
          <p className="stat-delta positive">On track to beat last month</p>
        </div>
      </section>

      <section className="card pipeline-section">
        <h3 className="section-title">Pipeline overview</h3>
        <div className="pipeline-grid">
          {[
            ['New Inquiry', 4],
            ['Consult Scheduled', 3],
            ['Designing', 5],
            ['Ready to Book', 2],
            ['Session 1', 6],
            ['Complete', 12],
          ].map(([label, count]) => (
            <div key={label} className="pipeline-card">
              <p className="pipeline-label">{label}</p>
              <p className="pipeline-count">{count as number}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
