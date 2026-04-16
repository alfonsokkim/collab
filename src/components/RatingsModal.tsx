import { CalendarDays, PenLine, X } from 'lucide-react';
import type { Listing } from '../services/listingService';

interface RatingsModalProps {
  listings: Listing[];
  societyName: string;
  averageRating: number;
  reviewCount: number;
  onClose: () => void;
}

function StarIcon({ fill, id }: { fill: number; id: string }) {
  const pct = `${(fill * 100).toFixed(1)}%`;
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
          <stop offset={pct} stopColor="#F59E0B" />
          <stop offset={pct} stopColor="#CBD5E1" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${id})`}
        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
      />
    </svg>
  );
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function RatingsModal({
  listings,
  societyName,
  averageRating,
  reviewCount,
  onClose,
}: RatingsModalProps) {
  const sorted = [...listings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div
      className="fixed inset-0 z-[2100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-h-[85vh] w-full max-w-[720px] overflow-hidden rounded-[28px] border border-white/10 bg-slate-950 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
            <PenLine size={14} strokeWidth={2.5} />
            Write a review
          </button>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white transition hover:bg-white/10"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          <h2 className="text-[28px] font-bold text-white">{societyName}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-300">
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <StarIcon
                  key={i}
                  fill={Math.min(1, Math.max(0, averageRating - i))}
                  id={`rm-star-${i}`}
                />
              ))}
            </div>
            <span className="font-semibold text-white">
              {averageRating > 0 ? averageRating.toFixed(1) : '—'}
            </span>
            {reviewCount > 0 && <span>{reviewCount} reviews</span>}
          </div>
        </div>

        <div className="mx-6 h-px bg-white/10" />

        <div className="rm-list max-h-[52vh] overflow-y-auto px-6 py-5">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-[22px] border border-dashed border-white/12 bg-white/[0.03] px-6 py-14 text-center">
              <CalendarDays size={28} strokeWidth={1.5} className="text-slate-300" />
              <p className="text-slate-300">No listings posted yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map((listing) => (
                <div
                  key={listing.id}
                  className="rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-4"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--primary)]">
                      {formatDate(listing.date)}
                    </span>
                    {listing.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{listing.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">
                    {listing.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
