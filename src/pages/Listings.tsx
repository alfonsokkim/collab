import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Briefcase, Calendar, Globe, RefreshCw, Search, Users, Waves, Wine, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { fetchListings, type Listing as DbListing } from '../services/listingService';
import { cacheDelete } from '../lib/cache';
import { SOCIETY_TYPES, getSocietyProfile } from '../services/societyService';
import { sendCollabRequest, fetchOutgoingRequestedListingIds } from '../services/collabRequestService';
import { useAuth } from '../contexts/AuthContext';
import { cacheGet } from '../lib/cache';

interface Listing {
  id: string;
  userId: string;
  title: string;
  society: string;
  societyType?: string;
  description: string;
  date: string;
  rawDate: string;
  peopleNeeded: number;
  icon: React.ComponentType<{ size: number; strokeWidth?: number }>;
  bannerImage?: string;
  tags: string[];
}

const tagToIconMap: { [key: string]: React.ComponentType<{ size: number; strokeWidth?: number }> } = {
  Social: Wine,
  Events: Wine,
  Pubcrawl: Wine,
  Tech: Briefcase,
  Networking: Briefcase,
  Workshop: Briefcase,
  Sports: Waves,
  Outdoor: Waves,
  Competition: Waves,
  Culture: Globe,
  Festival: Globe,
  Community: Globe,
};

const EVENT_TYPES = ['Social', 'Networking', 'Workshop', 'Sports', 'Cultural', 'Tech', 'Festival', 'Charity'];

// ── Express Interest modal ────────────────────────────────────────────────────

