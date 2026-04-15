import { useEffect, useState } from 'react';
import '../styles/AcademicTimeline.css';

type WeekType = 'teaching' | 'flex' | 'stuvac' | 'exam' | 'break';
type CalendarMode = 'trimester' | 'semester';

interface WeekCell {
  key: string;
  label: string;       // "W1", "Flex", "Stuvac", "Exams", "Break"
  start: Date;         // Monday
  type: WeekType;
  term: string;        // "T1", "T2", "T3", "S1", "S2", ""
}

// ── Calendar definitions ──────────────────────────────────────────────────────

function d(iso: string) { return new Date(iso + 'T00:00:00'); }

// UNSW Trimester 2025 calendar
const UNSW_WEEKS: WeekCell[] = [
  // T1
  { key:'t1-w1',   label:'W1',    start:d('2025-02-17'), type:'teaching', term:'T1' },
  { key:'t1-w2',   label:'W2',    start:d('2025-02-24'), type:'teaching', term:'T1' },
  { key:'t1-w3',   label:'W3',    start:d('2025-03-03'), type:'teaching', term:'T1' },
  { key:'t1-w4',   label:'W4',    start:d('2025-03-10'), type:'teaching', term:'T1' },
  { key:'t1-w5',   label:'W5',    start:d('2025-03-17'), type:'teaching', term:'T1' },
  { key:'t1-fx',   label:'Flex',  start:d('2025-03-24'), type:'flex',     term:'T1' },
  { key:'t1-w6',   label:'W6',    start:d('2025-03-31'), type:'teaching', term:'T1' },
  { key:'t1-w7',   label:'W7',    start:d('2025-04-07'), type:'teaching', term:'T1' },
  { key:'t1-w8',   label:'W8',    start:d('2025-04-14'), type:'teaching', term:'T1' },
  { key:'t1-w9',   label:'W9',    start:d('2025-04-22'), type:'teaching', term:'T1' },
  { key:'t1-w10',  label:'W10',   start:d('2025-04-28'), type:'teaching', term:'T1' },
  // note: teaching ends Thu 24 Apr (ANZAC 25 Apr), so W10 is a short week
  { key:'t1-sv',   label:'Stuvac',start:d('2025-05-05'), type:'stuvac',   term:'T1' },
  { key:'t1-ex1',  label:'Exams', start:d('2025-05-12'), type:'exam',     term:'T1' },
  { key:'t1-ex2',  label:'Exams', start:d('2025-05-19'), type:'exam',     term:'T1' },
  // Break T1→T2
  { key:'b1-1',    label:'Break', start:d('2025-05-26'), type:'break',    term:'' },
  { key:'b1-2',    label:'Break', start:d('2025-06-02'), type:'break',    term:'' },
  // T2
  { key:'t2-w1',   label:'W1',    start:d('2025-06-09'), type:'teaching', term:'T2' },
  { key:'t2-w2',   label:'W2',    start:d('2025-06-16'), type:'teaching', term:'T2' },
  { key:'t2-w3',   label:'W3',    start:d('2025-06-23'), type:'teaching', term:'T2' },
  { key:'t2-w4',   label:'W4',    start:d('2025-06-30'), type:'teaching', term:'T2' },
  { key:'t2-w5',   label:'W5',    start:d('2025-07-07'), type:'teaching', term:'T2' },
  { key:'t2-fx',   label:'Flex',  start:d('2025-07-14'), type:'flex',     term:'T2' },
  { key:'t2-w6',   label:'W6',    start:d('2025-07-21'), type:'teaching', term:'T2' },
  { key:'t2-w7',   label:'W7',    start:d('2025-07-28'), type:'teaching', term:'T2' },
  { key:'t2-w8',   label:'W8',    start:d('2025-08-04'), type:'teaching', term:'T2' },
  { key:'t2-w9',   label:'W9',    start:d('2025-08-11'), type:'teaching', term:'T2' },
  { key:'t2-w10',  label:'W10',   start:d('2025-08-18'), type:'teaching', term:'T2' },
  { key:'t2-sv',   label:'Stuvac',start:d('2025-08-25'), type:'stuvac',   term:'T2' },
  { key:'t2-ex1',  label:'Exams', start:d('2025-09-01'), type:'exam',     term:'T2' },
  { key:'t2-ex2',  label:'Exams', start:d('2025-09-08'), type:'exam',     term:'T2' },
  // Break T2→T3
  { key:'b2-1',    label:'Break', start:d('2025-09-15'), type:'break',    term:'' },
  // T3
  { key:'t3-w1',   label:'W1',    start:d('2025-09-22'), type:'teaching', term:'T3' },
  { key:'t3-w2',   label:'W2',    start:d('2025-09-29'), type:'teaching', term:'T3' },
  { key:'t3-w3',   label:'W3',    start:d('2025-10-06'), type:'teaching', term:'T3' },
  { key:'t3-w4',   label:'W4',    start:d('2025-10-13'), type:'teaching', term:'T3' },
  { key:'t3-w5',   label:'W5',    start:d('2025-10-20'), type:'teaching', term:'T3' },
  { key:'t3-fx',   label:'Flex',  start:d('2025-10-27'), type:'flex',     term:'T3' },
  { key:'t3-w6',   label:'W6',    start:d('2025-11-03'), type:'teaching', term:'T3' },
  { key:'t3-w7',   label:'W7',    start:d('2025-11-10'), type:'teaching', term:'T3' },
  { key:'t3-w8',   label:'W8',    start:d('2025-11-17'), type:'teaching', term:'T3' },
  { key:'t3-w9',   label:'W9',    start:d('2025-11-24'), type:'teaching', term:'T3' },
  { key:'t3-w10',  label:'W10',   start:d('2025-12-01'), type:'teaching', term:'T3' },
  { key:'t3-sv',   label:'Stuvac',start:d('2025-12-08'), type:'stuvac',   term:'T3' },
  { key:'t3-ex1',  label:'Exams', start:d('2025-12-15'), type:'exam',     term:'T3' },
  { key:'t3-ex2',  label:'Exams', start:d('2025-12-22'), type:'exam',     term:'T3' },
];

