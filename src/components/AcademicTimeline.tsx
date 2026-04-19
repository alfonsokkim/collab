import { useEffect, useState } from 'react';
import { cn } from '../lib/utils';
import { UNSW_WEEKS, USYD_WEEKS } from './academicCalendarData';
import type { WeekCell } from './academicCalendarData';

type WeekType = 'teaching' | 'flex' | 'stuvac' | 'exam' | 'break';
type CalendarMode = 'trimester' | 'semester';

interface AcademicTimelineProps {
  eventDates: Date[];
  events?: { id: string; title: string; date: string }[];
}

const YEARS = [2025, 2026, 2027] as const;
type Year = typeof YEARS[number];

const typeClasses: Record<WeekType, string> = {
  teaching: 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50',
  flex: 'border border-dashed border-slate-300 bg-slate-50 text-slate-400 dark:border-[var(--border)] dark:bg-[var(--bg-light)] dark:text-[var(--text-light)]',
  stuvac: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  exam: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  break: 'bg-slate-100 text-slate-400 dark:bg-[var(--bg-light)] dark:text-[var(--text-light)]',
};

const currentTypeClasses: Record<WeekType, string> = {
  teaching: 'bg-blue-200 text-slate-900 dark:bg-blue-700/50 dark:text-blue-100',
  flex: 'bg-slate-100 text-slate-700 dark:bg-[var(--bg-light)] dark:text-[var(--text-mid)]',
  stuvac: 'bg-amber-200 text-slate-900 dark:bg-amber-700/50 dark:text-amber-100',
  exam: 'bg-orange-200 text-slate-900 dark:bg-orange-700/50 dark:text-orange-100',
  break: 'bg-slate-200 text-slate-900 dark:bg-[var(--bg-light)] dark:text-[var(--text)]',
};

const legendClasses: Record<WeekType, string> = {
  teaching: 'before:bg-blue-100 dark:before:bg-blue-900/40',
  flex: 'before:border before:border-dashed before:border-slate-300 before:bg-slate-50 dark:before:border-[var(--border)] dark:before:bg-[var(--bg-light)]',
  stuvac: 'before:bg-amber-100 dark:before:bg-amber-900/40',
  exam: 'before:bg-orange-100 dark:before:bg-orange-900/40',
  break: 'before:bg-slate-200 dark:before:bg-slate-700/60',
};

function getTermsForYear(weeks: WeekCell[], year: number): string[] {
  const seen = new Set<string>();
  weeks.forEach((w) => { if (w.year === year && w.term) seen.add(w.term); });
  return Array.from(seen);
}

function getCurrentYearAndTerm(allWeeks: WeekCell[]): { year: Year; term: string } {
  const now = new Date().getTime();
  for (const w of allWeeks) {
    if (!w.term) continue;
    const start = w.start.getTime();
    if (now >= start && now < start + 7 * 24 * 60 * 60 * 1000) {
      return { year: w.year as Year, term: w.term };
    }
  }
  const past = allWeeks.filter((w) => w.term && w.start.getTime() <= now);
  if (past.length) {
    const last = past[past.length - 1];
    return { year: last.year as Year, term: last.term };
  }
  const firstTerm = allWeeks.find((w) => w.term);
  return { year: (firstTerm?.year ?? 2026) as Year, term: firstTerm?.term ?? 'T1' };
}

