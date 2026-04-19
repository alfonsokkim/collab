import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CalendarDays,
  Clock3,
  Edit2,
  Pencil,
  Plus,
  Save,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AcademicTimeline } from '../components/AcademicTimeline';
import { RatingsModal } from '../components/RatingsModal';
import facebookIcon from '../assets/facebook-icon.svg';
import discordIcon from '../assets/discord-icon.svg';
import instagramIcon from '../assets/instagram-icon.svg';
import linkedinIcon from '../assets/linkedin-icon.svg';
import emailIcon from '../assets/email-icon.png';
import { cn } from '../lib/utils';
import { fetchListingsByUserId, type Listing } from '../services/listingService';
import {
  getSocietyProfile,
  saveSocietyProfile,
  SOCIETY_TYPES,
  type SocietyProfile,
} from '../services/societyService';

type ProfileTab = 'upcoming' | 'history';

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function toEventDate(date: string) {
  return new Date(`${date}T00:00:00`);
}

function formatEventDate(date: string) {
  return toEventDate(date).toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function normalizeInstagram(handle?: string) {
  if (!handle) return '';
  if (handle.startsWith('http://') || handle.startsWith('https://')) return handle;
  return `https://instagram.com/${handle.replace(/^@+/, '').trim()}`;
}

function normalizeFacebook(handle?: string) {
  if (!handle) return '';
  if (handle.startsWith('http://') || handle.startsWith('https://')) return handle;
  return `https://facebook.com/${handle.replace(/^@+/, '').trim()}`;
}

function normalizeLinkedin(value?: string) {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `https://linkedin.com/in/${value.replace(/^\/+/, '').trim()}`;
}

function StarIcon({ fill, id }: { fill: number; id: string }) {
  const pct = `${(fill * 100).toFixed(1)}%`;
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
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

function StarRating({ value, prefix }: { value: number; prefix: string }) {
  return (
    <div className="mt-4 flex items-center justify-center gap-1.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <StarIcon key={i} fill={Math.min(1, Math.max(0, value - i))} id={`${prefix}-${i}`} />
      ))}
      <span className="ml-1 text-sm font-semibold text-[var(--text)]">
        {value > 0 ? value.toFixed(1) : 'No ratings yet'}
      </span>
    </div>
  );
}

