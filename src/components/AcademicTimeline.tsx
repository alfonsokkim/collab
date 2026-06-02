import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { UNSW_WEEKS, USYD_WEEKS, UTS_WEEKS, MQ_WEEKS, WSU_WEEKS } from './academicCalendarData';
import type { WeekCell } from './academicCalendarData';

type WeekType = 'teaching' | 'flex' | 'stuvac' | 'exam' | 'break';
type SelectedUni = 'UNSW' | 'USYD' | 'UTS' | 'MQ' | 'WSU';

const UNI_OPTIONS: { id: SelectedUni; label: string; shortLabel: string }[] = [
  { id: 'UNSW', label: 'UNSW Sydney',        shortLabel: 'UNSW' },
  { id: 'USYD', label: 'University of Sydney', shortLabel: 'USyd' },
  { id: 'UTS',  label: 'UTS',                shortLabel: 'UTS'  },
  { id: 'MQ',   label: 'Macquarie',          shortLabel: 'MQ'   },
  { id: 'WSU',  label: 'Western Sydney',     shortLabel: 'WSU'  },
];

function getWeeksForUni(uni: SelectedUni): WeekCell[] {
  switch (uni) {
    case 'UNSW': return UNSW_WEEKS;
    case 'USYD': return USYD_WEEKS;
    case 'UTS':  return UTS_WEEKS;
    case 'MQ':   return MQ_WEEKS;
    case 'WSU':  return WSU_WEEKS;
  }
}

function flexLabel(uni: SelectedUni): string {
  return uni === 'UNSW' ? 'Flex Week' : 'Mid-Sem Break';
}

