import React from 'react';
import type { ProjectStage } from '../../types/client';
import './ProjectBoard.css';

const stages: ProjectStage[] = [
  { id: 'new', title: 'New Inquiry', count: 4 },
  { id: 'consult', title: 'Consult Scheduled', count: 2 },
  { id: 'design', title: 'Designing', count: 5 },
  { id: 'ready', title: 'Ready to Book', count: 3 },
  { id: 'session1', title: 'Session 1', count: 6 },
  { id: 'complete', title: 'Complete', count: 12 },
];

export const ProjectBoard: React.FC = () => {
  return (
    <div className="project-board-container">
      <header className="project-header">
        <h2 className="project-title">Project Pipeline</h2>
        <p className="project-subtitle">
          Every tattoo project from first message to healed.
        </p>
      </header>
      <div className="stages-grid">
        {stages.map(stage => (
          <div key={stage.id} className="stage-card">
            <div className="stage-header">
              <h3 className="stage-title">{stage.title}</h3>
              <span className="stage-count">{stage.count}</span>
            </div>
            <p className="stage-placeholder">
              Drag & drop coming in a later version – for now this shows how many projects sit here.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
