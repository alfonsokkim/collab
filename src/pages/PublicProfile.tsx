import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getOrCreateDMRoom } from '../services/chatService';
import { CalendarDays, Star, Users, X } from 'lucide-react';
import { getSocietyProfile, type SocietyProfile } from '../services/societyService';
import { fetchListingsByUserId, type Listing } from '../services/listingService';
import { fetchReviewsForUser, submitReview, type Review } from '../services/reviewService';
import { useAuth } from '../contexts/AuthContext';
import { AcademicTimeline } from '../components/AcademicTimeline';
import facebookIcon from '../assets/facebook-icon.svg';
import discordIcon from '../assets/discord-icon.svg';
import instagramIcon from '../assets/instagram-icon.svg';
import linkedinIcon from '../assets/linkedin-icon.svg';
import { cn } from '../lib/utils';

type Tab = 'upcoming' | 'past';

function toEventDate(d: string) { return new Date(`${d}T00:00:00`); }
function startOfToday() { const d = new Date(); d.setHours(0,0,0,0); return d; }
function formatDate(date: string) {
  return toEventDate(date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
function normalizeInstagram(h?: string) {
  if (!h) return ''; if (h.startsWith('http')) return h;
  return `https://instagram.com/${h.replace(/^@+/, '').trim()}`;
}
function normalizeFacebook(h?: string) {
  if (!h) return ''; if (h.startsWith('http')) return h;
  return `https://facebook.com/${h.replace(/^@+/, '').trim()}`;
}
function normalizeLinkedin(h?: string) {
  if (!h) return ''; if (h.startsWith('http')) return h;
  return `https://linkedin.com/in/${h.replace(/^\/+/, '').trim()}`;
}

function StarIcon({ fill, id }: { fill: number; id: string }) {
  const pct = `${(fill * 100).toFixed(1)}%`;
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
          <stop offset={pct} stopColor="#F59E0B" />
          <stop offset={pct} stopColor="var(--border)" />
        </linearGradient>
      </defs>
      <path fill={`url(#${id})`} d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}

function timeAgo(dateStr: string): string {
  const normalized = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z';
  const diff = Date.now() - new Date(normalized).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ReviewStars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = (hover || value) >= i;
        return (
          <button
            key={i}
            type="button"
            disabled={!onChange}
            onClick={() => onChange?.(i)}
            onMouseEnter={() => onChange && setHover(i)}
            onMouseLeave={() => onChange && setHover(0)}
            className={cn('transition', onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default')}
          >
            <Star
              size={20}
              strokeWidth={1.5}
              className={filled ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}
            />
          </button>
        );
      })}
    </div>
  );
}

function SocietyAvatar({ name, logoUrl }: { name?: string; logoUrl?: string }) {
  if (logoUrl) {
    return <img src={logoUrl} alt={name} className="h-9 w-9 shrink-0 rounded-full border border-[var(--border)] object-cover" />;
  }
  const initials = (name || '?').split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary-subtle)] text-[12px] font-bold text-[var(--primary-dark)]">
      {initials}
    </div>
  );
}

