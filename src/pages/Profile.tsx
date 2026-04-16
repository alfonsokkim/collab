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
import { getSocietyProfile, saveSocietyProfile, SOCIETY_TYPES, type SocietyProfile } from '../services/societyService';
import { fetchListingsByUserId, type Listing } from '../services/listingService';
import { AcademicTimeline } from '../components/AcademicTimeline';
import { RatingsModal } from '../components/RatingsModal';
import instagramIcon from '../assets/instagram-icon.svg';
import discordIcon from '../assets/discord-icon.svg';
import facebookIcon from '../assets/facebook-icon.svg';
import linkedinIcon from '../assets/linkedin-icon.svg';
import '../styles/Profile.css';

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

// ── Star rating ──────────────────────────────────────────────────────────────

function StarIcon({ fill, id }: { fill: number; id: string }) {
  const pct = `${(fill * 100).toFixed(1)}%`;
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className="star-svg" aria-hidden="true">
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
    <div className="profile-star-row">
      {[0, 1, 2, 3, 4].map((i) => (
        <StarIcon
          key={i}
          fill={Math.min(1, Math.max(0, value - i))}
          id={`${prefix}-${i}`}
        />
      ))}
      <span className="profile-star-value">
        {value > 0 ? value.toFixed(1) : 'No ratings yet'}
      </span>
    </div>
  );
}

// ── Event card ───────────────────────────────────────────────────────────────

