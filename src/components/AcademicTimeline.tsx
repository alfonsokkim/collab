import { useEffect, useState } from 'react';
import { cn } from '../lib/utils';

type WeekType = 'teaching' | 'flex' | 'stuvac' | 'exam' | 'break';
type CalendarMode = 'trimester' | 'semester';

interface WeekCell {
  key: string;
  label: string;
  start: Date;
  type: WeekType;
  term: string;
}

interface AcademicTimelineProps {
  eventDates: Date[];
  events?: {
    id: string;
    title: string;
    date: string;
  }[];
}

function d(iso: string) {
  return new Date(`${iso}T00:00:00`);
}

const UNSW_WEEKS: WeekCell[] = [
  { key: 't1-w1', label: 'W1', start: d('2025-02-17'), type: 'teaching', term: 'T1' },
  { key: 't1-w2', label: 'W2', start: d('2025-02-24'), type: 'teaching', term: 'T1' },
  { key: 't1-w3', label: 'W3', start: d('2025-03-03'), type: 'teaching', term: 'T1' },
  { key: 't1-w4', label: 'W4', start: d('2025-03-10'), type: 'teaching', term: 'T1' },
  { key: 't1-w5', label: 'W5', start: d('2025-03-17'), type: 'teaching', term: 'T1' },
  { key: 't1-fx', label: 'Flex', start: d('2025-03-24'), type: 'flex', term: 'T1' },
  { key: 't1-w6', label: 'W6', start: d('2025-03-31'), type: 'teaching', term: 'T1' },
  { key: 't1-w7', label: 'W7', start: d('2025-04-07'), type: 'teaching', term: 'T1' },
  { key: 't1-w8', label: 'W8', start: d('2025-04-14'), type: 'teaching', term: 'T1' },
  { key: 't1-w9', label: 'W9', start: d('2025-04-22'), type: 'teaching', term: 'T1' },
  { key: 't1-w10', label: 'W10', start: d('2025-04-28'), type: 'teaching', term: 'T1' },
  { key: 't1-sv', label: 'Stuvac', start: d('2025-05-05'), type: 'stuvac', term: 'T1' },
  { key: 't1-ex1', label: 'Exams', start: d('2025-05-12'), type: 'exam', term: 'T1' },
  { key: 't1-ex2', label: 'Exams', start: d('2025-05-19'), type: 'exam', term: 'T1' },
  { key: 'b1-1', label: 'Break', start: d('2025-05-26'), type: 'break', term: '' },
  { key: 'b1-2', label: 'Break', start: d('2025-06-02'), type: 'break', term: '' },
  { key: 't2-w1', label: 'W1', start: d('2025-06-09'), type: 'teaching', term: 'T2' },
  { key: 't2-w2', label: 'W2', start: d('2025-06-16'), type: 'teaching', term: 'T2' },
  { key: 't2-w3', label: 'W3', start: d('2025-06-23'), type: 'teaching', term: 'T2' },
  { key: 't2-w4', label: 'W4', start: d('2025-06-30'), type: 'teaching', term: 'T2' },
  { key: 't2-w5', label: 'W5', start: d('2025-07-07'), type: 'teaching', term: 'T2' },
  { key: 't2-fx', label: 'Flex', start: d('2025-07-14'), type: 'flex', term: 'T2' },
  { key: 't2-w6', label: 'W6', start: d('2025-07-21'), type: 'teaching', term: 'T2' },
  { key: 't2-w7', label: 'W7', start: d('2025-07-28'), type: 'teaching', term: 'T2' },
  { key: 't2-w8', label: 'W8', start: d('2025-08-04'), type: 'teaching', term: 'T2' },
  { key: 't2-w9', label: 'W9', start: d('2025-08-11'), type: 'teaching', term: 'T2' },
  { key: 't2-w10', label: 'W10', start: d('2025-08-18'), type: 'teaching', term: 'T2' },
  { key: 't2-sv', label: 'Stuvac', start: d('2025-08-25'), type: 'stuvac', term: 'T2' },
  { key: 't2-ex1', label: 'Exams', start: d('2025-09-01'), type: 'exam', term: 'T2' },
  { key: 't2-ex2', label: 'Exams', start: d('2025-09-08'), type: 'exam', term: 'T2' },
  { key: 'b2-1', label: 'Break', start: d('2025-09-15'), type: 'break', term: '' },
  { key: 't3-w1', label: 'W1', start: d('2025-09-22'), type: 'teaching', term: 'T3' },
  { key: 't3-w2', label: 'W2', start: d('2025-09-29'), type: 'teaching', term: 'T3' },
  { key: 't3-w3', label: 'W3', start: d('2025-10-06'), type: 'teaching', term: 'T3' },
  { key: 't3-w4', label: 'W4', start: d('2025-10-13'), type: 'teaching', term: 'T3' },
  { key: 't3-w5', label: 'W5', start: d('2025-10-20'), type: 'teaching', term: 'T3' },
  { key: 't3-fx', label: 'Flex', start: d('2025-10-27'), type: 'flex', term: 'T3' },
  { key: 't3-w6', label: 'W6', start: d('2025-11-03'), type: 'teaching', term: 'T3' },
  { key: 't3-w7', label: 'W7', start: d('2025-11-10'), type: 'teaching', term: 'T3' },
  { key: 't3-w8', label: 'W8', start: d('2025-11-17'), type: 'teaching', term: 'T3' },
  { key: 't3-w9', label: 'W9', start: d('2025-11-24'), type: 'teaching', term: 'T3' },
  { key: 't3-w10', label: 'W10', start: d('2025-12-01'), type: 'teaching', term: 'T3' },
  { key: 't3-sv', label: 'Stuvac', start: d('2025-12-08'), type: 'stuvac', term: 'T3' },
  { key: 't3-ex1', label: 'Exams', start: d('2025-12-15'), type: 'exam', term: 'T3' },
  { key: 't3-ex2', label: 'Exams', start: d('2025-12-22'), type: 'exam', term: 'T3' },
];

