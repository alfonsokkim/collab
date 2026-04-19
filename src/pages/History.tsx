import { useEffect, useState } from 'react';
import { CalendarDays, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { fetchListingsByUserId, type Listing } from '../services/listingService';
import { fetchIncomingRequests, updateRequestStatus, type CollabRequest } from '../services/collabRequestService';
import facebookIcon from '../assets/facebook-icon.svg';
import discordIcon from '../assets/discord-icon.svg';
import instagramIcon from '../assets/instagram-icon.svg';
import linkedinIcon from '../assets/linkedin-icon.svg';
import emailIcon from '../assets/email-icon.png';

type Tab = 'active' | 'history';

function toEventDate(date: string) {
  return new Date(`${date}T00:00:00`);
}

function formatDate(date: string) {
  return toEventDate(date).toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function normalizeInstagram(h?: string) {
  if (!h) return '';
  if (h.startsWith('http')) return h;
  return `https://instagram.com/${h.replace(/^@+/, '').trim()}`;
}
function normalizeFacebook(h?: string) {
  if (!h) return '';
  if (h.startsWith('http')) return h;
  return `https://facebook.com/${h.replace(/^@+/, '').trim()}`;
}
function normalizeLinkedin(h?: string) {
  if (!h) return '';
  if (h.startsWith('http')) return h;
  return `https://linkedin.com/in/${h.replace(/^\/+/, '').trim()}`;
}

function SocietyAvatar({ name, logoUrl }: { name?: string; logoUrl?: string }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className="h-9 w-9 shrink-0 rounded-full object-cover border border-[var(--border)]"
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
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary-subtle)] text-[12px] font-bold text-[var(--primary-dark)]">
      {initials}
    </div>
  );
}

function ContactBubble({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-light)] transition hover:-translate-y-px hover:border-[rgba(232,160,69,0.4)] hover:shadow-sm"
    >
      <img src={icon} alt={label} className="h-3.5 w-3.5" />
    </a>
  );
}

