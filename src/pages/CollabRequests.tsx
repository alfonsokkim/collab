import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Clock, SendHorizonal, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { fetchListingsByUserId } from '../services/listingService';
import {
  fetchIncomingRequests,
  fetchOutgoingRequests,
  updateRequestStatus,
  rescindRequest,
} from '../services/collabRequestService';
import type { CollabRequest } from '../services/collabRequestService';
import type { Listing } from '../services/listingService';
import { cacheGet } from '../lib/cache';
import { getOrCreateListingRoom } from '../services/chatService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function StatusBadge({ status }: { status: CollabRequest['status'] }) {
  if (status === 'accepted')
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-green-600 dark:text-green-400">
        <Check size={11} strokeWidth={2.5} /> Accepted
      </span>
    );
  if (status === 'rejected')
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-red-500">
        <X size={11} strokeWidth={2.5} /> Declined
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--bg-light)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--text-light)]">
      <Clock size={11} /> Pending
    </span>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

type Tab = 'incoming' | 'outgoing';

export function CollabRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('incoming');

  // Incoming state
  const [listings, setListings] = useState<Listing[]>(() => {
    if (!user) return [];
    const cached = cacheGet<Listing[]>(`listings:user:${user.id}`);
    return cached ? [...cached].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) : [];
  });
  const [incoming, setIncoming] = useState<CollabRequest[]>(() => {
    if (!user) return [];
    return cacheGet<CollabRequest[]>(`collab_requests:${user.id}`) ?? [];
  });
  const [selectedListingId, setSelectedListingId] = useState<string | null>(() => {
    if (!user) return null;
    const cached = cacheGet<Listing[]>(`listings:user:${user.id}`);
    if (!cached?.length) return null;
    return [...cached].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].id;
  });

  // Outgoing state
  const [outgoing, setOutgoing] = useState<CollabRequest[]>([]);

  const [loading, setLoading] = useState(() => {
    if (!user) return false;
    return !cacheGet(`listings:user:${user.id}`) || !cacheGet(`collab_requests:${user.id}`);
  });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [myListings, incomingReqs, outgoingReqs] = await Promise.all([
        fetchListingsByUserId(user.id),
        fetchIncomingRequests(),
        fetchOutgoingRequests(),
      ]);
      const sorted = [...myListings].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
      setListings(sorted);
      setIncoming(incomingReqs);
      setOutgoing(outgoingReqs);
      if (sorted.length > 0) setSelectedListingId(sorted[0].id);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleAction = async (requestId: string, status: 'accepted' | 'rejected') => {
    const ok = await updateRequestStatus(requestId, status);
    if (!ok) return;
    setIncoming((prev) => prev.map((r) => (r.id === requestId ? { ...r, status } : r)));

    if (status === 'accepted') {
      const req = incoming.find((r) => r.id === requestId);
      if (req) {
        // p_new_member_id is the society joining the listing's group room.
        // If a society applied to our listing, they are the new member.
        // If we were invited by a host, we (current user) are the new member — the
        // function also adds auth.uid() automatically, so pass fromUserId as a hint.
        const newMemberId = req.initiatedBy === 'applicant' ? req.fromUserId : req.fromUserId;
        const roomId = await getOrCreateListingRoom(
          req.toListing.id,
          req.toListing.title,
          newMemberId,
        );
        if (roomId) navigate(`/chat?room=${roomId}`);
      }
    }
  };

  const handleRescind = async (requestId: string) => {
    const ok = await rescindRequest(requestId);
    if (!ok) return;
    setOutgoing((prev) => prev.filter((r) => r.id !== requestId));
  };

  // Incoming: applicant requests to MY listings + host invites TO ME
  const incomingApplicant = incoming.filter(
    (r) => r.initiatedBy === 'applicant' && r.toUserId === user?.id,
  );
  const incomingHostInvites = incoming.filter(
    (r) => r.initiatedBy === 'host' && r.toUserId === user?.id,
  );

  const visibleApplicantRequests = incomingApplicant.filter(
    (r) => r.toListing.id === selectedListingId && r.status === 'pending',
  );

  // Outgoing: only host invites I sent (applicant requests are just "applied" — shown elsewhere)
  const outgoingInvites = outgoing.filter((r) => r.initiatedBy === 'host');

  // Count badges
  const pendingIncomingCount =
    incomingApplicant.filter((r) => r.status === 'pending').length +
    incomingHostInvites.filter((r) => r.status === 'pending').length;
  const pendingOutgoingCount = outgoingInvites.filter((r) => r.status === 'pending').length;

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
      {/* Header */}
      <div className="mb-7">
        <h1 className="mb-1.5 text-[var(--text)]">Collab Requests</h1>
        <p className="text-base text-[var(--text-light)]">
          Manage incoming applications and outgoing invites for your events
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-7 flex gap-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-light)] p-1 w-fit">
        {(['incoming', 'outgoing'] as Tab[]).map((t) => {
          const count = t === 'incoming' ? pendingIncomingCount : pendingOutgoingCount;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex items-center gap-2 rounded-[var(--radius-sm)] px-4 py-1.5 text-[13px] font-semibold transition',
                tab === t
                  ? 'bg-[var(--bg)] text-[var(--text)] shadow-[var(--shadow-sm)]'
                  : 'text-[var(--text-mid)] hover:text-[var(--text)]',
              )}
            >
              {t === 'incoming' ? 'Incoming' : 'Outgoing'}
              {count > 0 && (
                <span className="rounded-full bg-[var(--primary)] px-1.5 py-px text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── INCOMING TAB ─────────────────────────────────────────────────── */}
      {tab === 'incoming' && (
        <>
          {/* Section A: Applicants to your listings */}
          <div className="mb-10">
            <h2 className="mb-1 text-[15px] font-bold text-[var(--text)]">Society Applications</h2>
            <p className="mb-5 text-[13px] text-[var(--text-light)]">
              Societies that applied to collaborate on your listings
            </p>

            {listings.length === 0 ? (
              <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] px-6 py-10 text-center">
                <p className="text-[14px] text-[var(--text-light)]">You have no active listings.</p>
                <Link to="/create-listing" className="mt-2 inline-block text-[13px] font-medium text-[var(--primary-dark)] hover:underline underline-offset-2">
                  Create a listing
                </Link>
              </div>
            ) : (
              <div className="grid items-start gap-7 md:grid-cols-[200px_minmax(0,1fr)]">
                {/* Sidebar — listing tabs */}
                <aside className="md:sticky md:top-20">
                  <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-light)]">
                    Your Events
                  </h3>
                  <div className="flex flex-col gap-0.5">
                    {listings.map((listing) => {
                      const count = incomingApplicant.filter(
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

                {/* Request cards */}
                <main>
                  {visibleApplicantRequests.length === 0 ? (
                    <p className="mt-2 text-[var(--text-light)] opacity-60">
                      No pending applications for this listing.
                    </p>
                  ) : (
                    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)]">
                      {visibleApplicantRequests.map((req, i) => (
                        <div
                          key={req.id}
                          className={cn(
                            'flex items-center gap-3.5 px-5 py-4',
                            i !== visibleApplicantRequests.length - 1 &&
                              'border-b border-[var(--border-light)]',
                          )}
                        >
                          <Link to={`/society/${req.fromUserId}`}>
                            <Avatar name={req.fromSociety?.name} logoUrl={req.fromSociety?.logoImageUrl} />
                          </Link>
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <Link
                              to={`/society/${req.fromUserId}`}
                              className="text-sm font-semibold text-[var(--text)] transition hover:text-[var(--primary-dark)] hover:underline underline-offset-2"
                            >
                              {req.fromSociety?.name ?? 'Unknown Society'}
                            </Link>
                            {req.message && (
                              <p className="line-clamp-2 text-[13px] leading-snug text-[var(--text-mid)]">
                                {req.message}
                              </p>
                            )}
                            <span className="text-[11px] text-[var(--text-light)]">{timeAgo(req.createdAt)}</span>
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

          {/* Section B: Host invites TO ME */}
          {incomingHostInvites.length > 0 && (
            <div>
              <h2 className="mb-1 text-[15px] font-bold text-[var(--text)]">Invites to You</h2>
              <p className="mb-5 text-[13px] text-[var(--text-light)]">
                Other societies have invited you to collaborate on their listings
              </p>
              <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)]">
                {incomingHostInvites.map((req, i) => (
                  <div
                    key={req.id}
                    className={cn(
                      'flex items-center gap-3.5 px-5 py-4',
                      i !== incomingHostInvites.length - 1 && 'border-b border-[var(--border-light)]',
                    )}
                  >
                    <Link to={`/society/${req.fromUserId}`}>
                      <Avatar name={req.fromSociety?.name} logoUrl={req.fromSociety?.logoImageUrl} />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/society/${req.fromUserId}`}
                          className="text-sm font-semibold text-[var(--text)] transition hover:text-[var(--primary-dark)] hover:underline underline-offset-2"
                        >
                          {req.fromSociety?.name ?? 'Unknown Society'}
                        </Link>
                        <span className="text-[12px] text-[var(--text-light)]">invited you to</span>
                        <span className="text-[12px] font-semibold text-[var(--text)]">
                          {req.toListing.title}
                        </span>
                      </div>
                      {req.message && (
                        <p className="line-clamp-2 text-[13px] leading-snug text-[var(--text-mid)]">
                          {req.message}
                        </p>
                      )}
                      <div className="flex items-center gap-2.5 pt-0.5">
                        <span className="text-[11px] text-[var(--text-light)]">{timeAgo(req.createdAt)}</span>
                        <StatusBadge status={req.status} />
                      </div>
                    </div>
                    {req.status === 'pending' && (
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
                          aria-label="Decline"
                        >
                          <X size={15} strokeWidth={2.5} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {incomingHostInvites.length === 0 && listings.length > 0 && incomingApplicant.length === 0 && (
            <p className="text-[var(--text-light)] opacity-60">No incoming requests yet.</p>
          )}
        </>
      )}

      {/* ── OUTGOING TAB ─────────────────────────────────────────────────── */}
      {tab === 'outgoing' && (
        <div>
          <h2 className="mb-1 text-[15px] font-bold text-[var(--text)]">Sent Invites</h2>
          <p className="mb-5 text-[13px] text-[var(--text-light)]">
            Societies you've directly invited to collaborate on your listings
          </p>

          {outgoingInvites.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-[var(--bg-light)] py-16 text-center">
              <SendHorizonal size={32} className="text-[var(--text-light)] opacity-40" />
              <p className="text-[15px] font-medium text-[var(--text-light)]">No outgoing invites yet</p>
              <p className="max-w-[280px] text-[13px] text-[var(--text-light)] opacity-70">
                When creating a listing, invite specific societies to collaborate.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)]">
              {outgoingInvites.map((req, i) => (
                <div
                  key={req.id}
                  className={cn(
                    'flex items-center gap-3.5 px-5 py-4',
                    i !== outgoingInvites.length - 1 && 'border-b border-[var(--border-light)]',
                  )}
                >
                  <Link to={`/society/${req.toUserId}`}>
                    <Avatar name={req.toSociety?.name} logoUrl={req.toSociety?.logoImageUrl} />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/society/${req.toUserId}`}
                        className="text-sm font-semibold text-[var(--text)] transition hover:text-[var(--primary-dark)] hover:underline underline-offset-2"
                      >
                        {req.toSociety?.name ?? 'Unknown Society'}
                      </Link>
                      <span className="text-[12px] text-[var(--text-light)]">for</span>
                      <span className="text-[12px] font-semibold text-[var(--text)]">
                        {req.toListing.title}
                      </span>
                    </div>
                    {req.message && (
                      <p className="line-clamp-2 text-[13px] leading-snug text-[var(--text-mid)]">
                        {req.message}
                      </p>
                    )}
                    <div className="flex items-center gap-2.5 pt-0.5">
                      <span className="text-[11px] text-[var(--text-light)]">{timeAgo(req.createdAt)}</span>
                      <StatusBadge status={req.status} />
                    </div>
                  </div>
                  {req.status === 'pending' && (
                    <button
                      onClick={() => handleRescind(req.id)}
                      className="shrink-0 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-light)] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-mid)] transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-500"
                    >
                      Rescind
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
