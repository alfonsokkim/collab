import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Calendar, Globe, Search, Users, Waves, Wine, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { fetchListings } from '../services/listingService';
import { SOCIETY_TYPES } from '../services/societyService';

interface Listing {
  id: number;
  title: string;
  society: string;
  societyType?: string;
  description: string;
  date: string;
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

export function Listings() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [selectedSocietyTypes, setSelectedSocietyTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadListings = async () => {
      try {
        setLoading(true);
        const dbListings = await fetchListings();
        const mappedListings: Listing[] = dbListings.map((listing) => {
          const icon = listing.tags.map((tag) => tagToIconMap[tag]).find(Boolean) || Wine;
          return {
            id: listing.id as unknown as number,
            title: listing.title,
            society: listing.societyName,
            societyType: listing.societyType,
            description: listing.description,
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

  const filteredListings = listings.filter((listing) => {
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
                    onClick={() => navigate(`/listings/${listing.id}`)}
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
                            {listing.society}
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
                        className="w-full rounded-[var(--radius)] bg-[var(--dark)] px-4 py-2 text-[13px] font-semibold text-white transition hover:-translate-y-px hover:bg-[var(--dark-surface)]"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/listings/${listing.id}`);
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
    </div>
  );
}