function ReviewsModal({
  societyName,
  societyUserId,
  currentUserId,
  onClose,
}: {
  societyName: string;
  societyUserId: string;
  currentUserId?: string;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const canReview = !!currentUserId && currentUserId !== societyUserId;

  useEffect(() => {
    fetchReviewsForUser(societyUserId).then((r) => {
      setReviews(r);
      setLoading(false);
      if (currentUserId) {
        const mine = r.find((rv) => rv.reviewerUserId === currentUserId);
        if (mine) { setRating(mine.rating); setMessage(mine.message ?? ''); setSubmitted(true); }
      }
    });
  }, [societyUserId, currentUserId]);

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const handleSubmit = async () => {
    if (!rating) return;
    setSubmitting(true);
    setSubmitError('');
    const res = await submitReview(societyUserId, rating, message.trim() || undefined);
    setSubmitting(false);
    if (res.success) {
      setSubmitted(true);
      const fresh = await fetchReviewsForUser(societyUserId);
      setReviews(fresh);
    } else {
      setSubmitError(res.error ?? 'Failed to submit');
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="flex max-h-[85vh] w-full max-w-[520px] flex-col overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--bg)] shadow-[0_32px_80px_rgba(15,23,42,0.2)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-light)] px-6 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-light)]">Reviews</p>
            <h2 className="text-lg font-bold leading-tight text-[var(--text)]">{societyName}</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-light)] transition hover:bg-[var(--bg-light)] hover:text-[var(--text)]">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto">
          {/* Write a review */}
          {canReview && (
            <div className="border-b border-[var(--border-light)] px-6 py-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-light)]">
                {submitted ? 'Your review' : 'Leave a review'}
              </p>
              <ReviewStars value={rating} onChange={submitted ? undefined : setRating} />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={submitted}
                placeholder="Share your experience (optional)"
                rows={3}
                className="mt-2.5 w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--bg-light)] px-3 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-light)] outline-none focus:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
              />
              {submitError && <p className="mt-1 text-xs text-red-500">{submitError}</p>}
              {!submitted && (
                <button
                  onClick={handleSubmit}
                  disabled={!rating || submitting}
                  className="mt-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--primary-dark)] disabled:opacity-50"
                >
                  {submitting ? 'Submitting…' : 'Submit Review'}
                </button>
              )}
              {submitted && <p className="mt-1.5 text-xs text-[var(--text-light)]">You've already reviewed — edit not supported yet.</p>}
            </div>
          )}

          {/* Summary */}
          {reviews.length > 0 && (
            <div className="flex items-center gap-3 border-b border-[var(--border-light)] px-6 py-3">
              <span className="text-[32px] font-bold leading-none text-[var(--text)]">{avg.toFixed(1)}</span>
              <div>
                <ReviewStars value={Math.round(avg)} />
                <p className="mt-0.5 text-xs text-[var(--text-light)]">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          )}

          {/* List */}
          <div className="divide-y divide-[var(--border-light)] px-6">
            {loading ? (
              <p className="py-8 text-center text-sm text-[var(--text-light)]">Loading…</p>
            ) : reviews.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <Star size={32} strokeWidth={1.2} className="mb-3 text-[var(--text-light)]" />
                <p className="font-semibold text-[var(--text)]">No reviews yet :(</p>
                <p className="mt-1 text-sm text-[var(--text-light)]">Be the first to leave one!</p>
              </div>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="py-4">
                  <div className="mb-2 flex items-center gap-2.5">
                    <SocietyAvatar name={r.reviewerName} logoUrl={r.reviewerLogoUrl} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--text)]">{r.reviewerName ?? 'Unknown Society'}</p>
                      <p className="text-[11px] text-[var(--text-light)]">{timeAgo(r.createdAt)}</p>
                    </div>
                    <ReviewStars value={r.rating} />
                  </div>
                  {r.message && <p className="text-sm leading-[1.6] text-[var(--text-mid)]">{r.message}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  const navigate = useNavigate();
  return (
    <article
      className="cursor-pointer overflow-hidden rounded-[22px] border border-[var(--border)] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] transition hover:-translate-y-[3px] hover:border-[rgba(232,160,69,0.35)] hover:shadow-[0_16px_34px_rgba(15,23,42,0.08)]"
      onClick={() => navigate(`/listings/${listing.id}`)}
    >
      <div className="aspect-[16/8.5] bg-slate-50">
        {listing.bannerImageUrl ? (
          <img src={listing.bannerImageUrl} alt={listing.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#fff1de_0%,#f8fafc_100%)] text-[var(--primary-dark)]">
            <CalendarDays size={28} strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div className="p-[15px_16px_16px]">
        <h3 className="mb-1 text-base font-bold leading-tight text-[var(--text)]">{listing.title}</h3>
        <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--primary-dark)]">
          {formatDate(listing.date)}
        </span>
        <p className="mt-2 text-sm leading-[1.55] text-[var(--text-mid)] line-clamp-2">{listing.description}</p>
        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[var(--text-light)]">
          <Users size={13} strokeWidth={2} />
          {listing.peopleNeeded} spot{listing.peopleNeeded === 1 ? '' : 's'} requested
        </div>
      </div>
    </article>
  );
}

export function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [society, setSociety] = useState<SocietyProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [messagingLoading, setMessagingLoading] = useState(false);

  const handleMessage = async () => {
    if (!user) { navigate('/login'); return; }
    if (!userId) return;
    setMessagingLoading(true);
    const roomId = await getOrCreateDMRoom(userId);
    setMessagingLoading(false);
    if (roomId) navigate(`/chat?room=${roomId}`);
  };

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      const [profile, userListings] = await Promise.all([
        getSocietyProfile(userId),
        fetchListingsByUserId(userId),
      ]);
      setSociety(profile);
      setListings(userListings);
      setLoading(false);
    };
    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[var(--text-light)]">
        Loading...
      </div>
    );
  }

  if (!society) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-[var(--text-light)]">
        <p className="text-lg font-medium text-[var(--text)]">Society not found</p>
        <Link to="/listings" className="text-sm text-[var(--primary-dark)] underline underline-offset-2">
          Back to Explore
        </Link>
      </div>
    );
  }

  const today = startOfToday();
  const upcomingListings = listings
    .filter((l) => toEventDate(l.date) >= today)
    .sort((a, b) => toEventDate(a.date).getTime() - toEventDate(b.date).getTime());
  const pastListings = listings
    .filter((l) => toEventDate(l.date) < today)
    .sort((a, b) => toEventDate(b.date).getTime() - toEventDate(a.date).getTime());
  const visibleListings = tab === 'upcoming' ? upcomingListings : pastListings;

  const socialLinks = [
    { key: 'instagram', icon: instagramIcon, href: normalizeInstagram(society.instagram), label: 'Instagram' },
    { key: 'discord', icon: discordIcon, href: society.discordUrl || '', label: 'Discord' },
    { key: 'facebook', icon: facebookIcon, href: normalizeFacebook(society.facebook), label: 'Facebook' },
    { key: 'linkedin', icon: linkedinIcon, href: normalizeLinkedin(society.linkedin), label: 'LinkedIn' },
  ].filter((l) => l.href);

  const tabClass = (t: Tab) =>
    cn(
      'inline-flex items-center justify-center rounded-2xl border px-[18px] py-[13px] text-sm font-bold transition',
      tab === t
        ? 'border-[rgba(232,160,69,0.35)] bg-[#fdf1e2] text-[#9a5f14]'
        : 'border-[var(--border)] bg-[var(--bg)] text-[var(--text-mid)] hover:border-[rgba(232,160,69,0.34)] hover:text-[var(--text)]',
    );

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-8 md:px-7">
      {reviewsOpen && userId && (
        <ReviewsModal
          societyName={society.name}
          societyUserId={userId}
          currentUserId={user?.id}
          onClose={() => setReviewsOpen(false)}
        />
      )}
      <section className="mb-7">
        <div className="w-full rounded-[28px] border border-[var(--border)] bg-[var(--bg)] p-4 text-[var(--text)] shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:p-1">
          <AcademicTimeline
            eventDates={listings.map((l) => new Date(`${l.date}T00:00:00`))}
            events={listings.map((l) => ({ id: l.id, title: l.title, date: l.date }))}
          />
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-[88px]">
          <section className="rounded-[28px] border border-[var(--border)] bg-[var(--bg)] p-[28px_24px] shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <div className="mx-auto mb-[22px] w-fit">
              {society.logoImageUrl ? (
                <div className="h-[132px] w-[132px] overflow-hidden rounded-[28px] border border-[var(--border)]">
                  <img src={society.logoImageUrl} alt={society.name} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-[132px] w-[132px] items-center justify-center rounded-[28px] bg-[linear-gradient(145deg,#172033_0%,#101827_100%)] text-white/60">
                  <Users size={56} strokeWidth={1.5} />
                </div>
              )}
            </div>

            <div className="text-center">
              <h1 className="break-words text-[34px] leading-[1.05] text-[var(--text)]">
                {society.name}
              </h1>
              {society.societyType && (
                <p className="mt-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--primary-dark)]">
                  {society.societyType}
                </p>
              )}
              <p className="mt-[18px] text-[15px] leading-[1.75] text-[var(--text-mid)]">
                {society.description || 'No description provided.'}
              </p>

              {socialLinks.length > 0 && (
                <div className="mt-6 flex items-center justify-center gap-3.5">
                  {socialLinks.map((link) => (
                    <a
                      key={link.key}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.label}
                      className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-full border border-[var(--border)] bg-white transition hover:-translate-y-0.5 hover:border-[rgba(232,160,69,0.4)] hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                    >
                      <img src={link.icon} alt={link.label} className="h-[18px] w-[18px]" />
                    </a>
                  ))}
                </div>
              )}

              <div className="mt-6 inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-light)] px-3.5 py-2 text-xs font-bold uppercase tracking-[0.06em] text-[var(--text-light)]">
                Founded in {society.foundedYear || new Date().getFullYear()}
              </div>

              {/* Reviews */}
              <div className="mt-4 flex flex-col items-center gap-2">
                <div className="flex items-center gap-1.5">
                  {[0,1,2,3,4].map((i) => (
                    <StarIcon key={i} fill={0} id={`pub-${i}`} />
                  ))}
                  <span className="ml-1 text-sm font-semibold text-[var(--text)]">No ratings yet</span>
                </div>
                <button
                  onClick={() => setReviewsOpen(true)}
                  className="text-[13px] font-medium text-[var(--primary-dark)] underline underline-offset-2 transition hover:opacity-70"
                >
                  View all reviews
                </button>
              </div>
              {user && user.id !== userId && (
                <button
                  onClick={handleMessage}
                  disabled={messagingLoading}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--dark)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--dark-surface)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {messagingLoading ? 'Opening chat…' : 'Send Message'}
                </button>
              )}

              {society.membersCount ? (
                <p className="mt-3 text-sm text-[var(--text-light)]">
                  <span className="font-semibold text-[var(--text)]">{society.membersCount}</span> members
                </p>
              ) : null}
            </div>
          </section>
        </aside>

        {/* Main */}
        <main className="min-w-0">
          <div className="mb-5 flex gap-3">
            <button className={tabClass('upcoming')} onClick={() => setTab('upcoming')}>
              Upcoming Events
            </button>
            <button className={tabClass('past')} onClick={() => setTab('past')}>
              Past Events
            </button>
          </div>

          <section className="rounded-[28px] border border-[var(--border)] bg-[var(--bg)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <div className="mb-[22px]">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-light)]">
                {tab === 'upcoming' ? 'Upcoming Events' : 'Past Events'}
              </span>
              <h2 className="mt-2 text-[28px] leading-[1.1] text-[var(--text)]">
                {tab === 'upcoming'
                  ? `What ${society.name} has coming up`
                  : `Events run by ${society.name}`}
              </h2>
            </div>

            {visibleListings.length > 0 ? (
              <div className="grid gap-[14px] sm:grid-cols-2 xl:grid-cols-3">
                {visibleListings.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[240px] flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border)] px-8 py-10 text-center text-[var(--text-light)]">
                <CalendarDays size={28} strokeWidth={1.6} className="mb-3.5 text-[var(--primary-dark)]" />
                <p className="font-medium text-[var(--text)]">
                  {tab === 'upcoming' ? 'No upcoming events' : 'No past events yet'}
                </p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
