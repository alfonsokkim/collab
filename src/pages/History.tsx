import { useState } from 'react';
import { Wine, Code2, Sparkles, Waves, Users, Users2 } from 'lucide-react';
import '../styles/History.css';

interface PastEvent {
  id: number;
  title: string;
  date: string;
  societies: string[];
  attendees: number;
  status: 'successful' | 'completed';
  description: string;
  icon: React.ComponentType<{ size: number; strokeWidth?: number }>;
}

const mockHistory: PastEvent[] = [
  {
    id: 1,
    title: 'Winter Pubcrawl 2024',
    date: 'June 15, 2024',
    societies: ['Social Events Club', 'No Code Society', 'Startup Club'],
    attendees: 67,
    status: 'successful',
    description: 'An amazing night with 67 people across 3 societies exploring the best bars in Kingsford.',
    icon: Wine,
  },
  {
    id: 2,
    title: 'Tech Networking Mixer',
    date: 'May 20, 2024',
    societies: ['Entrepreneur Society', 'AI Club', 'Web Dev Society'],
    attendees: 89,
    status: 'successful',
    description: 'Great networking event with talks from industry professionals and startup demos.',
    icon: Code2,
  },
  {
    id: 3,
    title: 'Cultural Festival 2024',
    date: 'April 28, 2024',
    societies: ['International Students Club', 'Cultural Exchange', '4 others'],
    attendees: 156,
    status: 'successful',
    description: 'Showcasing food, music, and cultures from around the world. Our biggest collaboration yet!',
    icon: Sparkles,
  },
  {
    id: 4,
    title: 'Beach Day Sports Tournament',
    date: 'April 10, 2024',
    societies: ['Sports Club', 'Fitness Society', 'Social Club'],
    attendees: 52,
    status: 'completed',
    description: 'Epic volleyball and football tournament at Collaroy Beach.',
    icon: Waves,
  },
];

export function History() {
  const [history] = useState<PastEvent[]>(mockHistory);

  return (
    <div className="history">
      <div className="history-header">
        <h1>Event History</h1>
        <p>Celebrate our past collaborations and successful events</p>
      </div>

      <div className="timeline">
        {history.map((event, index) => {
          const IconComponent = event.icon;
          return (
          <div key={event.id} className="timeline-item">
            <div className="timeline-dot"></div>
            {index !== history.length - 1 && <div className="timeline-line"></div>}

            <div className="event-card">
              <div className="event-header">
                <span className="event-image">
                  <IconComponent size={36} strokeWidth={1.5} />
                </span>
                <div className="event-info">
                  <h3>{event.title}</h3>
                  <p className="event-date">{event.date}</p>
                </div>
                <span className={`event-badge ${event.status}`}>
                  {event.status === 'successful' ? '✓ Successful' : 'Completed'}
                </span>
              </div>

              <p className="event-description">{event.description}</p>

              <div className="event-details">
                <div className="detail-item">
                  <span className="detail-label">
                    <Users size={16} strokeWidth={2} /> Attendees:
                  </span>
                  <span>{event.attendees} people</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">
                    <Users2 size={16} strokeWidth={2} /> Collaborators:
                  </span>
                  <span>{event.societies.join(', ')}</span>
                </div>
              </div>
            </div>
          </div>
        );
        })}
      </div>

      <div className="history-summary">
        <div className="summary-card">
          <div className="summary-number">{history.length}</div>
          <div className="summary-label">Total Events</div>
        </div>
        <div className="summary-card">
          <div className="summary-number">
            {history.reduce((sum, e) => sum + e.attendees, 0)}
          </div>
          <div className="summary-label">Total Attendees</div>
        </div>
        <div className="summary-card">
          <div className="summary-number">
            {new Set(history.flatMap(e => e.societies)).size}+
          </div>
          <div className="summary-label">Societies Involved</div>
        </div>
      </div>
    </div>
  );
}
