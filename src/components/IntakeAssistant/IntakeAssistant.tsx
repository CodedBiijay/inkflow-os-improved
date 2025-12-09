import React from 'react';
import './IntakeAssistant.css';

export const IntakeAssistant: React.FC = () => {
  return (
    <div className="intake-container">
      <div className="chat-panel">
        <header className="chat-header">
          <h2 className="chat-title">Live conversations</h2>
        </header>
        <div className="conversation-area">
          <div className="message-bubble message-client">
            <p>
              Client: &quot;Hi! I&apos;m looking for a floral sleeve, I&apos;m nervous about pain and I have eczema on my left arm.&quot;
            </p>
          </div>
          <div className="message-bubble message-ai">
            <p className="ai-label">Suggested reply</p>
            <p>
              &quot;Thanks for reaching out! We can absolutely work with that – we&apos;ll start on the shoulder cap where
              you&apos;ll be most comfortable. I&apos;ll send you a quick form so we can match you with the best artist
              and talk through pain management options.&quot;
            </p>
          </div>
        </div>
      </div>
      <div className="actions-panel">
        <h3 className="actions-title">Quick actions</h3>
        <button className="action-btn btn-indigo">
          Send consult form
        </button>
        <button className="action-btn btn-emerald">
          Offer dates
        </button>
        <button className="action-btn btn-amber">
          Mark as high priority
        </button>
        <button className="secondary-action">
          View client profile
        </button>
        <p className="disclaimer">
          In production this panel would be powered by your AI agent and GHL/Make workflows.
        </p>
      </div>
    </div>
  );
};