function EventCard({
  listing,
  onClick,
}: {
  listing: Listing;
  onClick: (listingId: string) => void;
}) {
  return (
    <article
      className="cursor-pointer overflow-hidden rounded-[22px] border border-[var(--border)] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] transition hover:-translate-y-[3px] hover:border-[rgba(232,160,69,0.35)] hover:shadow-[0_16px_34px_rgba(15,23,42,0.08)]"
      onClick={() => onClick(listing.id)}
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
        <div className="mb-2.5 flex flex-col gap-1.5">
          <h3 className="text-base font-bold leading-tight text-[var(--text)]">{listing.title}</h3>
          <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--primary-dark)]">
            {formatEventDate(listing.date)}
          </span>
        </div>

        <p className="text-sm leading-[1.55] text-[var(--text-mid)]">{listing.description}</p>

        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-light)]">
            <Users size={14} strokeWidth={2} />
            {listing.peopleNeeded} spot{listing.peopleNeeded === 1 ? '' : 's'} requested
          </span>

          {listing.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {listing.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[var(--border)] bg-slate-50 px-[9px] py-[5px] text-[10px] font-bold uppercase tracking-[0.04em] text-[var(--text-mid)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>('upcoming');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [eventDates, setEventDates] = useState<Date[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [showRatings, setShowRatings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [society, setSociety] = useState<SocietyProfile>({
    name: '',
    description: '',
    membersCount: 0,
    foundedYear: new Date().getFullYear(),
    instagram: '',
    discordUrl: '',
    facebook: '',
    linkedin: '',
  });

  const [editForm, setEditForm] = useState<SocietyProfile>({
    name: '',
    description: '',
    membersCount: 0,
    foundedYear: new Date().getFullYear(),
    instagram: '',
    discordUrl: '',
    facebook: '',
    linkedin: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const profile = await getSocietyProfile(user.id);
        const userListings = await fetchListingsByUserId(user.id);

        if (profile) {
          setSociety(profile);
          setEditForm(profile);
          setLogoImage(profile.logoImageUrl || null);
        } else {
          const defaultName = user.user_metadata?.society_name || '';
          setSociety((current) => ({ ...current, name: defaultName }));
          setEditForm((current) => ({ ...current, name: defaultName }));
        }

        setListings(userListings);
        setEventDates(userListings.map((listing) => toEventDate(listing.date)));
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const offsetX = (img.width - size) / 2;
        const offsetY = (img.height - size) / 2;
        ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        setLogoImage(base64);
        setEditForm({ ...editForm, logoImageUrl: base64 });
        setError('');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user) return;

    if (!editForm.name?.trim()) {
      setError('Society name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const updated = await saveSocietyProfile(user.id, editForm);
      if (updated) {
        setSociety(updated);
        setEditForm(updated);
        setLogoImage(updated.logoImageUrl || null);
        setIsEditing(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-10 md:px-7">
        <div className="flex min-h-[400px] items-center justify-center text-[15px] text-[var(--text-light)]">
          Loading profile...
        </div>
      </div>
    );
  }

  const displaySociety = isEditing ? editForm : society;
  const today = startOfToday();
  const upcomingListings = listings
    .filter((l) => toEventDate(l.date) >= today)
    .sort((a, b) => toEventDate(a.date).getTime() - toEventDate(b.date).getTime());
  const pastListings = listings
    .filter((l) => toEventDate(l.date) < today)
    .sort((a, b) => toEventDate(b.date).getTime() - toEventDate(a.date).getTime());

  const socialLinks = [
    { key: 'email', icon: emailIcon, href: user?.email ? `mailto:${user.email}` : '', label: 'Email' },
    { key: 'instagram', icon: instagramIcon, href: normalizeInstagram(displaySociety.instagram), label: 'Instagram' },
    { key: 'discord', icon: discordIcon, href: displaySociety.discordUrl || '', label: 'Discord' },
    { key: 'facebook', icon: facebookIcon, href: normalizeFacebook(displaySociety.facebook), label: 'Facebook' },
    { key: 'linkedin', icon: linkedinIcon, href: normalizeLinkedin(displaySociety.linkedin), label: 'LinkedIn' },
  ].filter((link) => link.href);

  const visibleListings = activeTab === 'upcoming' ? upcomingListings : pastListings;
  const averageRating = 0;
  const reviewCount = 0;

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-6 md:px-7">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <section className="mb-7">
        <div className="w-full rounded-[28px] border border-[var(--border)] bg-[var(--bg)] p-4 text-[var(--text)] shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:p-1">
          <AcademicTimeline
            eventDates={eventDates}
            events={listings.map((listing) => ({
              id: listing.id,
              title: listing.title,
              date: listing.date,
            }))}
          />
        </div>
      </section>

      {error && (
        <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-red-700">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-[88px]">
          <section className="rounded-[28px] border border-[var(--border)] bg-[var(--bg)] p-[28px_24px] shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <div
              className={cn('relative mx-auto mb-[22px] w-fit', isEditing && 'cursor-pointer')}
              onClick={() => isEditing && fileInputRef.current?.click()}
              role={isEditing ? 'button' : undefined}
              tabIndex={isEditing ? 0 : -1}
              onKeyDown={(e) => {
                if (isEditing && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              {logoImage || society.logoImageUrl ? (
                <div className="h-[132px] w-[132px] overflow-hidden rounded-[28px] border border-[var(--border)]">
                  <img src={logoImage || society.logoImageUrl} alt="Society logo" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-[132px] w-[132px] items-center justify-center rounded-[28px] bg-[linear-gradient(145deg,#172033_0%,#101827_100%)] text-white/60">
                  <Users size={56} strokeWidth={1.5} />
                </div>
              )}

              {isEditing && (
                <div className="absolute inset-0 flex items-center justify-center rounded-[28px] bg-[rgba(15,23,42,0.45)] text-white opacity-0 transition hover:opacity-100">
                  <Pencil size={22} />
                </div>
              )}
            </div>

            <div className="text-center">
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Society Name"
                    className="mb-3.5 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-center text-2xl font-bold text-[var(--text)] outline-none focus:border-[rgba(232,160,69,0.6)] focus:shadow-[0_0_0_4px_rgba(232,160,69,0.14)]"
                  />
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Tell people what your society is about..."
                    rows={5}
                    className="min-h-[140px] w-full resize-y rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-[15px] leading-[1.65] text-[var(--text)] outline-none focus:border-[rgba(232,160,69,0.6)] focus:shadow-[0_0_0_4px_rgba(232,160,69,0.14)]"
                  />
                </>
              ) : (
                <>
                  <h1 className="break-words text-[34px] leading-[1.05] text-[var(--text)]">
                    {displaySociety.name || 'My Society'}
                  </h1>
                  <p className="mt-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--primary-dark)]">
                    {displaySociety.societyType || 'Society type not set'}
                  </p>
                  <p className="mt-[18px] text-[15px] leading-[1.75] text-[var(--text-mid)]">
                    {displaySociety.description ||
                      'Add a short society description so people know what you are about.'}
                  </p>
                </>
              )}

              {!isEditing && socialLinks.length > 0 && (
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

              {!isEditing && (
                <>
                  <div className="mt-6 inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-slate-50 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.06em] text-[var(--text-light)]">
                    Founded in {displaySociety.foundedYear || new Date().getFullYear()}
                  </div>
                  <StarRating value={averageRating} prefix="sidebar" />
                  <button
                    className="mt-3 bg-transparent p-0 text-sm font-semibold text-[var(--primary-dark)] hover:text-[var(--primary)]"
                    onClick={() => setShowRatings(true)}
                  >
                    View all ratings
                  </button>
                </>
              )}
            </div>

            <div className="mt-[26px] flex flex-col gap-2.5">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--primary)_0%,#d18a27_100%)] px-[18px] py-[14px] text-sm font-bold text-white transition hover:-translate-y-px hover:shadow-[0_14px_28px_rgba(15,23,42,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                  <button
                    onClick={() => {
                      setEditForm(society);
                      setLogoImage(society.logoImageUrl || null);
                      setError('');
                      setIsEditing(false);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-white px-[18px] py-[13px] text-sm font-bold text-[var(--text-mid)] transition hover:border-[var(--text-light)] hover:text-[var(--text)]"
                  >
                    <X size={18} />
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--dark)] px-[18px] py-[14px] text-sm font-bold text-white transition hover:-translate-y-px hover:shadow-[0_14px_28px_rgba(15,23,42,0.18)]"
                >
                  <Edit2 size={18} />
                  Edit Profile
                </button>
              )}
            </div>
          </section>
        </aside>

        <main className="min-w-0">
          {isEditing ? (
            <section className="rounded-[28px] border border-[var(--border)] bg-[var(--bg)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
              <div className="mb-[22px]">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/58 sm:text-[var(--text-light)]">
                  Profile Settings
                </span>
                <h2 className="mt-2 text-[30px] leading-[1.1] text-[var(--text)]">
                  Update your society details
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-[0.06em] text-[var(--text-light)]">
                    Members
                  </label>
                  <input
                    type="number"
                    value={editForm.membersCount || 0}
                    onChange={(e) => setEditForm({ ...editForm, membersCount: parseInt(e.target.value || '0', 10) })}
                    min="0"
                    className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none focus:border-[rgba(232,160,69,0.6)] focus:shadow-[0_0_0_4px_rgba(232,160,69,0.14)]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-[0.06em] text-[var(--text-light)]">
                    Founded Year
                  </label>
                  <input
                    type="number"
                    value={editForm.foundedYear || new Date().getFullYear()}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        foundedYear: parseInt(e.target.value || `${new Date().getFullYear()}`, 10),
                      })
                    }
                    min="2000"
                    max={new Date().getFullYear()}
                    className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none focus:border-[rgba(232,160,69,0.6)] focus:shadow-[0_0_0_4px_rgba(232,160,69,0.14)]"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-[0.06em] text-[var(--text-light)]">
                  Society Type
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {SOCIETY_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={cn(
                        'rounded-full border px-3.5 py-2.5 text-[13px] font-semibold transition',
                        editForm.societyType === type
                          ? 'border-[rgba(232,160,69,0.35)] bg-[#fdf1e2] text-[#9a5f14]'
                          : 'border-[var(--border)] bg-white text-[var(--text-mid)] hover:border-[rgba(232,160,69,0.34)] hover:text-[var(--text)]',
                      )}
                      onClick={() => setEditForm({ ...editForm, societyType: type })}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="my-[26px] h-px bg-[var(--border)]" />

              <div className="mb-[22px]">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-light)]">
                  Social Links
                </span>
                <h2 className="mt-2 text-2xl leading-[1.1] text-[var(--text)]">
                  Choose where people can find you
                </h2>
              </div>

              <div className="mb-4 flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-[0.06em] text-[var(--text-light)]">
                  Email Address
                </label>
                <input
                  type="text"
                  value={user?.email || ''}
                  readOnly
                  disabled
                  className="rounded-2xl border border-[var(--border)] bg-slate-50 px-4 py-3 text-[var(--text-light)] outline-none cursor-not-allowed select-none"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ['Instagram Handle', 'instagram', '@yourhandle'],
                  ['Discord Server URL', 'discordUrl', 'https://discord.gg/...'],
                  ['Facebook Page', 'facebook', '@yourpage'],
                  ['LinkedIn Page', 'linkedin', 'https://linkedin.com/...'],
                ].map(([label, key, placeholder]) => (
                  <div key={key} className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-[0.06em] text-[var(--text-light)]">
                      {label}
                    </label>
                    <input
                      type="text"
                      value={(editForm as any)[key] || ''}
                      onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                      placeholder={placeholder}
                      className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none focus:border-[rgba(232,160,69,0.6)] focus:shadow-[0_0_0_4px_rgba(232,160,69,0.14)]"
                    />
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <>
              <div className="mb-[18px] flex flex-wrap gap-3" role="tablist">
                <button
                  type="button"
                  className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-2xl border px-[18px] py-[13px] text-sm font-bold transition',
                    activeTab === 'upcoming'
                      ? 'border-[rgba(232,160,69,0.35)] bg-[#fdf1e2] text-[#9a5f14]'
                      : 'border-[var(--border)] bg-white text-[var(--text-mid)] hover:border-[rgba(232,160,69,0.34)] hover:text-[var(--text)]',
                  )}
                  onClick={() => setActiveTab('upcoming')}
                >
                  View My Listings
                </button>
                <button
                  type="button"
                  className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-2xl border px-[18px] py-[13px] text-sm font-bold transition',
                    activeTab === 'history'
                      ? 'border-[rgba(232,160,69,0.35)] bg-[#fdf1e2] text-[#9a5f14]'
                      : 'border-[var(--border)] bg-white text-[var(--text-mid)] hover:border-[rgba(232,160,69,0.34)] hover:text-[var(--text)]',
                  )}
                  onClick={() => setActiveTab('history')}
                >
                  History
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent bg-[var(--dark)] px-[18px] py-[13px] text-sm font-bold text-white transition hover:bg-[#222f49]"
                  onClick={() => navigate('/create-listing')}
                >
                  <Plus size={16} />
                  Create New Listing
                </button>
              </div>

              <section className="rounded-[28px] border border-[var(--border)] bg-[var(--bg)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                <div className="mb-[22px]">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-light)]">
                    {activeTab === 'upcoming' ? 'Upcoming Events' : 'Past Events'}
                  </span>
                  <h2 className="mt-2 max-w-[18ch] text-[30px] leading-[1.1] text-[var(--text)]">
                    {activeTab === 'upcoming'
                      ? 'Everything your society still has coming up'
                      : 'A record of events your society has already run'}
                  </h2>
                </div>

                {visibleListings.length > 0 ? (
                  <div className="grid gap-[14px] sm:grid-cols-2 xl:grid-cols-3">
                    {visibleListings.map((listing) => (
                      <EventCard key={listing.id} listing={listing} onClick={(id) => navigate(`/listings/${id}`)} />
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border)] px-8 py-10 text-center text-[var(--text-light)]">
                    <Clock3 size={28} strokeWidth={1.6} className="mb-3.5 text-[var(--primary-dark)]" />
                    <h3 className="text-[var(--text)]">
                      {activeTab === 'upcoming' ? 'No upcoming listings yet' : 'No past events yet'}
                    </h3>
                    <p className="mt-2.5 max-w-[40ch] leading-[1.7] text-[var(--text-light)]">
                      {activeTab === 'upcoming'
                        ? 'Create a new listing and it will appear here as an upcoming event card.'
                        : 'Once event dates have passed, they will move into your history tab automatically.'}
                    </p>
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>

      {showRatings && (
        <RatingsModal
          listings={listings}
          societyName={society.name || 'My Society'}
          averageRating={averageRating}
          reviewCount={reviewCount}
          onClose={() => setShowRatings(false)}
        />
      )}
    </div>
  );
}
