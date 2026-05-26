import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ncsLogo from '../assets/NCS-logo.png';

export function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="relative flex h-[calc(100vh-60px)] flex-col items-center justify-center overflow-hidden bg-white px-6 dark:bg-[var(--bg)]">

      {/* Heading */}
      <h1
        className="mb-7 text-center font-[var(--heading)] text-[60px] font-extrabold leading-[1.04] tracking-[-2px] text-black sm:text-[76px] sm:tracking-[-3px] md:text-[92px] md:tracking-[-4px] dark:text-white"
        style={{ animation: 'landing-up 0.7s cubic-bezier(0.16,1,0.3,1) both' }}
      >
        Collabs made easier.
      </h1>

      {/* Subtitle */}
      <p
        className="mb-10 mx-auto max-w-[540px] text-center text-[19px] leading-[1.75] text-black/40 sm:text-[21px] dark:text-white/40"
        style={{ animation: 'landing-up 0.7s 0.12s cubic-bezier(0.16,1,0.3,1) both' }}
      >
        Find societies to co-host events, share resources, post listings,
        and build a reputation as a reliable partner across UNSW.
      </p>

      {/* CTAs */}
      <div
        className="flex flex-wrap justify-center gap-3"
        style={{ animation: 'landing-up 0.7s 0.22s cubic-bezier(0.16,1,0.3,1) both' }}
      >
        <Link
          to="/listings"
          className="inline-flex items-center rounded-[var(--radius)] border border-black/12 bg-white px-7 py-[13px] text-[15px] font-semibold text-black transition hover:-translate-y-px hover:bg-white/90 hover:shadow-[0_6px_20px_rgba(0,0,0,0.12)] dark:border-white/15 dark:bg-white dark:text-black dark:hover:bg-white/90"
        >
          Browse Events
        </Link>
        <button
          onClick={() => navigate(user ? '/create-listing' : '/login')}
          className="inline-flex items-center rounded-[var(--radius)] border border-black/12 bg-black/5 px-7 py-[13px] text-[15px] font-semibold text-black/60 transition hover:border-black/22 hover:bg-black/8 hover:text-black/85 dark:border-white/12 dark:bg-white/5 dark:text-white/60 dark:hover:border-white/22 dark:hover:bg-white/8 dark:hover:text-white/85"
        >
          Create a Listing
        </button>
      </div>

      {/* Gag tag */}
      <div className="fixed bottom-4 right-6 z-50 sm:bottom-5">
        <p className="flex items-center gap-2 text-[12px] font-medium text-black/25 dark:text-white/25">
          cos we couldnt find collabs...
          <img
            src={ncsLogo}
            alt="No Code Society"
            className="h-6 w-auto opacity-30 [filter:brightness(0)] dark:[filter:brightness(0)_invert(1)]"
          />
        </p>
      </div>

      {/* Footer */}
      <div className="fixed bottom-10 left-0 right-0 flex justify-center gap-5 text-[12px] text-black/25 dark:text-white/25 sm:bottom-5">
        <Link to="/terms" className="hover:text-black/50 dark:hover:text-white/50 transition-colors">Terms of Service</Link>
        <span className="opacity-40">·</span>
        <Link to="/privacy" className="hover:text-black/50 dark:hover:text-white/50 transition-colors">Privacy Policy</Link>
        <span className="opacity-40">·</span>
        <a href="mailto:hello@collabapp.au" className="hover:text-black/50 dark:hover:text-white/50 transition-colors">Contact</a>
      </div>
    </div>
  );
}
