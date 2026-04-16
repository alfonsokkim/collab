import { X, PenLine, CalendarDays } from 'lucide-react';
import type { Listing } from '../services/listingService';
import '../styles/RatingsModal.css';

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
    <svg width="15" height="15" viewBox="0 0 24 24" className="star-svg" aria-hidden="true">
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
  const sorted = [...listings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div className="rm-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="rm-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="rm-header">
          <button className="rm-write-btn">
            <PenLine size={14} strokeWidth={2.5} />
            Write a review
          </button>
          <button className="rm-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Society summary */}
        <div className="rm-summary">
          <h2 className="rm-society-name">{societyName}</h2>
          <div className="rm-rating-row">
            {[0, 1, 2, 3, 4].map((i) => (
              <StarIcon
                key={i}
                fill={Math.min(1, Math.max(0, averageRating - i))}
                id={`rm-star-${i}`}
              />
            ))}
            <span className="rm-rating-value">
              {averageRating > 0 ? averageRating.toFixed(1) : '—'}
            </span>
            {reviewCount > 0 && (
              <span className="rm-review-count">{reviewCount} reviews</span>
            )}
          </div>
        </div>

        <div className="rm-divider" />

        {/* Listings list */}
        <div className="rm-list">
          {sorted.length === 0 ? (
            <div className="rm-empty">
              <CalendarDays size={28} strokeWidth={1.5} />
              <p>No listings posted yet</p>
            </div>
          ) : (
            sorted.map((listing) => (
              <div key={listing.id} className="rm-item">
                <div className="rm-item-meta">
                  <span className="rm-item-date">{formatDate(listing.date)}</span>
                  {listing.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="rm-item-tag">{tag}</span>
                  ))}
                </div>
                <h3 className="rm-item-title">{listing.title}</h3>
                <p className="rm-item-desc">{listing.description}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
