import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, MessageSquare, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { fetchListingsByUserId } from '../services/listingService';
import { fetchIncomingRequests, updateRequestStatus } from '../services/collabRequestService';
import type { CollabRequest } from '../services/collabRequestService';
import type { Listing } from '../services/listingService';
import { getOrCreateListingRoom } from '../services/chatService';

function Avatar({ name, logoUrl }: { name?: string; logoUrl?: string }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className="h-10 w-10 shrink-0 rounded-full object-cover border border-[var(--border)]"
      />
    );
  }
  const initials = (name || '?')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary-subtle)] text-[13px] font-bold text-[var(--primary-dark)] border border-[rgba(232,160,69,0.2)]">
      {initials}
    </div>
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

export function CollabRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [requests, setRequests] = useState<CollabRequest[]>([]);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [myListings, incoming] = await Promise.all([
        fetchListingsByUserId(user.id),
        fetchIncomingRequests(),
      ]);
      // Sort listings by date ascending (earliest first)
      const sorted = [...myListings].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
      setListings(sorted);
      setRequests(incoming);
      if (sorted.length > 0) setSelectedListingId(sorted[0].id);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleAction = async (requestId: string, status: 'accepted' | 'rejected') => {
    const ok = await updateRequestStatus(requestId, status);
    if (!ok) return;
    setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status } : r)));

    if (status === 'accepted') {
      const req = requests.find((r) => r.id === requestId);
      if (req) {
        const roomId = await getOrCreateListingRoom(
          req.toListing.id,
          req.toListing.title,
          req.fromUserId,
        );
        if (roomId) navigate(`/chat?room=${roomId}`);
      }
    }
  };

  const visibleRequests = requests.filter(
    (r) => r.toListing.id === selectedListingId && r.status === 'pending',
  );

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[var(--text-light)]">
        Please log in to view requests.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[var(--text-light)]">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 md:px-7">
      <div className="mb-7">
        <h1 className="mb-1.5 text-[var(--text)]">Collab Requests</h1>
        <p className="text-base text-[var(--text-light)]">
          Societies interested in collaborating on your events
        </p>
      </div>

      {listings.length === 0 ? (
        <p className="text-[var(--text-light)]">You have no active listings.</p>
      ) : (
        <div className="grid items-start gap-7 md:grid-cols-[200px_minmax(0,1fr)]">
          {/* Sidebar — event tabs */}
          <aside className="md:sticky md:top-20">
            <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-light)]">
              Your Events
            </h3>
            <div className="flex flex-col gap-0.5">
              {listings.map((listing) => {
                const count = requests.filter(
                  (r) => r.toListing.id === listing.id && r.status === 'pending',
                ).length;
                return (
                  <button
                    key={listing.id}
                    onClick={() => setSelectedListingId(listing.id)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] border px-3 py-[7px] text-left text-[13px] font-medium transition',
                      selectedListingId === listing.id
                        ? 'border-[rgba(232,160,69,0.25)] bg-[var(--primary-subtle)] font-semibold text-[var(--primary-dark)]'
                        : 'border-transparent bg-transparent text-[var(--text-mid)] hover:border-[var(--border)] hover:bg-[var(--bg-light)] hover:text-[var(--text)]',
                    )}
                  >
                    <span className="line-clamp-2 leading-snug">{listing.title}</span>
                    {count > 0 && (
                      <span className="shrink-0 rounded-full bg-[var(--primary)] px-1.5 py-px text-[10px] font-bold text-white">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Requests list */}
          <main>
            {visibleRequests.length === 0 ? (
              <p className="mt-2 text-base text-[var(--text-light)/60] text-[var(--text-light)] opacity-60">
                You have no requests :(
              </p>
            ) : (
              <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)] overflow-hidden">
                {visibleRequests.map((req, i) => (
                  <div
                    key={req.id}
                    className={cn(
                      'flex items-center gap-3.5 px-5 py-4',
                      i !== visibleRequests.length - 1 && 'border-b border-[var(--border-light)]',
                    )}
                  >
                    <Link to={`/society/${req.fromUserId}`}>
                      <Avatar
                        name={req.fromSociety?.name}
                        logoUrl={req.fromSociety?.logoImageUrl}
                      />
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <Link
                        to={`/society/${req.fromUserId}`}
                        className="text-sm font-semibold text-[var(--text)] transition hover:text-[var(--primary-dark)] hover:underline underline-offset-2"
                      >
                        {req.fromSociety?.name ?? 'Unknown Society'}
                      </Link>
                      {req.message && (
                        <p className="text-[13px] text-[var(--text-mid)] line-clamp-2 leading-snug">
                          {req.message}
                        </p>
                      )}
                      <span className="text-[11px] text-[var(--text-light)]">
                        {timeAgo(req.createdAt)}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => handleAction(req.id, 'accepted')}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-green-500/30 bg-green-500/10 text-green-600 transition hover:bg-green-500/20 dark:text-green-400"
                        aria-label="Accept"
                      >
                        <Check size={15} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => handleAction(req.id, 'rejected')}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-500 transition hover:bg-red-500/20"
                        aria-label="Reject"
                      >
                        <X size={15} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
