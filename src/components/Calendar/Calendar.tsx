import React from 'react';
import './Calendar.css';

interface CalendarEvent {
  id: string;
  title: string;
  type: 'tattoo' | 'consultation' | 'touchup';
  date: number; // Day of month for demo
}

const mockEvents: CalendarEvent[] = [
  { id: '1', title: 'Consult: Sarah M.', type: 'consultation', date: 3 },
  { id: '2', title: 'Tattoo: Dragon Sleeve', type: 'tattoo', date: 3 },
  { id: '3', title: 'Touch-up: Mike R.', type: 'touchup', date: 5 },
  { id: '4', title: 'Tattoo: Floral piece', type: 'tattoo', date: 12 },
  { id: '5', title: 'Consult: New Client', type: 'consultation', date: 15 },
  { id: '6', title: 'Tattoo: Full Back (S1)', type: 'tattoo', date: 18 },
  { id: '7', title: 'Tattoo: Full Back (S2)', type: 'tattoo', date: 19 },
  { id: '8', title: 'Consult: Cover-up', type: 'consultation', date: 24 },
];

export const Calendar: React.FC = () => {
  const daysInMonth = 31;
  const startDayOffset = 4; // Start on Thursday for demo sake (e.g. Dec 2025 context or generic)

  // Generate grid cells
  const days = [];

  // Padding days
  for (let i = 0; i < startDayOffset; i++) {
    days.push(<div key={`pad-${i}`} className="calendar-day other-month" />);
  }

  // Actual days
  for (let i = 1; i <= daysInMonth; i++) {
    const dayEvents = mockEvents.filter(e => e.date === i);
    const isToday = i === 7; // Mock "Today"

    days.push(
      <div key={`day-${i}`} className={`calendar-day ${isToday ? 'today' : ''}`}>
        <span className="day-number">{i}</span>
        {dayEvents.map(event => (
          <div key={event.id} className={`event-pill event-${event.type}`}>
            {event.title}
          </div>
        ))}
      </div>
    );
  }

  // Remaining padding
  const totalCells = 35; // 5 rows x 7
  const remaining = totalCells - days.length;
  for (let i = 0; i < remaining; i++) {
    days.push(<div key={`end-pad-${i}`} className="calendar-day other-month" />);
  }

  return (
    <div className="calendar-container">
      <header className="calendar-header">
        <div>
          <h2 className="calendar-title">December 2025</h2>
          <p className="text-muted text-sm">Schedule & Availability</p>
        </div>
        <div className="calendar-controls">
          <button className="calendar-btn">Previous</button>
          <button className="calendar-btn">Next</button>
          <button className="calendar-btn primary">New Booking</button>
        </div>
      </header>

      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="calendar-day-header">{day}</div>
        ))}
        {days}
      </div>
    </div>
  );
};
