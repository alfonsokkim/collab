import { useState } from 'react';
import { Code2, Sparkles, Users, Users2, Waves, Wine } from 'lucide-react';
import { cn } from '../lib/utils';

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
    description:
      'An amazing night with 67 people across 3 societies exploring the best bars in Kingsford.',
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
    description:
      'Showcasing food, music, and cultures from around the world. Our biggest collaboration yet!',
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
    <div className="mx-auto max-w-[900px] px-5 py-7 md:px-7 md:py-10">
      <div className="mb-12">
        <h1 className="mb-2 text-[var(--text)]">Event History</h1>
        <p className="text-base text-[var(--text-light)]">
          Celebrate our past collaborations and successful events
        </p>
      </div>

      <div className="relative py-2">
        {history.map((event, index) => {
          const IconComponent = event.icon;
          return (
            <div key={event.id} className="relative mb-8 pl-[52px]">
              <div className="absolute left-1 top-3 h-3 w-3 rounded-full border-2 border-white bg-[var(--primary)] shadow-[0_0_0_2px_var(--primary)]" />
              {index !== history.length - 1 && (
                <div className="absolute left-[9px] top-[26px] h-[calc(100%+8px)] w-0.5 bg-[var(--border)]" />
              )}

              <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)] p-6 transition hover:border-[rgba(232,160,69,0.4)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                <div className="mb-3.5 flex flex-wrap items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-subtle)] text-[var(--primary-dark)]">
                    <IconComponent size={36} strokeWidth={1.5} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-1 text-[17px] font-bold text-[var(--text)]">{event.title}</h3>
                    <p className="text-[13px] font-medium text-[var(--text-light)]">{event.date}</p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold',
                      event.status === 'successful'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-violet-100 text-violet-800',
                    )}
                  >
                    {event.status === 'successful' ? '✓ Successful' : 'Completed'}
                  </span>
                </div>

                <p className="mb-4 text-sm leading-[1.65] text-[var(--text-mid)]">{event.description}</p>

                <div className="grid gap-4 border-t border-[var(--border-light)] pt-4 md:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--text-light)]">
                      <Users size={16} className="text-[var(--primary)]" strokeWidth={2} />
                      Attendees:
                    </span>
                    <span className="text-sm font-medium text-[var(--text)]">{event.attendees} people</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--text-light)]">
                      <Users2 size={16} className="text-[var(--primary)]" strokeWidth={2} />
                      Collaborators:
                    </span>
                    <span className="text-sm font-medium text-[var(--text)]">
                      {event.societies.join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-14 grid gap-4 border-t border-[var(--border)] pt-10 md:grid-cols-3">
        <div className="rounded-[var(--radius-lg)] bg-[var(--dark)] px-6 py-7 text-center text-white">
          <div className="mb-1.5 font-[var(--heading)] text-[40px] font-extrabold text-[var(--primary)]">
            {history.length}
          </div>
          <div className="text-[13px] font-medium uppercase tracking-[0.07em] text-white/55">
            Total Events
          </div>
        </div>
        <div className="rounded-[var(--radius-lg)] bg-[var(--dark)] px-6 py-7 text-center text-white">
          <div className="mb-1.5 font-[var(--heading)] text-[40px] font-extrabold text-[var(--primary)]">
            {history.reduce((sum, e) => sum + e.attendees, 0)}
          </div>
          <div className="text-[13px] font-medium uppercase tracking-[0.07em] text-white/55">
            Total Attendees
          </div>
        </div>
        <div className="rounded-[var(--radius-lg)] bg-[var(--dark)] px-6 py-7 text-center text-white">
          <div className="mb-1.5 font-[var(--heading)] text-[40px] font-extrabold text-[var(--primary)]">
            {new Set(history.flatMap((e) => e.societies)).size}+
          </div>
          <div className="text-[13px] font-medium uppercase tracking-[0.07em] text-white/55">
            Societies Involved
          </div>
        </div>
      </div>
    </div>
  );
}