interface AcademicTimelineProps {
  eventDates: Date[];
  events?: { id: string; title: string; date: string }[];
  university?: string;
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


const mobileLabel: Record<WeekType, (label: string) => string> = {
  teaching: (l) => l,
  flex: () => 'FLX',
  stuvac: () => 'STV',
  exam: () => 'EXM',
  break: () => 'BRK',
};

const mobileBadgeClasses: Record<WeekType, string> = {
  teaching: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  flex: 'bg-slate-100 text-slate-500 dark:bg-[var(--bg-light)] dark:text-[var(--text-light)]',
  stuvac: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  exam: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  break: 'bg-slate-100 text-slate-400 dark:bg-[var(--bg-light)] dark:text-[var(--text-light)]',
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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

// ── Small reusable dropdown ───────────────────────────────────────────────────

function PillDropdown<T extends string>({
  value, onChange, options, className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-full bg-[var(--bg-light)] px-3 py-[4px] text-[12px] font-semibold text-[var(--text)] shadow-sm transition hover:bg-[var(--border-light)]"
      >
        {current?.label ?? value}
        <ChevronDown size={11} className={cn('text-[var(--text-light)] transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 min-w-[120px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg)] shadow-lg">
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={cn(
                'flex w-full items-center px-3 py-2 text-[12px] font-medium transition',
                o.value === value
                  ? 'bg-[var(--primary-subtle)] text-[var(--primary-dark)]'
                  : 'text-[var(--text-mid)] hover:bg-[var(--bg-light)]',
              )}
            >
              {o.label}
              {o.value === value && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Desktop timeline ──────────────────────────────────────────────────────────

const nodeColors: Record<WeekType, { base: string; current: string; line: string }> = {
  teaching: { base: 'bg-blue-200 dark:bg-blue-800/60',        current: 'bg-blue-500 dark:bg-blue-400',       line: 'bg-blue-200 dark:bg-blue-800/40' },
  flex:     { base: 'bg-slate-200 dark:bg-slate-700/50',      current: 'bg-slate-400 dark:bg-slate-400',     line: 'bg-slate-200 dark:bg-slate-700/40' },
  stuvac:   { base: 'bg-amber-200 dark:bg-amber-800/50',      current: 'bg-amber-500 dark:bg-amber-400',     line: 'bg-amber-200 dark:bg-amber-800/40' },
  exam:     { base: 'bg-orange-200 dark:bg-orange-800/50',    current: 'bg-orange-500 dark:bg-orange-400',   line: 'bg-orange-200 dark:bg-orange-800/40' },
  break:    { base: 'bg-slate-100 dark:bg-slate-800/40',      current: 'bg-slate-300 dark:bg-slate-500',     line: 'bg-slate-100 dark:bg-slate-800/30' },
};

function DesktopTimeline({
  selectedUni, setSelectedUni, selectedYear, setSelectedYear, selectedTerm, setSelectedTerm,
  termKeys, weeks, currentIdx, eventsByWeek, weekCount: _weekCount,
}: {
  selectedUni: SelectedUni;
  setSelectedUni: (u: SelectedUni) => void;
  selectedYear: Year;
  setSelectedYear: (y: Year) => void;
  selectedTerm: string;
  setSelectedTerm: (t: string) => void;
  termKeys: string[];
  weeks: WeekCell[];
  currentIdx: number;
  eventsByWeek: Map<number, { id: string; title: string; date: string; eventDate: Date }[]>;
  weekCount: number;
  eventDates: Date[];
}) {
  const pillBtn = (active: boolean, accent?: string) =>
    cn(
      'rounded-full px-2.5 py-[3px] text-[12px] font-semibold transition',
      active
        ? cn('shadow-[0_1px_3px_rgba(0,0,0,0.1)]', accent ?? 'bg-[var(--bg)] text-[var(--text)]')
        : 'text-[var(--text-light)]',
    );

  const uniOptions = UNI_OPTIONS.map((u) => ({ value: u.id, label: u.shortLabel }));
  const yearOptions = YEARS.map((y) => ({ value: y.toString() as `${Year}`, label: y.toString() }));

  return (
    <>
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-light)]">Event Calendar</span>
        <div className="flex flex-wrap items-center gap-1.5">
          <PillDropdown value={selectedUni} onChange={setSelectedUni} options={uniOptions} />
          <div className="flex gap-0.5 rounded-full bg-[var(--bg-light)] p-0.5">
            {termKeys.map((term) => {
              const accent =
                term === 'T1' || term === 'S1' || term === 'Autumn' ? 'bg-blue-100 text-blue-600'
                : term === 'T2' || term === 'S2' || term === 'Spring' ? 'bg-green-100 text-green-600'
                : 'bg-orange-100 text-orange-600';
              return (
                <button key={term} className={pillBtn(selectedTerm === term, accent)} onClick={() => setSelectedTerm(term)}>
                  {term}
                </button>
              );
            })}
          </div>
          <PillDropdown
            value={selectedYear.toString() as `${Year}`}
            onChange={(v) => setSelectedYear(parseInt(v) as Year)}
            options={yearOptions}
          />
        </div>
      </div>

      {/* Node timeline */}
      <div className="relative px-2 pb-1">

        {/* Nodes + line container — line is absolute, nodes sit on top via z-10 */}
        <div className="relative flex w-full items-center" style={{ height: '40px' }}>
          {/* Single continuous line through all node centres */}
          <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 bg-[var(--border)]" />

          {weeks.map((w, i) => {
            const isCurrentWeek = i === currentIdx;
            const hasEvent = eventsByWeek.has(i);
            const colors = nodeColors[w.type];

            const nodeSize = isCurrentWeek ? 'h-7 w-7' : hasEvent ? 'h-7 w-7' : 'h-4 w-4';
            const nodeBg = isCurrentWeek ? colors.current : hasEvent ? 'bg-[var(--primary)]' : colors.base;

            return (
              <div key={w.key} className="group relative flex flex-1 items-center justify-center">
                <div
                  className={cn(
                    'relative z-10 rounded-full transition-transform duration-150 group-hover:scale-125 cursor-default',
                    nodeSize,
                    nodeBg,
                    isCurrentWeek && 'shadow-[0_0_0_3px_rgba(255,255,255,0.15),0_0_14px_rgba(99,132,255,0.35)]',
                    hasEvent && !isCurrentWeek && 'shadow-[0_0_8px_rgba(232,160,69,0.5)]',
                  )}
                />

                {/* Tooltip */}
                <div className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-40 hidden w-52 -translate-x-1/2 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-3 text-left shadow-[0_12px_32px_rgba(0,0,0,0.15)] group-hover:block">
                  <div className="mb-1 text-[11px] font-bold text-[var(--text)]">{w.term} {w.label}</div>
                  <div className="mb-2 text-[10px] text-[var(--text-light)]">
                    {w.start.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                  </div>
                  {hasEvent ? (
                    <div className="space-y-1.5">
                      {eventsByWeek.get(i)?.map((event) => (
                        <div key={event.id} className="rounded-lg border border-[rgba(232,160,69,0.2)] bg-[rgba(232,160,69,0.07)] px-2.5 py-1.5">
                          <div className="text-[10px] text-[var(--primary-dark)]">
                            {event.eventDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                          </div>
                          <div className="mt-0.5 line-clamp-2 text-[11px] font-semibold text-[var(--text)]">{event.title}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-[var(--text-light)] opacity-60">No events this week</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Week numbers */}
        <div className="mt-2 flex w-full">
          {weeks.map((w, i) => {
            const label = w.type === 'teaching' ? w.label.replace(/\D/g, '') : null;
            return (
              <div key={i} className="flex flex-1 justify-center">
                {label ? (
                  <span className="text-[10px] font-medium text-[var(--text-light)]">{label}</span>
                ) : (
                  <span className="text-[9px] font-medium text-[var(--text-light)] opacity-40">
                    {w.type === 'exam' ? 'E' : w.type === 'stuvac' ? 'S' : w.type === 'flex' ? 'F' : '·'}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* "weeks" label */}
        <div className="mt-0.5 text-center text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-light)] opacity-40">
          weeks
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3 border-t border-[var(--border)] pt-2.5">
        {(['teaching', 'flex', 'stuvac', 'exam', 'break'] as WeekType[]).map((type) => (
          <span key={type} className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--text-light)]">
            <span className={cn('inline-block h-2.5 w-2.5 rounded-full', nodeColors[type].base)} />
            {type === 'flex' ? flexLabel(selectedUni) : type === 'teaching' ? 'Teaching' : type === 'stuvac' ? 'Stuvac' : type === 'exam' ? 'Exams' : 'Break'}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--text-light)]">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />
          Your Events
        </span>
      </div>
    </>
  );
}

// ── Mobile layout ─────────────────────────────────────────────────────────────

function MobileTimeline({
  selectedUni, setSelectedUni, selectedYear, setSelectedYear, selectedTerm, setSelectedTerm,
  weeks, currentIdx, eventsByWeek, events,
}: {
  selectedUni: SelectedUni;
  setSelectedUni: (u: SelectedUni) => void;
  selectedYear: Year;
  setSelectedYear: (y: Year) => void;
  selectedTerm: string;
  setSelectedTerm: (t: string) => void;
  weeks: WeekCell[];
  currentIdx: number;
  eventsByWeek: Map<number, { id: string; title: string; date: string; eventDate: Date }[]>;
  events: { id: string; title: string; date: string; eventDate: Date }[];
}) {
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectorOpen) return;
    const handler = (e: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) setSelectorOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [selectorOpen]);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const upcomingEvents = events
    .filter((e) => e.eventDate >= today)
    .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime())
    .slice(0, 8);

  const getWeekContext = (eventDate: Date) => {
    const idx = weeks.findIndex((w) => {
      const start = w.start.getTime();
      return eventDate.getTime() >= start && eventDate.getTime() < start + 7 * 24 * 60 * 60 * 1000;
    });
    if (idx < 0) return null;
    return { week: weeks[idx], idx };
  };

  const termLabel = `${selectedTerm} ${selectedYear}`;

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* University dropdown */}
        <PillDropdown
          value={selectedUni}
          onChange={setSelectedUni}
          options={UNI_OPTIONS.map((u) => ({ value: u.id, label: u.shortLabel }))}
        />

        {/* Term + year compact selector */}
        <div className="relative flex-1" ref={selectorRef}>
          <button
            onClick={() => setSelectorOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-[13px] font-semibold text-[var(--text)] transition hover:border-[var(--primary)]"
          >
            <span>{termLabel}</span>
            <ChevronDown size={14} className={cn('text-[var(--text-light)] transition-transform', selectorOpen && 'rotate-180')} />
          </button>

          {selectorOpen && (
            <div className="absolute left-0 top-[calc(100%+4px)] z-50 min-w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg)] shadow-lg">
              {YEARS.map((y) => (
                <div key={y}>
                  <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-light)]">{y}</div>
                  {getTermsForYear(getWeeksForUni(selectedUni), y).map((t) => {
                    const isActive = selectedTerm === t && selectedYear === y;
                    return (
                      <button
                        key={t}
                        onClick={() => { setSelectedYear(y); setSelectedTerm(t); setSelectorOpen(false); }}
                        className={cn(
                          'flex w-full items-center px-3 py-2 text-[13px] font-medium transition',
                          isActive ? 'bg-[var(--primary-subtle)] text-[var(--primary-dark)]' : 'text-[var(--text-mid)] hover:bg-[var(--bg-light)]',
                        )}
                      >
                        {t} {y}
                        {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legend info button */}
        <button
          onClick={() => setLegendOpen((v) => !v)}
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition',
            legendOpen ? 'border-[var(--primary)] bg-[var(--primary-subtle)] text-[var(--primary-dark)]' : 'border-[var(--border)] bg-[var(--bg)] text-[var(--text-light)]',
          )}
        >
          {legendOpen ? <X size={13} /> : <Info size={13} />}
        </button>
      </div>

      {/* Legend panel */}
      {legendOpen && (
        <div className="flex flex-wrap gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-light)] p-3">
          {(['teaching', 'flex', 'stuvac', 'exam', 'break'] as WeekType[]).map((type) => (
            <span key={type} className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold', mobileBadgeClasses[type])}>
              {type === 'flex' ? (selectedUni === 'UNSW' ? 'Flex' : 'Mid-Sem') : type === 'teaching' ? 'Teaching' : type === 'stuvac' ? 'STUVAC' : type === 'exam' ? 'Exams' : 'Break'}
            </span>
          ))}
        </div>
      )}

      {/* Upcoming events */}
      <div>
        <div className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-light)]">
          Upcoming Events
        </div>

        {upcomingEvents.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--border)] py-5 text-center text-[13px] text-[var(--text-light)]">
            No upcoming events this term
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-[var(--border-light)] rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden">
            {upcomingEvents.map((event) => {
              const ctx = getWeekContext(event.eventDate);
              const isSpecial = ctx && (ctx.week.type === 'stuvac' || ctx.week.type === 'exam');
              const weekTag = ctx ? mobileLabel[ctx.week.type](ctx.week.label) : null;

              return (
                <div key={event.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={cn(
                    'flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg text-center',
                    ctx ? mobileBadgeClasses[ctx.week.type] : 'bg-[var(--bg-light)] text-[var(--text-light)]',
                    isSpecial && 'ring-1 ring-orange-300 dark:ring-orange-500/40',
                  )}>
                    <span className="text-[9px] font-bold uppercase leading-none tracking-wide opacity-70">{weekTag ?? '—'}</span>
                    <span className="mt-0.5 text-[11px] font-bold leading-none">
                      {event.eventDate.toLocaleDateString('en-AU', { day: 'numeric' })}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-[var(--text)]">{event.title}</p>
                    <p className="text-[12px] text-[var(--text-light)]">
                      {event.eventDate.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  {isSpecial && (
                    <span className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                      ctx!.week.type === 'exam' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300',
                    )}>
                      {ctx!.week.type === 'exam' ? 'EXM' : 'STV'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toggle full timeline */}
      <button
        onClick={() => setTimelineOpen((v) => !v)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] py-2.5 text-[13px] font-semibold text-[var(--text-mid)] transition hover:border-[var(--primary)] hover:text-[var(--primary-dark)]"
      >
        {timelineOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        {timelineOpen ? 'Hide Academic Timeline' : 'View Full Academic Timeline'}
      </button>

      {timelineOpen && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-light)] p-3" style={{ animation: 'appear 0.2s ease both' }}>
          <div
            className="flex gap-1.5 overflow-x-auto pb-2"
            style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
          >
            {weeks.map((w, i) => {
              const isCurrentWeek = i === currentIdx;
              const hasEvent = eventsByWeek.has(i);
              const abbr = mobileLabel[w.type](w.label);
              return (
                <div
                  key={w.key}
                  className={cn(
                    'flex shrink-0 flex-col items-center justify-center rounded-xl px-1 py-2 transition',
                    'h-[72px] w-[64px]',
                    typeClasses[w.type],
                    isCurrentWeek && 'outline outline-2 outline-offset-[-2px] outline-slate-700',
                    isCurrentWeek && currentTypeClasses[w.type],
                    hasEvent && 'bg-[linear-gradient(180deg,rgba(232,160,69,0.22)_0%,rgba(232,160,69,0.12)_100%)] text-[var(--primary-dark)] outline outline-2 outline-offset-[-2px] outline-[rgba(232,160,69,0.8)]',
                    hasEvent && isCurrentWeek && 'outline-slate-800',
                  )}
                  style={{ scrollSnapAlign: 'start' }}
                  title={`${w.term} ${w.label} — ${w.start.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}`}
                >
                  <span className="text-center text-[11px] font-bold uppercase tracking-wide leading-none">{abbr}</span>
                  <span className="mt-1 text-center text-[9px] leading-none opacity-60">
                    {w.start.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                  </span>
                  {hasEvent && (
                    <div className="mt-1.5 flex gap-0.5">
                      {eventsByWeek.get(i)!.slice(0, 3).map((_, di) => (
                        <div key={di} className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] shadow-[0_0_4px_rgba(232,160,69,0.6)]" />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-1 flex gap-1.5 overflow-hidden">
            {weeks.map((w, i) => {
              const isFirst = i === 0 || w.start.getMonth() !== weeks[i - 1].start.getMonth();
              if (!isFirst) return <div key={i} className="w-[64px] shrink-0" />;
              return (
                <div key={i} className="w-[64px] shrink-0 text-center text-[9px] font-semibold uppercase tracking-wide text-[var(--text-light)]">
                  {w.start.toLocaleDateString('en-AU', { month: 'short' })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

function uniFromString(s: string | undefined): SelectedUni {
  const map: Record<string, SelectedUni> = {
    UNSW: 'UNSW', USYD: 'USYD', UTS: 'UTS', MQ: 'MQ', WSU: 'WSU',
  };
  return map[s?.toUpperCase() ?? ''] ?? 'UNSW';
}

export function AcademicTimeline({ eventDates, events = [], university }: AcademicTimelineProps) {
  const isMobile = useIsMobile();

  const defaultUni = uniFromString(university);
  const [selectedUni, setSelectedUni] = useState<SelectedUni>(defaultUni);

  const allWeeks = getWeeksForUni(selectedUni);

  const [selectedYear, setSelectedYear] = useState<Year>(() => getCurrentYearAndTerm(getWeeksForUni(defaultUni)).year);
  const [selectedTerm, setSelectedTerm] = useState<string>(() => getCurrentYearAndTerm(getWeeksForUni(defaultUni)).term);

  // When uni changes, reset to current year/term for that uni
  useEffect(() => {
    const weeks = getWeeksForUni(selectedUni);
    const { year, term } = getCurrentYearAndTerm(weeks);
    setSelectedYear(year);
    setSelectedTerm(term);
  }, [selectedUni]);

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

  const desktopProps = {
    selectedUni, setSelectedUni,
    selectedYear, setSelectedYear,
    selectedTerm, setSelectedTerm,
    termKeys, weeks, currentIdx, eventsByWeek, weekCount,
  };

  const mobileProps = {
    selectedUni, setSelectedUni,
    selectedYear, setSelectedYear,
    selectedTerm, setSelectedTerm,
    weeks, currentIdx, eventsByWeek,
  };

  return (
    <div className="bg-[var(--bg)] px-3 py-3 md:px-4 md:py-3 rounded-3xl">
      {isMobile ? (
        <MobileTimeline {...mobileProps} events={timelineEvents} />
      ) : (
        <DesktopTimeline {...desktopProps} eventDates={eventDates} />
      )}
    </div>
  );
}