// USYD Semester 2025 calendar (mid-sem break included, 13 teaching weeks each)
const USYD_WEEKS: WeekCell[] = [
  // S1 — teaching starts Mon 24 Feb
  { key:'s1-w1',   label:'W1',    start:d('2025-02-24'), type:'teaching', term:'S1' },
  { key:'s1-w2',   label:'W2',    start:d('2025-03-03'), type:'teaching', term:'S1' },
  { key:'s1-w3',   label:'W3',    start:d('2025-03-10'), type:'teaching', term:'S1' },
  { key:'s1-w4',   label:'W4',    start:d('2025-03-17'), type:'teaching', term:'S1' },
  { key:'s1-w5',   label:'W5',    start:d('2025-03-24'), type:'teaching', term:'S1' },
  { key:'s1-w6',   label:'W6',    start:d('2025-03-31'), type:'teaching', term:'S1' },
  { key:'s1-mb',   label:'Break', start:d('2025-04-07'), type:'flex',     term:'S1' }, // Mid-sem break
  { key:'s1-w7',   label:'W7',    start:d('2025-04-14'), type:'teaching', term:'S1' },
  { key:'s1-w8',   label:'W8',    start:d('2025-04-22'), type:'teaching', term:'S1' },
  { key:'s1-w9',   label:'W9',    start:d('2025-04-28'), type:'teaching', term:'S1' },
  { key:'s1-w10',  label:'W10',   start:d('2025-05-05'), type:'teaching', term:'S1' },
  { key:'s1-w11',  label:'W11',   start:d('2025-05-12'), type:'teaching', term:'S1' },
  { key:'s1-w12',  label:'W12',   start:d('2025-05-19'), type:'teaching', term:'S1' },
  { key:'s1-w13',  label:'W13',   start:d('2025-05-26'), type:'teaching', term:'S1' },
  { key:'s1-sv',   label:'Stuvac',start:d('2025-06-02'), type:'stuvac',   term:'S1' },
  { key:'s1-ex1',  label:'Exams', start:d('2025-06-09'), type:'exam',     term:'S1' },
  { key:'s1-ex2',  label:'Exams', start:d('2025-06-16'), type:'exam',     term:'S1' },
  // Break S1→S2
  { key:'b1-1',    label:'Break', start:d('2025-06-23'), type:'break',    term:'' },
  { key:'b1-2',    label:'Break', start:d('2025-06-30'), type:'break',    term:'' },
  { key:'b1-3',    label:'Break', start:d('2025-07-07'), type:'break',    term:'' },
  { key:'b1-4',    label:'Break', start:d('2025-07-14'), type:'break',    term:'' },
  { key:'b1-5',    label:'Break', start:d('2025-07-21'), type:'break',    term:'' },
  { key:'b1-6',    label:'Break', start:d('2025-07-28'), type:'break',    term:'' },
  // S2 — teaching starts Mon 4 Aug
  { key:'s2-w1',   label:'W1',    start:d('2025-08-04'), type:'teaching', term:'S2' },
  { key:'s2-w2',   label:'W2',    start:d('2025-08-11'), type:'teaching', term:'S2' },
  { key:'s2-w3',   label:'W3',    start:d('2025-08-18'), type:'teaching', term:'S2' },
  { key:'s2-w4',   label:'W4',    start:d('2025-08-25'), type:'teaching', term:'S2' },
  { key:'s2-w5',   label:'W5',    start:d('2025-09-01'), type:'teaching', term:'S2' },
  { key:'s2-w6',   label:'W6',    start:d('2025-09-08'), type:'teaching', term:'S2' },
  { key:'s2-w7',   label:'W7',    start:d('2025-09-15'), type:'teaching', term:'S2' },
  { key:'s2-w8',   label:'W8',    start:d('2025-09-22'), type:'teaching', term:'S2' },
  { key:'s2-w9',   label:'W9',    start:d('2025-09-29'), type:'teaching', term:'S2' },
  { key:'s2-w10',  label:'W10',   start:d('2025-10-06'), type:'teaching', term:'S2' },
  { key:'s2-w11',  label:'W11',   start:d('2025-10-13'), type:'teaching', term:'S2' },
  { key:'s2-w12',  label:'W12',   start:d('2025-10-20'), type:'teaching', term:'S2' },
  { key:'s2-w13',  label:'W13',   start:d('2025-10-27'), type:'teaching', term:'S2' },
  { key:'s2-sv',   label:'Stuvac',start:d('2025-11-03'), type:'stuvac',   term:'S2' },
  { key:'s2-ex1',  label:'Exams', start:d('2025-11-10'), type:'exam',     term:'S2' },
  { key:'s2-ex2',  label:'Exams', start:d('2025-11-17'), type:'exam',     term:'S2' },
  // Summer break
  { key:'sb-1',    label:'Break', start:d('2025-11-24'), type:'break',    term:'' },
  { key:'sb-2',    label:'Break', start:d('2025-12-01'), type:'break',    term:'' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

// ── Props ─────────────────────────────────────────────────────────────────────

interface AcademicTimelineProps {
  eventDates: Date[];   // list of event dates from the society's listings
}

// ── Helpers ── get unique term keys from a week array ────────────────────────

function getTermKeys(weeks: WeekCell[]): string[] {
  const seen = new Set<string>();
  weeks.forEach(w => { if (w.term) seen.add(w.term); });
  return Array.from(seen);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AcademicTimeline({ eventDates }: AcademicTimelineProps) {
  const [mode, setMode] = useState<CalendarMode>('trimester');
  const allWeeks = mode === 'trimester' ? UNSW_WEEKS : USYD_WEEKS;
  const termKeys = getTermKeys(allWeeks);
  const [selectedTerm, setSelectedTerm] = useState<string>(termKeys[0]);

  // When mode changes, reset to first term of new mode
  useEffect(() => {
    const keys = getTermKeys(mode === 'trimester' ? UNSW_WEEKS : USYD_WEEKS);
    setSelectedTerm(keys[0]);
  }, [mode]);

  // Filter to the selected term's weeks, plus the break weeks immediately following
  const lastTermIdx = (() => {
    let last = -1;
    allWeeks.forEach((w, i) => { if (w.term === selectedTerm) last = i; });
    return last;
  })();
  const weeks = allWeeks.filter((w, i) => {
    if (w.term === selectedTerm) return true;
    // Include consecutive break weeks that follow the last week of this term
    if (w.type === 'break' && i > lastTermIdx) {
      // Only if there are no non-break weeks between lastTermIdx and i
      for (let j = lastTermIdx + 1; j < i; j++) {
        if (allWeeks[j].type !== 'break') return false;
      }
      return true;
    }
    return false;
  });

  // Find current week index within the filtered set
  const today = new Date();
  const currentIdx = weeks.findIndex(w => {
    const start = w.start.getTime();
    const end = start + 7 * 24 * 60 * 60 * 1000;
    return today.getTime() >= start && today.getTime() < end;
  });

  // Map event dates to indices within filtered weeks
  const eventsByWeek = new Map<number, Date[]>();
  eventDates.forEach(date => {
    const t = date.getTime();
    const idx = weeks.findIndex(w => {
      const start = w.start.getTime();
      return t >= start && t < start + 7 * 24 * 60 * 60 * 1000;
    });
    if (idx >= 0) {
      if (!eventsByWeek.has(idx)) eventsByWeek.set(idx, []);
      eventsByWeek.get(idx)!.push(date);
    }
  });

  const CELL_W = 42;

  return (
    <div className="academic-timeline">
      <div className="timeline-header">
        <span className="timeline-title">Event Calendar</span>
        <div className="timeline-controls">
          <div className="timeline-mode-toggle">
            <button className={mode === 'trimester' ? 'active' : ''} onClick={() => setMode('trimester')}>
              Trimester
            </button>
            <button className={mode === 'semester' ? 'active' : ''} onClick={() => setMode('semester')}>
              Semester
            </button>
          </div>
          <div className="timeline-term-toggle">
            {termKeys.map(term => (
              <button
                key={term}
                data-term={term}
                className={selectedTerm === term ? 'active' : ''}
                onClick={() => setSelectedTerm(term)}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="timeline-scroll">
        <div className="timeline-inner" style={{ width: weeks.length * CELL_W }}>

          {/* Event dots row */}
          <div className="timeline-dots" style={{ width: weeks.length * CELL_W }}>
            {Array.from(eventsByWeek.entries()).map(([idx, dates]) => (
              <div key={idx} className="event-dot-col" style={{ left: idx * CELL_W, width: CELL_W }}>
                {dates.map((date, i) => (
                  <div
                    key={i}
                    className="event-dot"
                    title={date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Week cells row */}
          <div className="timeline-cells">
            {weeks.map((w, i) => (
              <div
                key={w.key}
                className={[
                  'week-cell',
                  `type-${w.type}`,
                  i === currentIdx ? 'current' : '',
                  eventsByWeek.has(i) ? 'has-event' : '',
                ].filter(Boolean).join(' ')}
                title={`${w.term} ${w.label} — ${w.start.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}`}
              >
                <span className="week-label">{w.label}</span>
              </div>
            ))}
          </div>

          {/* Month markers */}
          <div className="timeline-months" style={{ width: weeks.length * CELL_W }}>
            {weeks.map((w, i) => {
              const isFirst = i === 0 || w.start.getMonth() !== weeks[i - 1].start.getMonth();
              if (!isFirst) return null;
              return (
                <div
                  key={`m-${i}`}
                  className="month-label"
                  style={{ left: i * CELL_W }}
                >
                  {w.start.toLocaleDateString('en-AU', { month: 'short' })}
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Legend */}
      <div className="timeline-legend">
        <span className="legend-item type-teaching">Teaching</span>
        <span className="legend-item type-flex">{mode === 'trimester' ? 'Flex Week' : 'Mid-Sem Break'}</span>
        <span className="legend-item type-stuvac">Stuvac</span>
        <span className="legend-item type-exam">Exams</span>
        <span className="legend-item type-break">Break</span>
        {eventDates.length > 0 && <span className="legend-item legend-event">Your Events</span>}
      </div>
    </div>
  );
}
