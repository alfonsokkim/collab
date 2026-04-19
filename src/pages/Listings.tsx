import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Briefcase, Calendar, Globe, Search, Users, Waves, Wine, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { fetchListings } from '../services/listingService';
import { SOCIETY_TYPES } from '../services/societyService';
import { sendCollabRequest } from '../services/collabRequestService';
import { useAuth } from '../contexts/AuthContext';

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
  onClose: () => void;
}) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    setTimeout(() => textareaRef.current?.focus(), 50);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSend = async () => {
    setSending(true);
    const ok = await sendCollabRequest(listing.id, listing.userId, message);
    setSending(false);
    if (ok) { setSent(true); setTimeout(onClose, 900); }
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      onClick={onClose}
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

        <div className="flex items-center justify-end gap-2.5 border-t border-[var(--border-light)] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-[var(--radius)] border border-[var(--border)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--text-mid)] transition hover:bg-[var(--bg-light)] hover:text-[var(--text)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || sent}
            className={cn(
              'rounded-[var(--radius)] px-5 py-2 text-sm font-semibold text-white transition',
              sent
                ? 'bg-green-600 cursor-default'
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

// ── Listing detail modal ──────────────────────────────────────────────────────

function ListingModal({
  listing,
  onClose,
  isOwner,
  onExpressInterest,
}: {
  listing: Listing;
  onClose: () => void;
  isOwner: boolean;
  onExpressInterest: () => void;
}) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const IconComponent = listing.icon;

  return (
    <div
      className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[680px] max-h-[88vh] overflow-hidden rounded-2xl bg-[var(--bg)] shadow-2xl flex flex-col"
        style={{ animation: 'modal-pop 0.2s cubic-bezier(0.34,1.4,0.64,1)' }}
        onClick={(e) => e.stopPropagation()}
      >
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
          <div className="aspect-[16/7] w-full overflow-hidden bg-[var(--bg-light)]">
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
              <h2 className="text-2xl font-bold leading-tight text-[var(--text)]">{listing.title}</h2>
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
                  className="rounded-lg bg-[var(--dark)] px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-px hover:shadow-md"
                  onClick={onExpressInterest}
                >
                  Express Interest
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function Listings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [selectedSocietyTypes, setSelectedSocietyTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [expressInterestListing, setExpressInterestListing] = useState<Listing | null>(null);

  useEffect(() => {
    const loadListings = async () => {
      try {
        setLoading(true);
        const dbListings = await fetchListings();
        const mappedListings: Listing[] = dbListings.map((listing) => {
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
        });
        setListings(mappedListings);
      } catch (error) {
        console.error('Error loading listings:', error);
      } finally {
        setLoading(false);
      }
    };
    loadListings();
  }, []);

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const filteredListings = listings.filter((listing) => {
    if (new Date(`${listing.rawDate}T00:00:00`) < today) return false;
    const matchesEventType =
      selectedEventTypes.length === 0 || selectedEventTypes.some((t) => listing.tags.includes(t));
    const matchesSocietyType =
      selectedSocietyTypes.length === 0 ||
      (listing.societyType && selectedSocietyTypes.includes(listing.societyType));
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      listing.title.toLowerCase().includes(q) ||
      listing.society.toLowerCase().includes(q) ||
      listing.description.toLowerCase().includes(q);
    return matchesEventType && matchesSocietyType && matchesSearch;
  });

  const hasFilters = selectedEventTypes.length > 0 || selectedSocietyTypes.length > 0 || searchQuery;

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-7">
      <div className="mb-7">
        <h1 className="mb-2 text-[var(--text)]">Event Listings</h1>
        <p className="text-base text-[var(--text-light)]">
          Find societies to collaborate with and create amazing events together
        </p>
      </div>

      <div className="grid items-start gap-7 md:grid-cols-[210px_minmax(0,1fr)]">
        {/* Sidebar filters */}
        <aside className="flex flex-col gap-0 md:sticky md:top-20">
          <div className="mb-[18px] border-b border-[var(--border-light)] pb-[18px]">
            <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-light)]">
              Event Type
            </h3>
            <div className="flex flex-wrap gap-1 md:flex-col md:gap-0.5">
              {EVENT_TYPES.map((tag) => (
                <button
                  key={tag}
                  className={cn(
                    'rounded-[var(--radius-sm)] border px-3 py-[7px] text-left text-[13px] font-medium transition',
                    selectedEventTypes.includes(tag)
                      ? 'border-[rgba(232,160,69,0.25)] bg-[var(--primary-subtle)] font-semibold text-[var(--primary-dark)]'
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
              ))}
            </div>
          </div>

          <div className="mb-3 border-b border-[var(--border-light)] pb-[18px] md:border-b-0 md:pb-0">
            <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-light)]">
              Society Type
            </h3>
            <div className="flex flex-wrap gap-1 md:flex-col md:gap-0.5">
              {SOCIETY_TYPES.map((type) => (
                <button
                  key={type}
                  className={cn(
                    'rounded-[var(--radius-sm)] border px-3 py-[7px] text-left text-[13px] font-medium transition',
                    selectedSocietyTypes.includes(type)
                      ? 'border-[rgba(232,160,69,0.25)] bg-[var(--primary-subtle)] font-semibold text-[var(--primary-dark)]'
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
              ))}
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

        {/* Main list */}
        <main className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3.5 py-[9px] text-[var(--text-light)]">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-none bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-light)]"
            />
          </div>

          <div className="mb-1 text-xs font-medium text-[var(--text-light)]">
            Showing {filteredListings.length} listing{filteredListings.length !== 1 ? 's' : ''}
          </div>

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center text-[15px] text-[var(--text-light)]">
              Loading listings...
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filteredListings.map((listing) => {
                const IconComponent = listing.icon;
                return (
                  <div
                    key={listing.id}
                    className="flex min-h-[120px] cursor-pointer overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)] transition hover:border-[rgba(232,160,69,0.45)] hover:shadow-[0_3px_16px_rgba(0,0,0,0.06)] max-sm:flex-col"
                    onClick={() => setSelectedListing(listing)}
                  >
                    <div className="w-[180px] shrink-0 overflow-hidden bg-[var(--bg-light)] max-sm:h-[140px] max-sm:w-full">
                      {listing.bannerImage ? (
                        <img src={listing.bannerImage} alt={listing.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[var(--primary-subtle)] text-[var(--primary-dark)]">
                          <IconComponent size={36} strokeWidth={1.25} />
                        </div>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-1.5 px-[18px] py-[14px]">
                      <div className="flex items-start justify-between gap-2.5 max-sm:flex-col">
                        <div>
                          <h3 className="mb-0.5 text-[15px] font-bold text-[var(--text)]">{listing.title}</h3>
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

                      <div className="flex gap-5 border-t border-[var(--border-light)] pt-2">
                        <div className="flex flex-col gap-px">
                          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--text-light)]">
                            <Calendar size={13} className="text-[var(--primary)]" />
                            Date
                          </span>
                          <span className="text-xs font-medium text-[var(--text)]">{listing.date}</span>
                        </div>
                        <div className="flex flex-col gap-px">
                          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--text-light)]">
                            <Users size={13} className="text-[var(--primary)]" />
                            Need
                          </span>
                          <span className="text-xs font-medium text-[var(--text)]">
                            {listing.peopleNeeded} people
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center px-0 py-[14px] pr-4 max-sm:px-[14px] max-sm:pb-[14px] max-sm:pt-0">
                      <button
                        className="w-full rounded-[var(--radius)] bg-[var(--dark)] px-4 py-2 text-[13px] font-semibold text-white transition hover:-translate-y-px hover:opacity-90"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedListing(listing);
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
        </main>
      </div>

      {selectedListing && (
        <ListingModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          isOwner={!!user && user.id === selectedListing.userId}
          onExpressInterest={() => user ? setExpressInterestListing(selectedListing) : navigate('/login')}
        />
      )}

      {expressInterestListing && (
        <ExpressInterestModal
          listing={expressInterestListing}
          onClose={() => setExpressInterestListing(null)}
        />
      )}
    </div>
  );
}