export function AcademicTimeline({ eventDates, events = [] }: AcademicTimelineProps) {
  const [mode, setMode] = useState<CalendarMode>('trimester');
  const allWeeks = mode === 'trimester' ? UNSW_WEEKS : USYD_WEEKS;

  const [selectedYear, setSelectedYear] = useState<Year>(() => getCurrentYearAndTerm(UNSW_WEEKS).year);
  const [selectedTerm, setSelectedTerm] = useState<string>(() => getCurrentYearAndTerm(UNSW_WEEKS).term);

  useEffect(() => {
    const weeks = mode === 'trimester' ? UNSW_WEEKS : USYD_WEEKS;
    const { year, term } = getCurrentYearAndTerm(weeks);
    setSelectedYear(year);
    setSelectedTerm(term);
  }, [mode]);

  useEffect(() => {
    const terms = getTermsForYear(allWeeks, selectedYear);
    if (!terms.includes(selectedTerm)) setSelectedTerm(terms[0] ?? '');
  }, [selectedYear, allWeeks, selectedTerm]);

  const termKeys = getTermsForYear(allWeeks, selectedYear);

  const lastTermIdx = (() => {
    let last = -1;
    allWeeks.forEach((w, i) => {
      if (w.year === selectedYear && w.term === selectedTerm) last = i;
    });
    return last;
  })();

  const weeks = allWeeks.filter((w, i) => {
    if (w.year === selectedYear && w.term === selectedTerm) return true;
    if (w.year === selectedYear && w.type === 'break' && w.term === '' && i > lastTermIdx) {
      for (let j = lastTermIdx + 1; j < i; j++) {
        if (allWeeks[j].type !== 'break') return false;
      }
      return true;
    }
    return false;
  });

  const today = new Date();
  const currentIdx = weeks.findIndex((w) => {
    const start = w.start.getTime();
    return today.getTime() >= start && today.getTime() < start + 7 * 24 * 60 * 60 * 1000;
  });

  const timelineEvents = events.length
    ? events.map((e) => ({ ...e, eventDate: new Date(`${e.date}T00:00:00`) }))
    : eventDates.map((date, i) => ({ id: `e-${i}`, title: 'Your event', date: date.toISOString().slice(0, 10), eventDate: date }));

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
  eventsByWeek.forEach((evs, idx) => {
    eventsByWeek.set(idx, [...evs].sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime()));
  });

  const weekCount = weeks.length;
  const gridTemplateColumns = `repeat(${weekCount}, minmax(0, 1fr))`;

  const pillBtn = (active: boolean, accent?: string) =>
    cn(
      'rounded px-2.5 py-[3px] text-[12px] font-semibold transition',
      active
        ? cn('shadow-[0_1px_3px_rgba(0,0,0,0.1)]', accent ?? 'bg-[var(--bg)] text-[var(--text)]')
        : 'text-[var(--text-light)]',
    );

  return (
    <div className="bg-[var(--bg)] px-3 py-2 md:px-4 md:py-3 rounded-3xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-light)]">Event Calendar</span>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Mode */}
          <div className="flex gap-0.5 rounded-md bg-[var(--bg-light)] p-0.5">
            {(['trimester', 'semester'] as const).map((m) => (
              <button key={m} className={pillBtn(mode === m)} onClick={() => setMode(m)}>
                {m === 'trimester' ? 'Trimester' : 'Semester'}
              </button>
            ))}
          </div>

          {/* Term */}
          <div className="flex gap-0.5 rounded-md bg-[var(--bg-light)] p-0.5">
            {termKeys.map((term) => {
              const accent =
                term === 'T1' || term === 'S1' ? 'bg-blue-100 text-blue-600'
                : term === 'T2' || term === 'S2' ? 'bg-green-100 text-green-600'
                : 'bg-orange-100 text-orange-600';
              return (
                <button key={term} className={pillBtn(selectedTerm === term, accent)} onClick={() => setSelectedTerm(term)}>
                  {term}
                </button>
              );
            })}
          </div>

          {/* Year */}
          <div className="flex gap-0.5 rounded-md bg-[var(--bg-light)] p-0.5">
            {YEARS.map((y) => (
              <button key={y} className={pillBtn(selectedYear === y)} onClick={() => setSelectedYear(y)}>
                {y}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-visible overflow-y-visible pb-1">
        <div className="relative flex w-full flex-col">
          {/* Event dots row */}
          <div className="relative mb-1 h-[18px] w-full">
            {Array.from(eventsByWeek.entries()).map(([idx, evs]) => (
              <div
                key={idx}
                className="absolute top-0 flex h-full -translate-x-1/2 items-center justify-center gap-0.5"
                style={{ left: `${((idx + 0.5) / weekCount) * 100}%` }}
              >
                {evs.map((_, i) => (
                  <div key={i} className="h-2 w-2 rounded-full bg-[var(--primary)] shadow-[0_0_6px_rgba(232,160,69,0.6)]" />
                ))}
              </div>
            ))}
          </div>

          {/* Week cells */}
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
                    hasEvent && 'bg-[linear-gradient(180deg,rgba(232,160,69,0.22)_0%,rgba(232,160,69,0.12)_100%)] text-[var(--primary-dark)] outline outline-2 outline-offset-[-2px] outline-[rgba(232,160,69,0.8)]',
                    hasEvent && isCurrentWeek && 'outline-slate-800',
                  )}
                  title={`${w.term} ${w.label} — ${w.start.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}`}
                >
                  <span className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-center text-[clamp(10px,0.9vw,13px)] font-bold uppercase tracking-[0.03em]">
                    {w.label}
                  </span>

                  {hasEvent && (
                    <div className="pointer-events-none absolute left-1/2 top-[calc(100%+10px)] z-30 hidden w-56 -translate-x-1/2 rounded-2xl border border-[rgba(232,160,69,0.28)] bg-[var(--bg)] p-3 text-left shadow-[0_18px_36px_rgba(15,23,42,0.14)] group-hover:block">
                      <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--primary-dark)]">Events</div>
                      <div className="space-y-2">
                        {eventsByWeek.get(i)?.map((event) => (
                          <div key={event.id} className="rounded-xl border border-[rgba(232,160,69,0.16)] bg-[rgba(232,160,69,0.06)] px-2.5 py-2">
                            <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--primary-dark)]">
                              {event.eventDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                            <div className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-[var(--text)]">{event.title}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Month labels */}
          <div className="relative mt-2 h-[14px] w-full">
            {weeks.map((w, i) => {
              const isFirst = i === 0 || w.start.getMonth() !== weeks[i - 1].start.getMonth();
              if (!isFirst) return null;
              return (
                <div
                  key={`m-${i}`}
                  className="absolute whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.05em] text-[var(--text-light)]"
                  style={{ left: `${(i / weekCount) * 100}%` }}
                >
                  {w.start.toLocaleDateString('en-AU', { month: 'short' })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3 border-t border-[var(--border)] pt-2.5">
        {(['teaching', 'flex', 'stuvac', 'exam', 'break'] as WeekType[]).map((type) => (
          <span key={type} className={cn('flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--text-light)]', 'before:inline-block before:h-2.5 before:w-2.5 before:rounded-[2px]', legendClasses[type])}>
            {type === 'flex' ? (mode === 'trimester' ? 'Flex Week' : 'Mid-Sem Break') : type === 'teaching' ? 'Teaching' : type === 'stuvac' ? 'Stuvac' : type === 'exam' ? 'Exams' : 'Break'}
          </span>
        ))}
        {eventDates.length > 0 && (
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--text-light)] before:inline-block before:h-2.5 before:w-2.5 before:rounded-full before:bg-[var(--primary)]">
            Events
          </span>
        )}
      </div>
    </div>
  );
}