function ConfirmRemoveModal({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/40 px-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[360px] rounded-[22px] border border-[var(--border)] bg-[var(--bg)] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[17px] font-bold text-[var(--text)]">Remove collaborator?</h3>
        <p className="mt-2 text-sm leading-[1.6] text-[var(--text-mid)]">
          Are you sure you want to remove <span className="font-semibold text-[var(--text)]">{name}</span> from this event?
        </p>
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm font-semibold text-[var(--text-mid)] transition hover:border-[var(--border-mid)] hover:text-[var(--text)]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 hover:border-red-300"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function CollaboratorRow({ collab, onRemove }: { collab: CollabRequest; onRemove: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false);
  const s = collab.fromSociety;
  const contacts: { href: string; icon: string; label: string }[] = [];
  if (collab.fromUserEmail) contacts.push({ href: `mailto:${collab.fromUserEmail}`, icon: emailIcon, label: 'Email' });
  if (s?.instagram) contacts.push({ href: normalizeInstagram(s.instagram), icon: instagramIcon, label: 'Instagram' });
  if (s?.discordUrl) contacts.push({ href: s.discordUrl, icon: discordIcon, label: 'Discord' });
  if (s?.facebook) contacts.push({ href: normalizeFacebook(s.facebook), icon: facebookIcon, label: 'Facebook' });
  if (s?.linkedin) contacts.push({ href: normalizeLinkedin(s.linkedin), icon: linkedinIcon, label: 'LinkedIn' });

  return (
    <div className="flex items-center gap-3 py-2.5">
      <Link to={`/society/${collab.fromUserId}`} className="shrink-0" onClick={(e) => e.stopPropagation()}>
        <SocietyAvatar name={s?.name} logoUrl={s?.logoImageUrl} />
      </Link>
      <Link
        to={`/society/${collab.fromUserId}`}
        className="min-w-0 flex-1 text-sm font-semibold text-[var(--text)] truncate transition hover:text-[var(--primary-dark)] hover:underline underline-offset-2"
        onClick={(e) => e.stopPropagation()}
      >
        {s?.name ?? 'Unknown Society'}
      </Link>
      <div className="flex shrink-0 items-center gap-2">
        {contacts.map((c) => (
          <ContactBubble key={c.label} {...c} />
        ))}
        {contacts.length === 0 && (
          <span className="text-xs text-[var(--text-light)]">No socials listed</span>
        )}
        <button
          onClick={() => setConfirming(true)}
          className="ml-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-500 transition hover:bg-red-100 hover:border-red-300"
        >
          Remove
        </button>
      </div>
      {confirming && (
        <ConfirmRemoveModal
          name={collab.fromSociety?.name ?? 'this society'}
          onConfirm={() => { setConfirming(false); onRemove(collab.id); }}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}

function ListingCard({
  listing,
  collabs,
  isFirst,
  onRemoveCollab,
}: {
  listing: Listing;
  collabs: CollabRequest[];
  isFirst: boolean;
  onRemoveCollab: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border bg-[var(--bg)] p-5 transition',
        isFirst
          ? 'border-[rgba(232,160,69,0.4)] shadow-[0_4px_20px_rgba(232,160,69,0.1)]'
          : 'border-[var(--border)] hover:border-[rgba(232,160,69,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]',
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="aspect-square w-[72px] shrink-0 overflow-hidden rounded-[var(--radius)]">
          {listing.bannerImageUrl ? (
            <img src={listing.bannerImageUrl} alt={listing.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[var(--primary-subtle)]">
              <CalendarDays size={24} strokeWidth={1.5} className="text-[var(--primary-dark)]" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              {isFirst && (
                <span className="mb-1 inline-block rounded-full bg-[var(--primary)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-white">
                  Up Next
                </span>
              )}
              <h3 className="text-[16px] font-bold text-[var(--text)] leading-snug">{listing.title}</h3>
            </div>
            <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--primary-dark)]">
              {formatDate(listing.date)}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-[13px] leading-[1.6] text-[var(--text-mid)]">
            {listing.description}
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-[var(--text-light)]">
            <Users size={12} strokeWidth={2} />
            <span>{listing.peopleNeeded} spots requested</span>
          </div>
        </div>
      </div>

      {/* Collaborators */}
      <div className="mt-4 border-t border-[var(--border-light)] pt-4">
        <h4 className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-light)]">
          Collaborating Societies
        </h4>
        {collabs.length === 0 ? (
          <p className="py-2 text-sm text-[var(--text-light)] opacity-60">
            No accepted collaborators yet
          </p>
        ) : (
          <div className="divide-y divide-[var(--border-light)]">
            {collabs.map((c) => (
              <CollaboratorRow key={c.id} collab={c} onRemove={onRemoveCollab} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


export function History() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('active');
  const [listings, setListings] = useState<Listing[]>([]);
  const [requests, setRequests] = useState<CollabRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [myListings, incoming] = await Promise.all([
        fetchListingsByUserId(user.id),
        fetchIncomingRequests(),
      ]);
      setListings(myListings);
      setRequests(incoming.filter((r) => r.status === 'accepted'));
      setLoading(false);
    };
    load();
  }, [user]);

  const today = startOfToday();
  const activeListings = listings
    .filter((l) => toEventDate(l.date) >= today)
    .sort((a, b) => toEventDate(a.date).getTime() - toEventDate(b.date).getTime());
  const pastListings = listings
    .filter((l) => toEventDate(l.date) < today)
    .sort((a, b) => toEventDate(b.date).getTime() - toEventDate(a.date).getTime());

  const collabsFor = (listingId: string) =>
    requests.filter((r) => r.toListing.id === listingId);

  const handleRemoveCollab = async (requestId: string) => {
    const ok = await updateRequestStatus(requestId, 'rejected');
    if (ok) setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const tabClass = (t: Tab) =>
    cn(
      'inline-flex items-center justify-center rounded-2xl border px-[18px] py-[13px] text-sm font-bold transition',
      tab === t
        ? 'border-[rgba(232,160,69,0.35)] bg-[#fdf1e2] text-[#9a5f14]'
        : 'border-[var(--border)] bg-[var(--bg)] text-[var(--text-mid)] hover:border-[rgba(232,160,69,0.34)] hover:text-[var(--text)]',
    );

  return (
    <div className="mx-auto max-w-[900px] px-5 py-7 md:px-7 md:py-10">
      <div className="mb-7">
        <h1 className="mb-2 text-[var(--text)]">My Listings</h1>
        <p className="text-base text-[var(--text-light)]">
          Your active events and collaboration history
        </p>
      </div>

      <div className="mb-7 flex gap-3">
        <button className={tabClass('active')} onClick={() => setTab('active')}>
          Active
        </button>
        <button className={tabClass('history')} onClick={() => setTab('history')}>
          History
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center text-[var(--text-light)]">
          Loading...
        </div>
      ) : tab === 'active' ? (
        activeListings.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] text-center text-[var(--text-light)]">
            <CalendarDays size={28} strokeWidth={1.5} className="mb-3 text-[var(--primary-dark)]" />
            <p className="text-base font-medium text-[var(--text)]">No active listings</p>
            <p className="mt-1.5 text-sm">Create a listing to start collaborating</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {activeListings.map((listing, i) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                collabs={collabsFor(listing.id)}
                isFirst={i === 0}
                onRemoveCollab={handleRemoveCollab}
              />
            ))}
          </div>
        )
      ) : (
        pastListings.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] text-center text-[var(--text-light)]">
            <CalendarDays size={28} strokeWidth={1.5} className="mb-3 text-[var(--primary-dark)]" />
            <p className="text-base font-medium text-[var(--text)]">No past events yet</p>
            <p className="mt-1.5 text-sm">Completed events will appear here</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {pastListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                collabs={collabsFor(listing.id)}
                isFirst={false}
                onRemoveCollab={handleRemoveCollab}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
