import { useEffect, useState } from 'react';
import ncsLogo from '../assets/NCS-logo.png';
import { fetchListings } from '../services/listingService';
import { fetchIncomingRequests } from '../services/collabRequestService';
import { supabase } from '../lib/supabase';

const MIN_DURATION = 2600;

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(p => (p < 85 ? p + 1.8 : p));
    }, 40);

    const preload = async () => {
      const tasks: Promise<any>[] = [fetchListings()];
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) tasks.push(fetchIncomingRequests());
      } catch {}
      await Promise.allSettled(tasks);
    };

    Promise.all([preload(), new Promise(res => setTimeout(res, MIN_DURATION))]).then(() => {
      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => {
        setExiting(true);
        setTimeout(onDone, 650);
      }, 250);
    });

    return () => clearInterval(progressInterval);
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[var(--dark)]"
      style={{
        opacity: exiting ? 0 : 1,
        transform: exiting ? 'scale(1.015)' : 'scale(1)',
        transition: exiting ? 'opacity 0.65s ease, transform 0.65s ease' : 'none',
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    >
      {/* Radial glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse,rgba(232,160,69,0.16)_0%,transparent_70%)]" />
      {/* Bottom corner accent */}
      <div className="pointer-events-none absolute bottom-[-60px] right-[-60px] h-[320px] w-[320px] bg-[radial-gradient(ellipse,rgba(232,160,69,0.08)_0%,transparent_70%)]" />

      <div className="relative z-10 flex flex-col items-center gap-5 text-center px-8">
        {/* Logo */}
        <div style={{ animation: 'splash-logo 0.75s cubic-bezier(0.16,1,0.3,1) both' }}>
          <img
            src={ncsLogo}
            alt="NCS"
            className="h-12 w-auto opacity-85"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>

        {/* Badge */}
        <div style={{ animation: 'splash-up 0.65s 0.18s cubic-bezier(0.16,1,0.3,1) both' }}>
          <span className="inline-block rounded-full border border-[rgba(232,160,69,0.3)] bg-[rgba(232,160,69,0.12)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.13em] text-[var(--primary)]">
            UNSW Society Collaboration
          </span>
        </div>

        {/* Headline */}
        <div style={{ animation: 'splash-up 0.65s 0.32s cubic-bezier(0.16,1,0.3,1) both' }}>
          <h1
            className="text-white font-extrabold leading-[1.05] tracking-[-1.5px]"
            style={{
              fontFamily: 'var(--heading)',
              fontSize: 'clamp(32px, 6vw, 56px)',
            }}
          >
            Bringing Societies{' '}
            <em className="not-italic text-[var(--primary)]">Together</em>
          </h1>
        </div>

        {/* Subtext */}
        <div style={{ animation: 'splash-up 0.65s 0.48s cubic-bezier(0.16,1,0.3,1) both' }}>
          <p className="text-[15px] text-white/40 max-w-[360px] leading-relaxed">
            Connect with UNSW societies to co-host events and build bigger experiences for students.
          </p>
        </div>

        {/* Animated dots */}
        <div
          className="flex items-center gap-2 mt-1"
          style={{ animation: 'splash-up 0.65s 0.62s cubic-bezier(0.16,1,0.3,1) both' }}
        >
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="block h-[6px] w-[6px] rounded-full bg-[var(--primary)]"
              style={{ animation: `splash-dot 1.3s ${i * 0.22}s ease-in-out infinite` }}
            />
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/[0.06]">
        <div
          className="h-full bg-gradient-to-r from-[var(--primary-dark)] to-[var(--primary-light)]"
          style={{
            width: `${progress}%`,
            transition: 'width 0.3s ease-out',
            boxShadow: '0 0 8px rgba(232,160,69,0.5)',
          }}
        />
      </div>
    </div>
  );
}