const USYD_WEEKS: WeekCell[] = [
  { key: 's1-w1', label: 'W1', start: d('2025-02-24'), type: 'teaching', term: 'S1' },
  { key: 's1-w2', label: 'W2', start: d('2025-03-03'), type: 'teaching', term: 'S1' },
  { key: 's1-w3', label: 'W3', start: d('2025-03-10'), type: 'teaching', term: 'S1' },
  { key: 's1-w4', label: 'W4', start: d('2025-03-17'), type: 'teaching', term: 'S1' },
  { key: 's1-w5', label: 'W5', start: d('2025-03-24'), type: 'teaching', term: 'S1' },
  { key: 's1-w6', label: 'W6', start: d('2025-03-31'), type: 'teaching', term: 'S1' },
  { key: 's1-mb', label: 'Break', start: d('2025-04-07'), type: 'flex', term: 'S1' },
  { key: 's1-w7', label: 'W7', start: d('2025-04-14'), type: 'teaching', term: 'S1' },
  { key: 's1-w8', label: 'W8', start: d('2025-04-22'), type: 'teaching', term: 'S1' },
  { key: 's1-w9', label: 'W9', start: d('2025-04-28'), type: 'teaching', term: 'S1' },
  { key: 's1-w10', label: 'W10', start: d('2025-05-05'), type: 'teaching', term: 'S1' },
  { key: 's1-w11', label: 'W11', start: d('2025-05-12'), type: 'teaching', term: 'S1' },
  { key: 's1-w12', label: 'W12', start: d('2025-05-19'), type: 'teaching', term: 'S1' },
  { key: 's1-w13', label: 'W13', start: d('2025-05-26'), type: 'teaching', term: 'S1' },
  { key: 's1-sv', label: 'Stuvac', start: d('2025-06-02'), type: 'stuvac', term: 'S1' },
  { key: 's1-ex1', label: 'Exams', start: d('2025-06-09'), type: 'exam', term: 'S1' },
  { key: 's1-ex2', label: 'Exams', start: d('2025-06-16'), type: 'exam', term: 'S1' },
  { key: 'b1-1', label: 'Break', start: d('2025-06-23'), type: 'break', term: '' },
  { key: 'b1-2', label: 'Break', start: d('2025-06-30'), type: 'break', term: '' },
  { key: 'b1-3', label: 'Break', start: d('2025-07-07'), type: 'break', term: '' },
  { key: 'b1-4', label: 'Break', start: d('2025-07-14'), type: 'break', term: '' },
  { key: 'b1-5', label: 'Break', start: d('2025-07-21'), type: 'break', term: '' },
  { key: 'b1-6', label: 'Break', start: d('2025-07-28'), type: 'break', term: '' },
  { key: 's2-w1', label: 'W1', start: d('2025-08-04'), type: 'teaching', term: 'S2' },
  { key: 's2-w2', label: 'W2', start: d('2025-08-11'), type: 'teaching', term: 'S2' },
  { key: 's2-w3', label: 'W3', start: d('2025-08-18'), type: 'teaching', term: 'S2' },
  { key: 's2-w4', label: 'W4', start: d('2025-08-25'), type: 'teaching', term: 'S2' },
  { key: 's2-w5', label: 'W5', start: d('2025-09-01'), type: 'teaching', term: 'S2' },
  { key: 's2-w6', label: 'W6', start: d('2025-09-08'), type: 'teaching', term: 'S2' },
  { key: 's2-w7', label: 'W7', start: d('2025-09-15'), type: 'teaching', term: 'S2' },
  { key: 's2-w8', label: 'W8', start: d('2025-09-22'), type: 'teaching', term: 'S2' },
  { key: 's2-w9', label: 'W9', start: d('2025-09-29'), type: 'teaching', term: 'S2' },
  { key: 's2-w10', label: 'W10', start: d('2025-10-06'), type: 'teaching', term: 'S2' },
  { key: 's2-w11', label: 'W11', start: d('2025-10-13'), type: 'teaching', term: 'S2' },
  { key: 's2-w12', label: 'W12', start: d('2025-10-20'), type: 'teaching', term: 'S2' },
  { key: 's2-w13', label: 'W13', start: d('2025-10-27'), type: 'teaching', term: 'S2' },
  { key: 's2-sv', label: 'Stuvac', start: d('2025-11-03'), type: 'stuvac', term: 'S2' },
  { key: 's2-ex1', label: 'Exams', start: d('2025-11-10'), type: 'exam', term: 'S2' },
  { key: 's2-ex2', label: 'Exams', start: d('2025-11-17'), type: 'exam', term: 'S2' },
  { key: 'sb-1', label: 'Break', start: d('2025-11-24'), type: 'break', term: '' },
  { key: 'sb-2', label: 'Break', start: d('2025-12-01'), type: 'break', term: '' },
];