function ExpressInterestModal({
  listing,
  onClose,
}: {
  listing: Listing;
  onClose: (sent?: boolean) => void;
}) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(false); };
    window.addEventListener('keydown', handler);
    setTimeout(() => textareaRef.current?.focus(), 50);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSend = async () => {
    setSending(true);
    const result = await sendCollabRequest(listing.id, listing.userId, message);
    setSending(false);
    if (result.success) { setSent(true); setTimeout(() => onClose(true), 900); }
    else if (result.error) { setSendError(result.error); }
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      onClick={() => onClose(false)}
    >
      <div
        className="relative w-full max-w-[460px] rounded-2xl bg-[var(--bg)] shadow-2xl"
        style={{ animation: 'modal-pop 0.2s cubic-bezier(0.34,1.4,0.64,1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-5">
          <h2 className="text-[17px] font-bold text-[var(--text)] mb-1">Express Interest</h2>
          <p className="text-sm text-[var(--text-light)] mb-5">
            Send a collaboration request to <strong className="text-[var(--text)]">{listing.society}</strong> for{' '}
            <strong className="text-[var(--text)]">{listing.title}</strong>
          </p>

          <label className="block mb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-light)]">
            Message <span className="font-normal normal-case tracking-normal">(optional)</span>
          </label>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Introduce your society and why you'd like to collaborate..."
            rows={4}
            className="w-full resize-none rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-light)] px-3.5 py-3 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-light)] focus:border-[var(--primary)] transition"
          />
        </div>

        {sendError && (
          <p className="mx-6 mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            {sendError}
          </p>
        )}
        <div className="flex items-center justify-end gap-2.5 border-t border-[var(--border-light)] px-6 py-4">
          <button
            onClick={() => onClose(false)}
            className="rounded-[var(--radius)] border border-[var(--border)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--text-mid)] transition hover:bg-[var(--bg-light)] hover:text-[var(--text)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || sent || !!sendError}
            className={cn(
              'rounded-[var(--radius)] px-5 py-2 text-sm font-semibold text-white transition',
              sent
                ? 'bg-green-600 cursor-default'
                : sendError
                ? 'cursor-not-allowed bg-[var(--text-light)] opacity-60'
                : 'bg-[var(--dark)] hover:-translate-y-px hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed',
            )}
          >
            {sent ? 'Request Sent!' : sending ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Listing detail panel (Google-Images-style sidebar) ───────────────────────

function ListingDetailPanel({
  listing,
  onClose,
  isOwner,
  alreadyRequested,
  onExpressInterest,
  className,
}: {
  listing: Listing;
  onClose: () => void;
  isOwner: boolean;
  alreadyRequested: boolean;
  onExpressInterest: () => void;
  className?: string;
}) {
  const IconComponent = listing.icon;

  return (
    <div className={cn('flex flex-col overflow-hidden border border-[var(--border)] bg-[var(--bg)]', className)}>
        {/* Sticky top bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--bg)]/95 px-5 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <a
              href={`/listings/${listing.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-mid)] underline underline-offset-2 transition hover:text-[var(--text)]"
              onClick={(e) => e.stopPropagation()}
            >
              View in new tab
              <ArrowUpRight size={12} strokeWidth={2.5} />
            </a>
            {isOwner && (
              <a
                href={`/listings/${listing.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-[var(--primary-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--primary-dark)] transition hover:opacity-80"
                onClick={(e) => e.stopPropagation()}
              >
                Edit listing
              </a>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-light)] text-[var(--text-mid)] transition hover:border-[var(--text-light)] hover:text-[var(--text)]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          {/* Banner */}
          <div className="aspect-[16/9] w-full overflow-hidden bg-[var(--bg-light)]">
            {listing.bannerImage ? (
              <img src={listing.bannerImage} alt={listing.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[var(--primary-subtle)] text-[var(--primary-dark)]">
                <IconComponent size={48} strokeWidth={1.1} />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            {/* Title row */}
            <div className="mb-4">
              <h2 className="text-xl font-bold leading-tight text-[var(--text)]">{listing.title}</h2>
              <div className="mt-1.5 flex items-center gap-2">
                <Link
                  to={`/society/${listing.userId}`}
                  className="text-sm font-medium text-[var(--text-light)] transition hover:text-[var(--primary-dark)] hover:underline underline-offset-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {listing.society}
                </Link>
                {listing.societyType && (
                  <span className="rounded-full border border-[var(--border)] bg-[var(--bg-light)] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--text-mid)]">
                    {listing.societyType}
                  </span>
                )}
              </div>
            </div>

            {/* Meta grid */}
            <div className="mb-5 flex gap-6 rounded-xl border border-[var(--border)] bg-[var(--bg-light)] px-5 py-4">
              <div>
                <div className="mb-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.07em] text-[var(--text-light)]">
                  <Calendar size={12} className="text-[var(--primary)]" /> Date
                </div>
                <p className="text-sm font-semibold text-[var(--text)]">{listing.date}</p>
              </div>
              <div>
                <div className="mb-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.07em] text-[var(--text-light)]">
                  <Users size={12} className="text-[var(--primary)]" /> People Needed
                </div>
                <p className="text-sm font-semibold text-[var(--text)]">{listing.peopleNeeded} people</p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-5">
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-light)]">About This Event</h3>
              <p className="text-[15px] leading-7 text-[var(--text-mid)]">{listing.description}</p>
            </div>

            {/* Tags */}
            {listing.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-light)]">Event Type</h3>
                <div className="flex flex-wrap gap-2">
                  {listing.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[var(--primary-subtle)] px-3 py-1 text-xs font-bold text-[var(--primary-dark)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            {isOwner ? (
              <div className="rounded-xl border border-[rgba(232,160,69,0.3)] bg-[var(--primary-subtle)] px-5 py-4">
                <p className="mb-3 text-sm font-medium text-[var(--text-mid)]">
                  This is your listing. Manage it from the full page.
                </p>
                <a
                  href={`/listings/${listing.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--dark)] px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-px hover:shadow-md"
                >
                  Manage Listing
                  <ArrowUpRight size={14} strokeWidth={2.5} />
                </a>
              </div>
            ) : (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-light)] px-5 py-4">
                <p className="mb-3 text-sm font-medium text-[var(--text-mid)]">
                  Interested in collaborating with <strong className="text-[var(--text)]">{listing.society}</strong> on this event?
                </p>
                <button
                  disabled={alreadyRequested}
                  className={cn(
                    'rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition',
                    alreadyRequested
                      ? 'cursor-default bg-[var(--text-light)] opacity-60'
                      : 'bg-[var(--dark)] hover:-translate-y-px hover:shadow-md',
                  )}
                  onClick={alreadyRequested ? undefined : onExpressInterest}
                >
                  {alreadyRequested ? 'Interest Already Expressed' : 'Express Interest'}
                </button>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}

function mapListing(listing: DbListing): Listing {
  const icon = listing.tags.map((tag) => tagToIconMap[tag]).find(Boolean) || Wine;
  return {
    id: listing.id,
    userId: listing.userId,
    title: listing.title,
    society: listing.societyName,
    societyType: listing.societyType,
    description: listing.description,
    rawDate: listing.date,
    date: new Date(listing.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    peopleNeeded: listing.peopleNeeded,
    icon,
    bannerImage: listing.bannerImageUrl,
    tags: listing.tags,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function Listings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>(() => {
    const cached = cacheGet<DbListing[]>('listings:all');
    return cached ? cached.map(mapListing) : [];
  });
  const [loading, setLoading] = useState(() => !cacheGet('listings:all'));
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [selectedSocietyTypes, setSelectedSocietyTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedListingRequested, setSelectedListingRequested] = useState(false);
  const [expressInterestListing, setExpressInterestListing] = useState<Listing | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [requestedListingIds, setRequestedListingIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;
  const [myUniversity, setMyUniversity] = useState<string | null>(null);

  // Keep the last selected listing mounted so the sidebar close animation can play out
  const lastListingRef = useRef<Listing | null>(null);
  if (selectedListing) lastListingRef.current = selectedListing;
  const displayListing = selectedListing ?? lastListingRef.current;

  // Close the detail sidebar on Escape
  useEffect(() => {
    if (!selectedListing) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedListing(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedListing]);

  useEffect(() => {
    if (!user) return;
    fetchOutgoingRequestedListingIds().then(setRequestedListingIds);
    getSocietyProfile(user.id).then((p) => setMyUniversity(p?.university ?? null));
  }, [user]);

  const handleSelectListing = (listing: Listing) => {
    setSelectedListing(listing);
    setSelectedListingRequested(requestedListingIds.has(listing.id));
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    cacheDelete('listings:all');
    const dbListings = await fetchListings();
    setListings(dbListings.map(mapListing));
    setRefreshing(false);
  };

  useEffect(() => {
    const loadListings = async () => {
      try {
        setLoading(true);
        const dbListings = await fetchListings();
        setListings(dbListings.map(mapListing));
      } catch (error) {
        console.error('Error loading listings:', error);
      } finally {
        setLoading(false);
      }
    };
    loadListings();
  }, []);

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const upcomingListings = listings.filter((l) => new Date(`${l.rawDate}T00:00:00`) >= today);

  const matchesSearch = (listing: Listing) => {
    const q = searchQuery.toLowerCase();
    return !q || listing.title.toLowerCase().includes(q) || listing.society.toLowerCase().includes(q) || listing.description.toLowerCase().includes(q);
  };

  const filteredListings = upcomingListings.filter((listing) => {
    const matchesEventType = selectedEventTypes.length === 0 || selectedEventTypes.some((t) => listing.tags.includes(t));
    const matchesSocietyType = selectedSocietyTypes.length === 0 || (listing.societyType && selectedSocietyTypes.includes(listing.societyType));
    // University visibility: null = open to all; otherwise only show if myUniversity is in the list
    const visUnis = (listing as any).visibleToUniversities as string[] | null | undefined;
    const matchesUniversity = !visUnis || visUnis.length === 0 || !myUniversity || visUnis.includes(myUniversity);
    return matchesEventType && matchesSocietyType && matchesSearch(listing) && matchesUniversity;
  });

  // Which event types have results given current society + search filters?
  const availableEventTypes = new Set(
    upcomingListings
      .filter((l) => (selectedSocietyTypes.length === 0 || (l.societyType && selectedSocietyTypes.includes(l.societyType))) && matchesSearch(l))
      .flatMap((l) => l.tags)
  );

  // Which society types have results given current event + search filters?
  const availableSocietyTypes = new Set(
    upcomingListings
      .filter((l) => (selectedEventTypes.length === 0 || selectedEventTypes.some((t) => l.tags.includes(t))) && matchesSearch(l))
      .map((l) => l.societyType)
      .filter(Boolean)
  );

  const hasFilters = selectedEventTypes.length > 0 || selectedSocietyTypes.length > 0 || searchQuery;

  const totalPages = Math.ceil(filteredListings.length / PAGE_SIZE);
  const paginatedListings = filteredListings.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset to page 1 when filters/search change
  useEffect(() => { setCurrentPage(1); }, [selectedEventTypes, selectedSocietyTypes, searchQuery]);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-7">
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-1.5 text-[var(--text)]" style={{ fontFamily: 'var(--heading)' }}>Event Listings</h1>
          <p className="text-[15px] text-[var(--text-light)]">
            Find societies to collaborate with and create amazing events together
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh listings"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg)] text-[var(--text-light)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-40"
          >
            <RefreshCw size={15} strokeWidth={2} className={refreshing ? 'animate-spin' : ''} />
          </button>
          {user && (
            <button
              onClick={() => navigate('/create-listing')}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-[13px] font-semibold text-white transition hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(232,160,69,0.35)]"
            >
              + Post Listing
            </button>
          )}
        </div>
      </div>

      <div className="grid items-start gap-7 md:grid-cols-[210px_minmax(0,1fr)]">
        {/* Sidebar filters */}
        <aside className="flex flex-col gap-0 md:sticky md:top-20">
          <div className="mb-[18px] border-b border-[var(--border-light)] pb-[18px]">
            <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-light)]">
              Event Type
              {selectedEventTypes.length > 0 && (
                <span className="rounded-full bg-[var(--primary)] px-1.5 py-px text-[10px] font-bold text-white normal-case tracking-normal">{selectedEventTypes.length}</span>
              )}
            </h3>
            <div className="flex flex-wrap gap-1 md:flex-col md:gap-0.5">
              {EVENT_TYPES.map((tag) => {
                const isSelected = selectedEventTypes.includes(tag);
                const isUnavailable = !isSelected && !availableEventTypes.has(tag);
                return (
                  <button
                    key={tag}
                    disabled={isUnavailable}
                    className={cn(
                      'rounded-[var(--radius-sm)] border px-3 py-[7px] text-left text-[13px] font-medium transition',
                      isSelected
                        ? 'border-[rgba(232,160,69,0.25)] bg-[var(--primary-subtle)] font-semibold text-[var(--primary-dark)]'
                        : isUnavailable
                        ? 'cursor-not-allowed border-transparent bg-transparent text-[var(--text-light)] opacity-40'
                        : 'border-transparent bg-transparent text-[var(--text-mid)] hover:border-[var(--border)] hover:bg-[var(--bg-light)] hover:text-[var(--text)]',
                    )}
                    onClick={() =>
                      setSelectedEventTypes((prev) =>
                        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
                      )
                    }
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-3 border-b border-[var(--border-light)] pb-[18px] md:border-b-0 md:pb-0">
            <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-light)]">
              Society Type
              {selectedSocietyTypes.length > 0 && (
                <span className="rounded-full bg-[var(--primary)] px-1.5 py-px text-[10px] font-bold text-white normal-case tracking-normal">{selectedSocietyTypes.length}</span>
              )}
            </h3>
            <div className="flex flex-wrap gap-1 md:flex-col md:gap-0.5">
              {SOCIETY_TYPES.map((type) => {
                const isSelected = selectedSocietyTypes.includes(type);
                const isUnavailable = !isSelected && !availableSocietyTypes.has(type);
                return (
                <button
                  key={type}
                  disabled={isUnavailable}
                  className={cn(
                    'rounded-[var(--radius-sm)] border px-3 py-[7px] text-left text-[13px] font-medium transition',
                    isSelected
                      ? 'border-[rgba(232,160,69,0.25)] bg-[var(--primary-subtle)] font-semibold text-[var(--primary-dark)]'
                      : isUnavailable
                      ? 'cursor-not-allowed border-transparent bg-transparent text-[var(--text-light)] opacity-40'
                      : 'border-transparent bg-transparent text-[var(--text-mid)] hover:border-[var(--border)] hover:bg-[var(--bg-light)] hover:text-[var(--text)]',
                  )}
                  onClick={() =>
                    setSelectedSocietyTypes((prev) =>
                      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
                    )
                  }
                >
                  {type}
                </button>
                );
              })}
            </div>
          </div>

          {hasFilters && (
            <button
              className="flex w-full items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-transparent px-3 py-2 text-xs font-medium text-[var(--text-light)] transition hover:bg-[var(--bg-light)] hover:text-[var(--text)]"
              onClick={() => {
                setSelectedEventTypes([]);
                setSelectedSocietyTypes([]);
                setSearchQuery('');
              }}
            >
              <X size={13} /> Clear All
            </button>
          )}
        </aside>

        {/* Main list + detail sidebar */}
        <div className="flex min-w-0 items-start">
        <main className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-center gap-2.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-4 py-[10px] text-[var(--text-light)] transition focus-within:border-[var(--primary)] focus-within:shadow-[0_0_0_3px_rgba(232,160,69,0.1)]">
            <Search size={15} className="shrink-0" />
            <input
              type="text"
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-none bg-transparent text-[14px] text-[var(--text)] outline-none placeholder:text-[var(--text-light)]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="shrink-0 text-[var(--text-light)] hover:text-[var(--text)] transition">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="mb-1 flex items-center gap-2 text-[12px] text-[var(--text-light)]">
            <span className="rounded-full bg-[var(--bg-light)] border border-[var(--border-light)] px-2 py-0.5 font-semibold text-[var(--text-mid)]">{filteredListings.length}</span>
            listing{filteredListings.length !== 1 ? 's' : ''} found
            {hasFilters && <span className="text-[var(--primary-dark)]">· filtered</span>}
          </div>

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center text-[15px] text-[var(--text-light)]">
              Loading listings...
            </div>
          ) : paginatedListings.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-center">
              <Search size={24} className="text-[var(--text-light)] opacity-40" />
              {hasFilters ? (
                <>
                  <p className="text-[14px] text-[var(--text-light)]">No listings match your filters.</p>
                  <button
                    onClick={() => { setSelectedEventTypes([]); setSelectedSocietyTypes([]); setSearchQuery(''); }}
                    className="text-[13px] font-medium text-[var(--primary-dark)] hover:underline underline-offset-2"
                  >
                    Clear filters
                  </button>
                </>
              ) : (
                <p className="text-[14px] text-[var(--text-light)]">No listings yet - be the first to <Link to="/create-listing" className="font-medium text-[var(--primary-dark)] hover:underline underline-offset-2">post one</Link>.</p>
              )}
            </div>
          ) : (
            <div
              className="flex flex-col gap-2.5 transition-all duration-300"
              style={{ opacity: refreshing ? 0.4 : 1, filter: refreshing ? 'blur(2px)' : 'none', pointerEvents: refreshing ? 'none' : 'auto' }}
            >
              {paginatedListings.map((listing) => {
                const IconComponent = listing.icon;
                const gradients = [
                  'from-amber-400/20 to-orange-300/10',
                  'from-blue-400/20 to-indigo-300/10',
                  'from-purple-400/20 to-pink-300/10',
                  'from-emerald-400/20 to-teal-300/10',
                  'from-rose-400/20 to-red-300/10',
                ];
                const gradientClass = gradients[listing.id.charCodeAt(0) % gradients.length];
                return (
                  <div
                    key={listing.id}
                    className="group flex min-h-[120px] cursor-pointer overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)] transition-all duration-200 hover:border-[rgba(232,160,69,0.5)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] max-sm:flex-col"
                    onClick={() => handleSelectListing(listing)}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-[170px] shrink-0 overflow-hidden bg-[var(--bg-light)] max-sm:h-[140px] max-sm:w-full">
                      {listing.bannerImage ? (
                        <img src={listing.bannerImage} alt={listing.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <div className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br ${gradientClass}`}>
                          <IconComponent size={32} strokeWidth={1.2} />
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5 px-5 py-4">
                      <div className="flex items-start justify-between gap-2.5 max-sm:flex-col">
                        <div className="min-w-0">
                          <h3 className="mb-0.5 truncate text-[15px] font-bold text-[var(--text)]">{listing.title}</h3>
                          <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-light)]">
                            <Link
                              to={`/society/${listing.userId}`}
                              className="transition hover:text-[var(--primary-dark)] hover:underline underline-offset-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {listing.society}
                            </Link>
                            {listing.societyType && (
                              <span className="inline-block rounded-full border border-[var(--border)] bg-[var(--bg-light)] px-[7px] py-[2px] text-[10px] font-semibold tracking-[0.03em] text-[var(--text-mid)]">
                                {listing.societyType}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-1">
                          {listing.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-block rounded-full bg-[var(--primary-subtle)] px-2 py-[2px] text-[10px] font-semibold text-[var(--primary-dark)]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <p className="line-clamp-2 flex-1 text-[13px] leading-6 text-[var(--text-mid)]">
                        {listing.description}
                      </p>

                      <div className="flex gap-5 border-t border-[var(--border-light)] pt-2.5">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-[var(--primary)] shrink-0" />
                          <span className="text-[12px] font-medium text-[var(--text-mid)]">{listing.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users size={12} className="text-[var(--primary)] shrink-0" />
                          <span className="text-[12px] font-medium text-[var(--text-mid)]">{listing.peopleNeeded} people needed</span>
                        </div>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex shrink-0 items-center px-0 py-4 pr-4 max-sm:px-4 max-sm:pb-4 max-sm:pt-0">
                      <button
                        className="w-full rounded-[var(--radius)] border border-[rgba(232,160,69,0.3)] bg-[var(--primary-subtle)] px-4 py-2 text-[13px] font-semibold text-[var(--primary-dark)] transition hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(232,160,69,0.3)]"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectListing(listing);
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-1.5">
              <button
                onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] text-[var(--text-mid)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:pointer-events-none disabled:opacity-30"
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const isActive = page === currentPage;
                const isNearCurrent = Math.abs(page - currentPage) <= 1 || page === 1 || page === totalPages;
                if (!isNearCurrent) {
                  // show ellipsis once on each side
                  if (page === 2 && currentPage > 3) return <span key={page} className="px-1 text-xs text-[var(--text-light)]">…</span>;
                  if (page === totalPages - 1 && currentPage < totalPages - 2) return <span key={page} className="px-1 text-xs text-[var(--text-light)]">…</span>;
                  return null;
                }
                return (
                  <button
                    key={page}
                    onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={`flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border text-[13px] font-medium transition ${
                      isActive
                        ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                        : 'border-[var(--border)] bg-[var(--bg)] text-[var(--text-mid)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] text-[var(--text-mid)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:pointer-events-none disabled:opacity-30"
              >
                ›
              </button>
            </div>
          )}
        </main>

        {/* Detail sidebar (desktop) - squeezes the list width like Google Images */}
        <div
          className={cn(
            'shrink-0 overflow-hidden transition-all duration-300 ease-in-out max-md:hidden md:sticky md:top-20',
            selectedListing ? 'ml-6 w-[380px] opacity-100' : 'ml-0 w-0 opacity-0',
          )}
        >
          {displayListing && (
            <div className="w-[380px]">
              <ListingDetailPanel
                listing={displayListing}
                onClose={() => setSelectedListing(null)}
                isOwner={!!user && user.id === displayListing.userId}
                alreadyRequested={selectedListingRequested}
                onExpressInterest={() => user ? setExpressInterestListing(displayListing) : navigate('/login')}
                className="max-h-[calc(100vh-6rem)] rounded-[var(--radius-lg)]"
              />
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Detail overlay (mobile) - slides in from the right */}
      {selectedListing && (
        <div
          className="fixed inset-0 z-[1500] bg-slate-950/60 backdrop-blur-sm md:hidden"
          onClick={() => setSelectedListing(null)}
        >
          <div
            className="absolute inset-y-0 right-0 w-full max-w-[420px]"
            style={{ animation: 'gallerySlideRight 0.25s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <ListingDetailPanel
              listing={selectedListing}
              onClose={() => setSelectedListing(null)}
              isOwner={!!user && user.id === selectedListing.userId}
              alreadyRequested={selectedListingRequested}
              onExpressInterest={() => user ? setExpressInterestListing(selectedListing) : navigate('/login')}
              className="h-full"
            />
          </div>
        </div>
      )}

      {expressInterestListing && (
        <ExpressInterestModal
          listing={expressInterestListing}
          onClose={(sent?: boolean) => {
            setExpressInterestListing(null);
            if (sent && expressInterestListing) {
              setRequestedListingIds((prev) => new Set([...prev, expressInterestListing.id]));
              setSelectedListingRequested(true);
            }
          }}
        />
      )}
    </div>
  );
}