function EventCard({
  listing,
  onClick,
}: {
  listing: Listing;
  onClick: (listingId: string) => void;
}) {
  return (
    <article className="profile-event-card" onClick={() => onClick(listing.id)}>
      <div className="profile-event-card-media">
        {listing.bannerImageUrl ? (
          <img src={listing.bannerImageUrl} alt={listing.title} />
        ) : (
          <div className="profile-event-card-placeholder">
            <CalendarDays size={28} strokeWidth={1.5} />
          </div>
        )}
      </div>

      <div className="profile-event-card-content">
        <div className="profile-event-card-header">
          <h3>{listing.title}</h3>
          <span className="profile-event-card-date">{formatEventDate(listing.date)}</span>
        </div>

        <p>{listing.description}</p>

        <div className="profile-event-card-footer">
          <span className="profile-event-meta">
            <Users size={14} strokeWidth={2} />
            {listing.peopleNeeded} spot{listing.peopleNeeded === 1 ? '' : 's'} requested
          </span>

          {listing.tags.length > 0 && (
            <div className="profile-event-tags">
              {listing.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="profile-event-tag">
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

// ── Main component ───────────────────────────────────────────────────────────

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
      <div className="profile-page">
        <div className="profile-loading">Loading profile...</div>
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
    { key: 'instagram', icon: instagramIcon, href: normalizeInstagram(displaySociety.instagram), label: 'Instagram' },
    { key: 'discord',   icon: discordIcon,   href: displaySociety.discordUrl || '',               label: 'Discord'   },
    { key: 'facebook',  icon: facebookIcon,  href: normalizeFacebook(displaySociety.facebook),    label: 'Facebook'  },
    { key: 'linkedin',  icon: linkedinIcon,  href: normalizeLinkedin(displaySociety.linkedin),    label: 'LinkedIn'  },
  ].filter((link) => link.href);

  const visibleListings = activeTab === 'upcoming' ? upcomingListings : pastListings;

  // Placeholder — wire to real DB rating when ratings table exists
  const averageRating = 0;
  const reviewCount = 0;

  return (
    <div className="profile-page">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />

      {/* ── Full-bleed dark hero ── */}
      <section className="profile-hero">
        <div className="profile-hero-inner">
          <div className="profile-timeline-frame">
            <AcademicTimeline eventDates={eventDates} />
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <div className="profile-body">
        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="profile-layout">
          {/* ── Sidebar ── */}
          <aside className="profile-sidebar">
            <section className="profile-society-card">
              <div
                className={`profile-avatar-wrapper ${isEditing ? 'is-editing' : ''}`}
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
                  <div className="profile-avatar-image">
                    <img src={logoImage || society.logoImageUrl} alt="Society logo" />
                  </div>
                ) : (
                  <div className="profile-avatar">
                    <Users size={56} strokeWidth={1.5} />
                  </div>
                )}
                {isEditing && (
                  <div className="profile-avatar-overlay">
                    <Pencil size={22} />
                  </div>
                )}
              </div>

              <div className="profile-society-card-body">
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Society Name"
                      className="profile-name-input"
                    />
                    <textarea
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Tell people what your society is about..."
                      className="profile-description-input"
                      rows={5}
                    />
                  </>
                ) : (
                  <>
                    <h1>{displaySociety.name || 'My Society'}</h1>
                    <p className="profile-society-type">
                      {displaySociety.societyType || 'Society type not set'}
                    </p>
                    <p className="profile-description">
                      {displaySociety.description ||
                        'Add a short society description so people know what you are about.'}
                    </p>
                  </>
                )}

                {!isEditing && socialLinks.length > 0 && (
                  <div className="profile-social-row">
                    {socialLinks.map((link) => (
                      <a
                        key={link.key}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="profile-social-link"
                        aria-label={link.label}
                      >
                        <img src={link.icon} alt={link.label} />
                      </a>
                    ))}
                  </div>
                )}

                {!isEditing && (
                  <>
                    <div className="profile-founded-tag">
                      Founded in {displaySociety.foundedYear || new Date().getFullYear()}
                    </div>

                    <StarRating value={averageRating} prefix="sidebar" />

                    <button
                      className="profile-view-ratings-link"
                      onClick={() => setShowRatings(true)}
                    >
                      View all ratings
                    </button>
                  </>
                )}
              </div>

              <div className="profile-card-actions">
                {isEditing ? (
                  <>
                    <button onClick={handleSave} disabled={saving} className="save-btn">
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
                      className="cancel-btn"
                    >
                      <X size={18} />
                      Cancel
                    </button>
                  </>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="edit-btn">
                    <Edit2 size={18} />
                    Edit Profile
                  </button>
                )}
              </div>
            </section>
          </aside>

          {/* ── Main ── */}
          <main className="profile-main">
            {isEditing ? (
              <section className="profile-main-panel">
                <div className="profile-panel-header">
                  <span className="profile-eyebrow">Profile Settings</span>
                  <h2>Update your society details</h2>
                </div>

                <div className="profile-form-grid">
                  <div className="form-group">
                    <label>Members</label>
                    <input
                      type="number"
                      value={editForm.membersCount || 0}
                      onChange={(e) =>
                        setEditForm({ ...editForm, membersCount: parseInt(e.target.value || '0', 10) })
                      }
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label>Founded Year</label>
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
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: 16 }}>
                  <label>Society Type</label>
                  <div className="profile-type-grid">
                    {SOCIETY_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={`profile-type-btn ${editForm.societyType === type ? 'active' : ''}`}
                        onClick={() => setEditForm({ ...editForm, societyType: type })}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="profile-panel-divider" />

                <div className="profile-panel-header profile-panel-header-compact">
                  <span className="profile-eyebrow">Social Links</span>
                  <h2>Choose where people can find you</h2>
                </div>

                <div className="profile-form-grid">
                  <div className="form-group">
                    <label>Instagram Handle</label>
                    <input
                      type="text"
                      value={editForm.instagram || ''}
                      onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                      placeholder="@yourhandle"
                    />
                  </div>

                  <div className="form-group">
                    <label>Discord Server URL</label>
                    <input
                      type="text"
                      value={editForm.discordUrl || ''}
                      onChange={(e) => setEditForm({ ...editForm, discordUrl: e.target.value })}
                      placeholder="https://discord.gg/..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Facebook Page</label>
                    <input
                      type="text"
                      value={editForm.facebook || ''}
                      onChange={(e) => setEditForm({ ...editForm, facebook: e.target.value })}
                      placeholder="@yourpage"
                    />
                  </div>

                  <div className="form-group">
                    <label>LinkedIn Page</label>
                    <input
                      type="text"
                      value={editForm.linkedin || ''}
                      onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/..."
                    />
                  </div>
                </div>
              </section>
            ) : (
              <>
                <div className="profile-tabs" role="tablist">
                  <button
                    type="button"
                    className={`profile-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
                    onClick={() => setActiveTab('upcoming')}
                  >
                    View My Listings
                  </button>
                  <button
                    type="button"
                    className={`profile-tab ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                  >
                    History
                  </button>
                  <button
                    type="button"
                    className="profile-tab profile-tab-action"
                    onClick={() => navigate('/create-listing')}
                  >
                    <Plus size={16} />
                    Create New Listing
                  </button>
                </div>

                <section className="profile-main-panel">
                  <div className="profile-panel-header">
                    <span className="profile-eyebrow">
                      {activeTab === 'upcoming' ? 'Upcoming Events' : 'Past Events'}
                    </span>
                    <h2>
                      {activeTab === 'upcoming'
                        ? 'Everything your society still has coming up'
                        : 'A record of events your society has already run'}
                    </h2>
                  </div>

                  {visibleListings.length > 0 ? (
                    <div className="profile-events-grid">
                      {visibleListings.map((listing) => (
                        <EventCard
                          key={listing.id}
                          listing={listing}
                          onClick={(id) => navigate(`/listings/${id}`)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="profile-empty-state">
                      <Clock3 size={28} strokeWidth={1.6} />
                      <h3>
                        {activeTab === 'upcoming' ? 'No upcoming listings yet' : 'No past events yet'}
                      </h3>
                      <p>
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