const typeClasses: Record<WeekType, string> = {
  teaching: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  flex: 'border border-dashed border-slate-300 bg-slate-50 text-slate-400',
  stuvac: 'bg-amber-100 text-amber-700',
  exam: 'bg-orange-100 text-orange-700',
  break: 'bg-slate-100 text-slate-400',
};

const currentTypeClasses: Record<WeekType, string> = {
  teaching: 'bg-blue-200 text-slate-900',
  flex: 'bg-slate-100 text-slate-700',
  stuvac: 'bg-amber-200 text-slate-900',
  exam: 'bg-orange-200 text-slate-900',
  break: 'bg-slate-200 text-slate-900',
};

const legendClasses: Record<WeekType, string> = {
  teaching: 'before:bg-blue-100',
  flex: 'before:border before:border-dashed before:border-slate-300 before:bg-slate-50',
  stuvac: 'before:bg-amber-100',
  exam: 'before:bg-orange-100',
  break: 'before:bg-slate-200',
};

function getTermKeys(weeks: WeekCell[]): string[] {
  const seen = new Set<string>();
  weeks.forEach((w) => {
    if (w.term) seen.add(w.term);
  });
  return Array.from(seen);
}

export function AcademicTimeline({ eventDates, events = [] }: AcademicTimelineProps) {
  const [mode, setMode] = useState<CalendarMode>('trimester');
  const allWeeks = mode === 'trimester' ? UNSW_WEEKS : USYD_WEEKS;
  const termKeys = getTermKeys(allWeeks);
  const [selectedTerm, setSelectedTerm] = useState<string>(termKeys[0]);

  useEffect(() => {
    setSelectedTerm(getTermKeys(mode === 'trimester' ? UNSW_WEEKS : USYD_WEEKS)[0]);
  }, [mode]);

  const lastTermIdx = (() => {
    let last = -1;
    allWeeks.forEach((w, i) => {
      if (w.term === selectedTerm) last = i;
    });
    return last;
  })();

  const weeks = allWeeks.filter((w, i) => {
    if (w.term === selectedTerm) return true;
    if (w.type === 'break' && i > lastTermIdx) {
      for (let j = lastTermIdx + 1; j < i; j += 1) {
        if (allWeeks[j].type !== 'break') return false;
      }
      return true;
    }
    return false;
  });

  const today = new Date();
  const currentIdx = weeks.findIndex((w) => {
    const start = w.start.getTime();
    const end = start + 7 * 24 * 60 * 60 * 1000;
    return today.getTime() >= start && today.getTime() < end;
  });

  const timelineEvents = events.length
    ? events.map((event) => ({
        ...event,
        eventDate: new Date(`${event.date}T00:00:00`),
      }))
    : eventDates.map((date, index) => ({
        id: `event-${index}`,
        title: 'Your event',
        date: date.toISOString().slice(0, 10),
        eventDate: date,
      }));

  const eventsByWeek = new Map<number, typeof timelineEvents>();
  timelineEvents.forEach((event) => {
    const t = event.eventDate.getTime();
    const idx = weeks.findIndex((w) => {
      const start = w.start.getTime();
      return t >= start && t < start + 7 * 24 * 60 * 60 * 1000;
    });
    if (idx >= 0) {
      if (!eventsByWeek.has(idx)) eventsByWeek.set(idx, []);
      eventsByWeek.get(idx)!.push(event);
    }
  });

  eventsByWeek.forEach((weekEvents, idx) => {
    eventsByWeek.set(
      idx,
      [...weekEvents].sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime()),
    );
  });

  const weekCount = weeks.length;
  const gridTemplateColumns = `repeat(${weekCount}, minmax(0, 1fr))`;

  return (
    <div className="bg-white px-3 py-2 md:px-4 md:py-3 rounded-2xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">Event Calendar</span>

        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex gap-0.5 rounded-md bg-slate-100 p-0.5">
            {(['trimester', 'semester'] as const).map((nextMode) => (
              <button
                key={nextMode}
                className={cn(
                  'rounded px-2.5 py-[3px] text-[12px] font-semibold text-slate-400 transition',
                  mode === nextMode && 'bg-white text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.1)]',
                )}
                onClick={() => setMode(nextMode)}
              >
                {nextMode === 'trimester' ? 'Trimester' : 'Semester'}
              </button>
            ))}
          </div>

          <div className="flex gap-0.5 rounded-md bg-slate-100 p-0.5">
            {termKeys.map((term) => (
              <button
                key={term}
                className={cn(
                  'rounded px-2.5 py-[3px] text-[12px] font-semibold text-slate-400 transition',
                  selectedTerm === term && 'shadow-[0_1px_3px_rgba(0,0,0,0.1)]',
                  selectedTerm === term && term === 'T1' && 'bg-blue-100 text-blue-600',
                  selectedTerm === term && term === 'S1' && 'bg-blue-100 text-blue-600',
                  selectedTerm === term && term === 'T2' && 'bg-green-100 text-green-600',
                  selectedTerm === term && term === 'S2' && 'bg-green-100 text-green-600',
                  selectedTerm === term && term === 'T3' && 'bg-orange-100 text-orange-600',
                  selectedTerm === term && !['T1', 'S1', 'T2', 'S2', 'T3'].includes(term) && 'bg-white text-slate-800',
                )}
                onClick={() => setSelectedTerm(term)}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="timeline-scroll overflow-x-visible overflow-y-visible pb-1">
        <div className="relative flex w-full flex-col">
          <div className="relative mb-1 h-[18px] w-full">
            {Array.from(eventsByWeek.entries()).map(([idx, dates]) => (
              <div
                key={idx}
                className="absolute top-0 flex h-full -translate-x-1/2 items-center justify-center gap-0.5"
                style={{ left: `${((idx + 0.5) / weekCount) * 100}%` }}
              >
                {dates.map((date, i) => (
                  <div
                    key={i}
                    className="h-2 w-2 rounded-full bg-[var(--primary)] shadow-[0_0_6px_rgba(232,160,69,0.6)]"
                    title={date.eventDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="grid w-full gap-0.5" style={{ gridTemplateColumns }}>
            {weeks.map((w, i) => {
              const isCurrentWeek = i === currentIdx;
              const hasEvent = eventsByWeek.has(i);
              return (
                <div
                  key={w.key}
                  className={cn(
                    'group relative flex h-[56px] min-w-0 items-center justify-center rounded-[10px] px-1 transition hover:scale-y-[1.04]',
                    typeClasses[w.type],
                    isCurrentWeek && 'outline outline-2 outline-offset-[-2px] outline-slate-700',
                    isCurrentWeek && currentTypeClasses[w.type],
                    hasEvent &&
                      'bg-[linear-gradient(180deg,rgba(232,160,69,0.22)_0%,rgba(232,160,69,0.12)_100%)] text-[var(--primary-dark)] outline outline-2 outline-offset-[-2px] outline-[rgba(232,160,69,0.8)]',
                    hasEvent && isCurrentWeek && 'outline-slate-800',
                  )}
                  title={`${w.term} ${w.label} — ${w.start.toLocaleDateString('en-AU', {
                    day: 'numeric',
                    month: 'short',
                  })}`}
                >
                  <span className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-center text-[clamp(10px,0.9vw,13px)] font-bold uppercase tracking-[0.03em]">
                    {w.label}
                  </span>

                  {hasEvent && (
                    <div className="pointer-events-none absolute left-1/2 top-[calc(100%+10px)] z-30 hidden w-56 -translate-x-1/2 rounded-2xl border border-[rgba(232,160,69,0.28)] bg-white p-3 text-left shadow-[0_18px_36px_rgba(15,23,42,0.14)] group-hover:block">
                      <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--primary-dark)]">
                        Your Events
                      </div>
                      <div className="space-y-2">
                        {eventsByWeek.get(i)?.map((event) => (
                          <div
                            key={event.id}
                            className="rounded-xl border border-[rgba(232,160,69,0.16)] bg-[rgba(232,160,69,0.06)] px-2.5 py-2"
                          >
                            <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--primary-dark)]">
                              {event.eventDate.toLocaleDateString('en-AU', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                            <div className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-[var(--text)]">
                              {event.title}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="relative mt-2 h-[14px] w-full">
            {weeks.map((w, i) => {
              const isFirst = i === 0 || w.start.getMonth() !== weeks[i - 1].start.getMonth();
              if (!isFirst) return null;
              return (
                <div
                  key={`m-${i}`}
                  className="absolute whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.05em] text-slate-400"
                  style={{ left: `${(i / weekCount) * 100}%` }}
                >
                  {w.start.toLocaleDateString('en-AU', { month: 'short' })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-200 pt-2.5">
        <span className={cn('flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.04em]', 'before:inline-block before:h-2.5 before:w-2.5 before:rounded-[2px]', legendClasses.teaching)}>
          Teaching
        </span>
        <span className={cn('flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.04em]', 'before:inline-block before:h-2.5 before:w-2.5 before:rounded-[2px]', legendClasses.flex)}>
          {mode === 'trimester' ? 'Flex Week' : 'Mid-Sem Break'}
        </span>
        <span className={cn('flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.04em]', 'before:inline-block before:h-2.5 before:w-2.5 before:rounded-[2px]', legendClasses.stuvac)}>
          Stuvac
        </span>
        <span className={cn('flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.04em]', 'before:inline-block before:h-2.5 before:w-2.5 before:rounded-[2px]', legendClasses.exam)}>
          Exams
        </span>
        <span className={cn('flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.04em]', 'before:inline-block before:h-2.5 before:w-2.5 before:rounded-[2px]', legendClasses.break)}>
          Break
        </span>
        {eventDates.length > 0 && (
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.04em] before:inline-block before:h-2.5 before:w-2.5 before:rounded-full before:bg-[var(--primary)]">
            Your Events
          </span>
        )}
      </div>
    </div>
  );
}
