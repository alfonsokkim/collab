import { Link } from 'react-router-dom';
import { BarChart3, Calendar, Users } from 'lucide-react';
import ncsLogo from '../assets/NCS-logo.png';

const features = [
  {
    icon: Users,
    title: 'Easy Collaboration',
    description:
      'Connect with other societies to create larger, more exciting events that reach more students.',
  },
  {
    icon: Calendar,
    title: 'Event Listings',
    description:
      "Post what you're looking for and find the perfect partner societies for your next event.",
  },
  {
    icon: BarChart3,
    title: 'Track History',
    description:
      'Keep records of past collaborations and build a reputation as a reliable partner.',
  },
];

export function Landing() {
  return (
    <div className="w-full">
      <section className="relative flex min-h-[480px] items-center justify-center overflow-hidden bg-[var(--dark)] px-6 py-20 before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] before:bg-[size:40px_40px] after:pointer-events-none after:absolute after:left-1/2 after:top-1/2 after:h-[500px] after:w-[700px] after:-translate-x-1/2 after:-translate-y-1/2 after:bg-[radial-gradient(ellipse,rgba(232,160,69,0.18)_0%,transparent_70%)] md:px-10 md:py-24">
        <div className="relative z-10 max-w-[760px] text-center">
          <span className="mb-7 inline-block rounded-full border border-[rgba(232,160,69,0.25)] bg-[rgba(232,160,69,0.12)] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--primary)]">
            UNSW Society Collaboration
          </span>
          <h1 className="mb-6 font-[var(--heading)] text-white text-[40px] font-extrabold leading-[1.05] tracking-[-1px] text-white sm:text-[52px] sm:tracking-[-1.5px] md:text-[62px] md:tracking-[-2px]">
            Bringing Societies <em className="not-italic text-[var(--primary)]">Together</em>
          </h1>
          <p className="mb-8 text-base leading-[1.65] text-white">
            Connect with UNSW societies to co-host events, share resources, and build bigger
            experiences for students.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/listings"
              className="inline-flex items-center rounded-[var(--radius)] bg-[var(--primary)] px-7 py-[13px] text-[15px] font-semibold text-white transition hover:-translate-y-px hover:bg-[var(--primary-dark)] hover:text-white hover:shadow-[0_6px_20px_rgba(232,160,69,0.35)]"
            >
              Browse Events
            </Link>
            <Link
              to="/create-listing"
              className="inline-flex items-center rounded-[var(--radius)] border border-white/15 bg-white/8 px-7 py-[13px] text-[15px] font-semibold text-white/85 transition hover:border-white/25 hover:bg-white/13 hover:text-white"
            >
              Create a Listing
            </Link>
          </div>
        </div>
      </section>

      <div className="h-1 bg-[linear-gradient(90deg,transparent,var(--primary),transparent)] opacity-40" />

      <section className="mx-auto my-14 max-w-[1100px] px-4 md:my-20 md:px-7">
        <p className="mb-10 text-center text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-light)]">
          Everything you need to collaborate
        </p>
        <div className="grid overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--border)] md:grid-cols-3 md:gap-px">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="bg-[var(--bg)] px-8 py-10 transition hover:bg-[var(--bg-warm)]">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-subtle)] text-[var(--primary-dark)]">
                <Icon size={22} strokeWidth={1.75} />
              </div>
              <h3 className="mb-2 text-[17px] font-bold tracking-[-0.2px] text-[var(--text)]">{title}</h3>
              <p className="text-sm leading-[1.65] text-[var(--text-light)]">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-[var(--dark)] px-6 py-[72px] text-center before:pointer-events-none before:absolute before:bottom-[-60px] before:right-[-60px] before:h-[360px] before:w-[360px] before:bg-[radial-gradient(ellipse,rgba(232,160,69,0.12)_0%,transparent_70%)] md:px-10">
        <h2 className="mb-3.5 font-[var(--heading)] text-[32px] font-extrabold tracking-[-1px] text-white md:text-[38px]">
          Ready to Collaborate?
        </h2>
        <p className="mb-9 text-[17px] text-white/55">
          Join societies across UNSW and create unforgettable experiences
        </p>
        <Link
          to="/listings"
          className="inline-flex items-center rounded-[var(--radius)] bg-[var(--primary)] px-7 py-[13px] text-[15px] font-semibold text-white transition hover:bg-[var(--primary-dark)] hover:text-white"
        >
          Explore Listings
        </Link>
        <footer className="mt-10 border-t border-white/6 pt-5">
          <p className="flex items-center justify-end gap-2 text-[13px] font-medium text-white/35">
            cos we couldnt find collabs...
            <img
              src={ncsLogo}
              alt="No Code Society"
              className="h-7 w-auto opacity-50 [filter:brightness(0)_invert(1)]"
            />
          </p>
        </footer>
      </section>
    </div>
  );
}
