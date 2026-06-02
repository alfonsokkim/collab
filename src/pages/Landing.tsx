import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import ncsLogo from '../assets/NCS-logo.png';
import {
  ArrowRight, Calendar, Clock, Edit2, Filter, Image, Plus,
  RefreshCw, Search, Star, Users, X, Zap,
} from 'lucide-react';

// ── Mock: Explore / Listings page ─────────────────────────────────────────────

function ListingsPreview() {
  return (
    <div className="h-full bg-[#141414] rounded-xl overflow-hidden flex text-white" style={{ fontSize: 11 }}>
      {/* Sidebar */}
      <div className="w-[90px] shrink-0 border-r border-white/8 px-3 py-3 flex flex-col gap-3">
        <div>
          <div className="text-[8px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Event Type</div>
          {['Social', 'Networking', 'Workshop', 'Sports', 'Festival'].map((t, i) => (
            <div key={t} className={`py-[3px] text-[10px] rounded px-1.5 mb-0.5 ${i === 0 ? 'bg-amber-500/15 text-amber-400 font-semibold' : i === 1 ? 'text-white/70 font-medium' : 'text-white/25'}`}>{t}</div>
          ))}
        </div>
        <div className="border-t border-white/8 pt-2">
          <div className="text-[8px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Society Type</div>
          {['Faculty', 'Hobby', 'Business', 'Tech'].map((t, i) => (
            <div key={t} className={`py-[3px] text-[10px] rounded px-1.5 mb-0.5 ${i === 1 ? 'text-white/70 font-medium' : 'text-white/25'}`}>{t}</div>
          ))}
        </div>
      </div>
      {/* Main */}
      <div className="flex-1 flex flex-col p-2.5 gap-2 min-w-0">
        <div className="flex items-center gap-2 bg-white/6 rounded-lg px-2.5 py-1.5 border border-white/8">
          <Search size={10} className="text-white/30 shrink-0" />
          <span className="text-[10px] text-white/30">Search listings…</span>
        </div>
        <div className="text-[9px] text-white/30">2 listings found</div>
        {[
          { title: 'Hackathon Night 2025', society: 'UNSW Tech Society', type: 'Hobby', date: 'Aug 20, 2026', need: '50 people needed', tags: ['Social', 'Events', 'Tech'], dot: 'bg-blue-500' },
          { title: 'Winter Pub Crawl', society: 'Arc Outdoors', type: 'Faculty', date: 'Sep 5, 2026', need: '30 people needed', tags: ['Social', 'Festival'], dot: 'bg-purple-500' },
        ].map((c, i) => (
          <div key={i} className="flex gap-2 bg-white/4 rounded-lg border border-white/6 overflow-hidden">
            <div className={`w-10 shrink-0 flex items-center justify-center bg-white/8`}>
              <div className={`w-4 h-4 rounded-full ${c.dot} opacity-70`} />
            </div>
            <div className="flex-1 py-2 min-w-0">
              <div className="flex items-start justify-between gap-1 mb-0.5">
                <span className="font-semibold text-white/85 text-[10px] leading-tight">{c.title}</span>
                <div className="flex gap-0.5 shrink-0">
                  {c.tags.map(t => <span key={t} className="text-[7px] font-bold bg-amber-500/15 text-amber-400 px-1 py-px rounded-full">{t}</span>)}
                </div>
              </div>
              <div className="text-[8.5px] text-white/40">{c.society} <span className="bg-white/10 rounded px-1 py-px ml-0.5">{c.type}</span></div>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-0.5 text-[8px] text-white/35"><Calendar size={7} />{c.date}</span>
                <span className="flex items-center gap-0.5 text-[8px] text-white/35"><Users size={7} />{c.need}</span>
              </div>
            </div>
            <div className="flex items-center pr-2">
              <div className="text-[8px] font-semibold border border-amber-500/40 bg-amber-500/10 text-amber-400 px-2 py-1 rounded-md">View</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Mock: Create Listing form ──────────────────────────────────────────────────

function CreateListingPreview() {
  return (
    <div className="h-full bg-[#141414] rounded-xl overflow-hidden p-3.5 flex flex-col gap-2.5 text-white" style={{ fontSize: 11 }}>
      <div>
        <div className="font-bold text-white/90 text-[13px]">Create Event Listing</div>
        <div className="text-[9px] text-white/35 mt-0.5">Post a new collaboration opportunity for your society</div>
      </div>
      {/* Title */}
      <div>
        <div className="text-[9px] font-semibold text-white/60 mb-1">Event Title</div>
        <div className="flex items-center gap-1.5 bg-white/6 border border-white/10 rounded-lg px-2.5 py-1.5">
          <Image size={9} className="text-white/25 shrink-0" />
          <span className="text-[9px] text-white/25">e.g., Epic Pubcrawl Collaboration</span>
        </div>
      </div>
      {/* Banner */}
      <div>
        <div className="text-[9px] font-semibold text-white/60 mb-1">Event Banner <span className="text-white/30 font-normal">(Optional)</span></div>
        <div className="bg-white/4 border border-dashed border-white/12 rounded-lg py-3 flex flex-col items-center gap-1">
          <Image size={14} className="text-white/25" />
          <span className="text-[8px] text-white/35">Click to upload or drag and drop</span>
          <span className="text-[7px] text-white/20">PNG, JPG, GIF up to 5MB</span>
        </div>
      </div>
      {/* Description */}
      <div className="flex-1 flex flex-col">
        <div className="text-[9px] font-semibold text-white/60 mb-1">Description</div>
        <div className="flex-1 bg-white/6 border border-white/10 rounded-lg px-2.5 py-2 text-[8px] text-white/25">
          Describe your event and what you're looking for in collaborating societies…
        </div>
      </div>
      {/* Date + People row */}
      <div className="flex gap-2">
        <div className="flex-1">
          <div className="text-[9px] font-semibold text-white/60 mb-1">Event Date</div>
          <div className="flex items-center gap-1 bg-white/6 border border-white/10 rounded-lg px-2 py-1.5">
            <Calendar size={8} className="text-white/30" />
            <span className="text-[8px] text-white/25">dd / mm / yyyy</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="text-[9px] font-semibold text-white/60 mb-1">People Needed</div>
          <div className="flex items-center gap-1 bg-white/6 border border-white/10 rounded-lg px-2 py-1.5">
            <Users size={8} className="text-white/30" />
            <span className="text-[8px] text-white/25">e.g., 50</span>
          </div>
        </div>
      </div>
      {/* Tags */}
      <div>
        <div className="text-[9px] font-semibold text-white/60 mb-1">Event Type(s)</div>
        <div className="flex flex-wrap gap-1">
          {['Social', 'Events', 'Tech', 'Sports', 'Workshop'].map((t, i) => (
            <span key={t} className={`text-[8px] font-semibold px-2 py-0.5 rounded-full border ${i < 2 ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'border-white/10 text-white/30'}`}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Mock: Profile page ────────────────────────────────────────────────────────

function ProfilePreview() {
  return (
    <div className="h-full bg-[#141414] rounded-xl overflow-hidden flex flex-col text-white" style={{ fontSize: 11 }}>
      {/* Academic calendar strip */}
      <div className="border-b border-white/8 px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[8px] font-bold uppercase tracking-widest text-white/30">Event Calendar</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] text-white/40">UNSW</span>
            {['T1','T2','T3'].map((t, i) => (
              <span key={t} className={`text-[8px] px-1.5 py-0.5 rounded-full ${i === 0 ? 'bg-blue-500/80 text-white font-bold' : 'text-white/30'}`}>{t}</span>
            ))}
            <span className="text-[8px] text-white/40 ml-1">2026</span>
          </div>
        </div>
        {/* Timeline dots */}
        <div className="flex items-center gap-px">
          {Array.from({ length: 13 }).map((_, i) => (
            <div key={i} className={`h-2 flex-1 flex items-center justify-center`}>
              <div className={`w-1.5 h-1.5 rounded-full ${i < 10 ? 'bg-blue-500/70' : i < 12 ? 'bg-orange-500/70' : 'bg-white/20'}`} />
            </div>
          ))}
        </div>
      </div>
      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: profile card */}
        <div className="w-[100px] shrink-0 border-r border-white/8 p-2.5 flex flex-col items-center gap-1.5">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/40 to-indigo-600/30 border-2 border-white/15 flex items-center justify-center">
            <span className="text-[11px] font-bold text-white">CS</span>
          </div>
          <div className="text-center">
            <div className="text-[9px] font-bold text-white/85 leading-tight">Coding Society</div>
            <div className="text-[8px] text-amber-400 font-bold uppercase mt-0.5">Tech</div>
            <div className="text-[8px] text-white/35 mt-0.5">UNSW</div>
          </div>
          <div className="flex gap-1.5 mt-0.5">
            {['✉','📷','📘'].map((icon, i) => (
              <div key={i} className="w-5 h-5 rounded-full bg-white/8 flex items-center justify-center text-[8px]">{icon}</div>
            ))}
          </div>
          <div className="flex items-center gap-0.5 mt-1">
            {[1,2,3,4].map(i => <Star key={i} size={8} className="fill-amber-400 text-amber-400" />)}
            <Star size={8} className="text-white/20" />
          </div>
          <div className="mt-1 flex items-center gap-1 border border-white/10 rounded-full px-2 py-0.5">
            <Edit2 size={7} className="text-white/40" />
            <span className="text-[8px] text-white/40">Edit Profile</span>
          </div>
        </div>
        {/* Right: listings panel */}
        <div className="flex-1 p-2.5 flex flex-col gap-2 min-w-0">
          <div className="flex gap-1.5">
            {['View My Listings', 'History'].map((t, i) => (
              <div key={t} className={`text-[8px] font-semibold px-2.5 py-1 rounded-md ${i === 0 ? 'border border-amber-500/50 text-amber-400' : 'border border-white/10 text-white/40'}`}>{t}</div>
            ))}
            <div className="text-[8px] font-semibold px-2.5 py-1 rounded-md border border-white/10 text-white/40 flex items-center gap-1"><Plus size={7} />Create New</div>
          </div>
          <div className="flex-1 bg-white/3 rounded-lg border border-white/6 p-3 flex flex-col items-center justify-center gap-1.5">
            <Clock size={14} className="text-amber-500/70" />
            <div className="text-[9px] font-semibold text-white/50">No upcoming listings yet</div>
            <div className="text-[7.5px] text-white/25 text-center">Create a new listing and it will appear here as an upcoming event card.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Hero 3D mockup ────────────────────────────────────────────────────────────

function HeroMockup() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start end', 'end start'] });
  const rotateX = useTransform(scrollYProgress, [0, 0.5], [16, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.97, 1]);

  return (
    <div ref={containerRef} className="relative w-full max-w-4xl mx-auto mt-10 px-4">
      <motion.div
        style={{ rotateX, scale, transformPerspective: 1200 }}
        className="relative rounded-2xl border border-black/10 dark:border-white/10 shadow-2xl bg-white dark:bg-[#141414] overflow-hidden"
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-black/6 dark:border-white/8 bg-black/2 dark:bg-white/3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
          <div className="flex-1 mx-4 bg-black/5 dark:bg-white/8 rounded-md h-5 flex items-center px-3">
            <span className="text-[10px] text-black/30 dark:text-white/30">trycollab.au/listings</span>
          </div>
          <RefreshCw size={11} className="text-black/20 dark:text-white/20" />
        </div>
        {/* Nav */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-black/6 dark:border-white/6">
          <span className="text-[13px] font-bold text-black dark:text-white" style={{ fontFamily: 'var(--heading)' }}>Collab</span>
          <div className="flex items-center gap-5">
            {['Home','Profile','Explore','Listings'].map((n, i) => (
              <span key={n} className={`text-[11px] ${i === 3 ? 'text-[var(--primary)] font-semibold' : 'text-black/40 dark:text-white/40'}`}>{n}</span>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-black/5 dark:bg-white/8 rounded-lg px-3 py-1.5 border border-black/8 dark:border-white/10">
            <span className="text-[10px] text-black/60 dark:text-white/60">cat appreciation society</span>
            <span className="text-[10px] text-black/30 dark:text-white/30">▾</span>
          </div>
        </div>
        {/* Content */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[15px] font-bold text-black dark:text-white" style={{ fontFamily: 'var(--heading)' }}>Event Listings</h2>
              <p className="text-[11px] text-black/40 dark:text-white/40">Find societies to collaborate with</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center">
                <RefreshCw size={11} className="text-black/30 dark:text-white/30" />
              </div>
              <div className="text-[11px] font-semibold bg-[var(--primary)] text-white px-3 py-1.5 rounded-lg">+ Post Listing</div>
            </div>
          </div>
          <div className="flex gap-4">
            {/* Mini sidebar */}
            <div className="w-[100px] shrink-0">
              <div className="text-[8px] font-bold uppercase tracking-widest text-black/30 dark:text-white/30 mb-1.5">Event Type</div>
              {['Social','Networking','Workshop','Sports','Festival','Charity'].map((t, i) => (
                <div key={t} className={`py-[4px] px-2 text-[10px] rounded mb-0.5 ${i === 0 || i === 4 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold' : i < 2 ? 'text-black/60 dark:text-white/60' : 'text-black/25 dark:text-white/25'}`}>{t}</div>
              ))}
              <div className="mt-2 mb-1 border-t border-black/6 dark:border-white/6 pt-2 text-[8px] font-bold uppercase tracking-widest text-black/30 dark:text-white/30">Society Type</div>
              {['Faculty','Hobby','Business','Sports','Tech'].map((t, i) => (
                <div key={t} className={`py-[4px] px-2 text-[10px] rounded mb-0.5 ${i === 1 ? 'text-black/60 dark:text-white/60 font-semibold' : 'text-black/25 dark:text-white/25'}`}>{t}</div>
              ))}
            </div>
            {/* Cards */}
            <div className="flex-1 flex flex-col gap-2.5 min-w-0">
              <div className="flex items-center gap-2 bg-black/4 dark:bg-white/5 rounded-lg px-3 py-2 border border-black/6 dark:border-white/8">
                <Search size={12} className="text-black/30 dark:text-white/30" />
                <span className="text-[11px] text-black/25 dark:text-white/25">Search listings…</span>
              </div>
              {[
                { title: 'new listing epic meetup', society: 'no code society', type: 'Hobby', date: 'August 20, 2026', need: '243 people needed', tags: ['Social','Events','Festival'], dot: 'bg-white/60' },
                { title: 'Winter Hackathon Night', society: 'UNSW Tech Society', type: 'Tech', date: 'September 5, 2026', need: '50 people needed', tags: ['Tech','Workshop'], dot: 'bg-blue-400/80' },
              ].map((c, i) => (
                <div key={i} className="flex overflow-hidden rounded-xl border border-black/8 dark:border-white/8 bg-black/1 dark:bg-white/2">
                  <div className="w-[60px] shrink-0 flex items-center justify-center bg-black/4 dark:bg-white/4 border-r border-black/6 dark:border-white/6">
                    <div className={`w-6 h-6 rounded-full ${c.dot}`} />
                  </div>
                  <div className="flex-1 px-3 py-2.5 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <span className="text-[11px] font-bold text-black/80 dark:text-white/80">{c.title}</span>
                      <div className="flex gap-1 shrink-0">
                        {c.tags.slice(0, 2).map(t => <span key={t} className="text-[8px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-px rounded-full">{t}</span>)}
                      </div>
                    </div>
                    <div className="text-[9px] text-black/40 dark:text-white/40 mb-1">{c.society} <span className="bg-black/6 dark:bg-white/10 rounded px-1.5 py-px ml-1">{c.type}</span></div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[9px] text-black/35 dark:text-white/35"><Calendar size={8} />{c.date}</span>
                      <span className="flex items-center gap-1 text-[9px] text-black/35 dark:text-white/35"><Users size={8} />{c.need}</span>
                    </div>
                  </div>
                  <div className="flex items-center pr-3">
                    <div className="text-[9px] font-semibold border border-amber-500/40 bg-amber-500/8 text-amber-600 dark:text-amber-400 px-2.5 py-1.5 rounded-lg">View Details</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-[#141414] to-transparent pointer-events-none" />
      </motion.div>
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-2/3 h-14 bg-[var(--primary)]/15 blur-3xl rounded-full pointer-events-none" />
    </div>
  );
}

// ── Scroll step — driven by section scroll progress ──────────────────────────

function ScrollStep({ step, title, description, preview, index, scrollYProgress, range }: {
  step: number;
  title: string;
  description: string;
  preview: React.ReactNode;
  index: number;
  scrollYProgress: MotionValue<number>;
  range: [number, number];
}) {
  const textOnLeft = index % 2 === 0;

  // Shared progress: 0 = hidden, 1 = fully visible
  const progress = useTransform(scrollYProgress, [range[0], range[1]], [0, 1]);
  const opacity = useTransform(progress, [0, 1], [0, 1]);

  const textX = useTransform(progress, [0, 1], [textOnLeft ? -50 : 50, 0]);
  const previewX = useTransform(progress, [0, 1], [textOnLeft ? 50 : -50, 0]);
  const blur = useTransform(progress, [0, 1], [8, 0]);
  const blurFilter = useTransform(blur, (v) => `blur(${v}px)`);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
      {/* Text */}
      <motion.div
        style={{ opacity, x: textX, filter: blurFilter }}
        className={index % 2 === 1 ? 'md:order-2' : ''}
      >
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-full bg-[var(--primary)]/12 border border-[var(--primary)]/25 flex items-center justify-center">
            <span className="text-[12px] font-bold text-[var(--primary)]">{step}</span>
          </div>
          <div className="h-px w-8 bg-[var(--primary)]/20" />
        </div>
        <h3
          className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-3 leading-tight"
          style={{ fontFamily: 'var(--heading)' }}
        >
          {title}
        </h3>
        <p className="text-[var(--text-light)] leading-relaxed text-[16px]">{description}</p>
      </motion.div>

      {/* Preview */}
      <motion.div
        style={{ opacity, x: previewX, filter: blurFilter }}
        className={`h-64 sm:h-72 ${index % 2 === 1 ? 'md:order-1' : ''}`}
      >
        <div className="h-full rounded-2xl border border-black/8 dark:border-white/8 overflow-hidden shadow-[var(--shadow-lg)]">
          {preview}
        </div>
      </motion.div>
    </div>
  );
}

// ── How it works section — scroll progress drives each step ──────────────────

function HowItWorksSection({ steps }: { steps: { title: string; description: string; preview: React.ReactNode }[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  // Each step fully animates in over a 20% window of the section's scroll range.
  // Step 1: 0.05 → 0.25, Step 2: 0.35 → 0.55, Step 3: 0.62 → 0.82
  const ranges: [number, number][] = [
    [0.05, 0.22],
    [0.28, 0.45],
    [0.50, 0.70],
  ];

  return (
    <section ref={sectionRef} className="relative px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-16 sm:mb-20">
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text)] tracking-tight"
            style={{ fontFamily: 'var(--heading)' }}
          >
            How it works
          </h2>
          <p className="mt-4 text-[var(--text-light)] text-[16px] max-w-md mx-auto">
            From idea to co-hosted event — in three steps.
          </p>
        </div>

        <div className="flex flex-col gap-20 sm:gap-28">
          {steps.map((s, i) => (
            <ScrollStep
              key={i}
              index={i}
              step={i + 1}
              title={s.title}
              description={s.description}
              preview={s.preview}
              scrollYProgress={scrollYProgress}
              range={ranges[i]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const steps = [
    {
      title: 'Post your listing',
      description: "Create a listing for your upcoming event — add a title, banner, description, event type tags, and how many partners you need. Takes under a minute.",
      preview: <CreateListingPreview />,
    },
    {
      title: 'Browse & connect',
      description: "Explore listings from every society across UNSW. Filter by event type or society type. Send a collab request directly from the card.",
      preview: <ListingsPreview />,
    },
    {
      title: 'Build your reputation',
      description: "Every successful collab adds to your profile. Earn ratings, show off your track record, and become the most trusted partner on campus.",
      preview: <ProfilePreview />,
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)]">

      {/* ── HERO ── */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-24 pb-8 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(232,160,69,0.07) 0%, transparent 70%)' }}
        />


        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20, filter: 'blur(12px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 text-center text-[52px] sm:text-[68px] md:text-[84px] font-extrabold leading-[1.03] tracking-[-2px] sm:tracking-[-2.5px] md:tracking-[-3px] text-[var(--text)]"
          style={{ fontFamily: "'Urbanist', sans-serif" }}
        >
          Collabs made<br />
          <span className="text-[var(--primary)]">easier.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="mb-9 mx-auto max-w-[500px] text-center text-[17px] sm:text-[19px] leading-[1.7] text-[var(--text-light)]"
        >
          Find societies to co-host events, share resources, and build a reputation as a reliable partner across UNSW.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap justify-center gap-3 mb-4"
        >
          <Link
            to="/listings"
            className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-[var(--primary)] px-6 py-3 text-[15px] font-semibold text-white transition hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(232,160,69,0.35)]"
          >
            Browse Listings <ArrowRight size={15} />
          </Link>
          <button
            onClick={() => navigate(user ? '/create-listing' : '/login')}
            className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-black/12 dark:border-white/15 bg-black/4 dark:bg-white/6 px-6 py-3 text-[15px] font-semibold text-[var(--text-mid)] transition hover:border-black/20 dark:hover:border-white/25 hover:bg-black/7 dark:hover:bg-white/10 hover:text-[var(--text)]"
          >
            Create a Listing
          </button>
        </motion.div>

        {/* 3D Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          <HeroMockup />
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <HowItWorksSection steps={steps} />

      {/* ── FINAL CTA ── */}
      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className="text-3xl sm:text-4xl font-bold text-[var(--text)] mb-4"
            style={{ fontFamily: 'var(--heading)' }}
          >
            Ready to find your next collab?
          </h2>
          <p className="text-[var(--text-light)] mb-8 text-[16px]">
            Join societies already using Collab to build better events together.
          </p>
          <Link
            to="/listings"
            className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-[var(--primary)] px-8 py-3.5 text-[15px] font-semibold text-white transition hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(232,160,69,0.35)]"
          >
            Get started <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-6 pb-8 pt-4 border-t border-[var(--border-light)]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-5xl mx-auto">
          <p className="flex items-center gap-2 text-[12px] font-medium text-black/25 dark:text-white/25">
            cos we couldnt find collabs...
            <img
              src={ncsLogo}
              alt="No Code Society"
              className="h-6 w-auto opacity-30 [filter:brightness(0)] dark:[filter:brightness(0)_invert(1)]"
            />
          </p>
          <div className="flex gap-5 text-[12px] text-black/45 dark:text-white/25">
            <Link to="/terms" className="hover:text-black/70 dark:hover:text-white/50 transition-colors">Terms of Service</Link>
            <span className="opacity-40">·</span>
            <Link to="/privacy" className="hover:text-black/70 dark:hover:text-white/50 transition-colors">Privacy Policy</Link>
            <span className="opacity-40">·</span>
            <a href="mailto:hello@collabapp.au" className="hover:text-black/70 dark:hover:text-white/50 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
