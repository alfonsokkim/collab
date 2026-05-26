import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Calendar, FileText, Image as ImageIcon, Loader2, Search, Tag, Users, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { createListing } from '../services/listingService';
import { searchSocieties, sendHostInvite } from '../services/collabRequestService';
import type { SocietySearchResult } from '../services/collabRequestService';
import { UNIVERSITIES } from '../services/societyService';

const availableTags = [
  'Social',
  'Events',
  'Tech',
  'Sports',
  'Culture',
  'Networking',
  'Pubcrawl',
  'Festival',
];
const MAX_IMAGES = 8;

const inputWrapperClass =
  'flex items-center gap-2.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-light)] px-3.5 py-[11px] transition focus-within:border-[var(--primary)] focus-within:bg-[var(--bg)] focus-within:shadow-[0_0_0_3px_rgba(232,160,69,0.12)]';

const fieldLabelClass = 'text-[13px] font-semibold text-[var(--text)]';

export function CreateListing() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [peopleNeeded, setPeopleNeeded] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [visibleToUniversities, setVisibleToUniversities] = useState<string[] | null>(null); // null = all
  const [images, setImages] = useState<{ blob: Blob; preview: string }[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Society invite state
  const [inviteSearch, setInviteSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SocietySearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [invitedSocieties, setInvitedSocieties] = useState<SocietySearchResult[]>([]);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) navigate('/login', { replace: true });
  }, [authLoading, user, navigate]);

  const clearInviteSearch = () => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    setInviteSearch('');
    setSearchResults([]);
    setSearching(false);
  };

  const handleInviteSearchChange = (value: string) => {
    setInviteSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!value.trim()) { setSearchResults([]); setSearching(false); return; }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      const results = await searchSocieties(value);
      setSearchResults(results.filter(
        (r) => r.userId !== user?.id && !invitedSocieties.find((s) => s.userId === r.userId)
      ));
      setSearching(false);
    }, 300);
  };

  const addInvite = (society: SocietySearchResult) => {
    setInvitedSocieties((prev) => [...prev, society]);
    clearInviteSearch();
  };

  const removeInvite = (userId: string) => {
    setInvitedSocieties((prev) => prev.filter((s) => s.userId !== userId));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (images.length >= MAX_IMAGES) {
        setError(`You can upload a maximum of ${MAX_IMAGES} images`);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const size = Math.min(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const offsetX = (img.width - size) / 2;
        const offsetY = (img.height - size) / 2;
        ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);
        canvas.toBlob((blob) => {
          if (!blob) return;
          const preview = URL.createObjectURL(blob);
          setImages((prev) => [...prev, { blob, preview }]);
          setError('');
        }, 'image/jpeg', 0.8);
      };
      img.src = objectUrl;
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('You must be logged in to create a listing');
      return;
    }

    if (!title.trim()) {
      setError('Event title is required');
      return;
    }

    if (!description.trim()) {
      setError('Event description is required');
      return;
    }

    if (!date) {
      setError('Event date is required');
      return;
    }

    if (!peopleNeeded || parseInt(peopleNeeded, 10) < 1) {
      setError('Number of people needed must be at least 1');
      return;
    }

    if (selectedTags.length === 0) {
      setError('Please select at least one event type');
      return;
    }

    if (visibleToUniversities !== null && visibleToUniversities.length === 0) {
      setError('Please select at least one university or set visibility to "All universities".');
      return;
    }

    setLoading(true);

    try {
      const societyName = user.user_metadata?.society_name || 'Unknown Society';
      const listing = await createListing(
        {
          title,
          description,
          date,
          peopleNeeded: parseInt(peopleNeeded, 10),
          tags: selectedTags,
          images: images.length > 0 ? images.map((i) => i.blob) : undefined,
          visibleToUniversities,
        },
        societyName,
      );
      // Send host invites to selected societies
      if (listing && invitedSocieties.length > 0) {
        await Promise.all(
          invitedSocieties.map((s) => sendHostInvite(listing.id, s.userId))
        );
      }
      navigate('/listings');
    } catch (err: any) {
      setError(err.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-60px)] items-start justify-center bg-[var(--bg-light)] px-6 py-12">
      <div className="w-full max-w-[680px] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)] px-6 py-8 shadow-[var(--shadow-lg)] sm:px-12 sm:py-11">
        <div className="mb-8">
          <h1 className="mb-1.5 font-[var(--heading)] text-[26px] text-[var(--text)]">
            Create Event Listing
          </h1>
          <p className="text-sm text-[var(--text-light)]">
            Post a new collaboration opportunity for your society
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2.5 rounded-[var(--radius)] border border-red-300/50 bg-red-500/10 px-3.5 py-[11px] text-[13px] text-red-500">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-[22px]">
          <div className="flex flex-col gap-[7px]">
            <label htmlFor="title" className={fieldLabelClass}>Event Title</label>
            <div className={inputWrapperClass}>
              <FileText size={20} className="shrink-0 text-[var(--text-light)]" />
              <input
                type="text"
                id="title"
                placeholder="e.g., Epic Pubcrawl Collaboration"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                maxLength={100}
                className="w-full border-none bg-transparent text-[15px] text-[var(--text)] outline-none placeholder:text-[var(--text-light)] disabled:text-[var(--text-light)]"
              />
            </div>
            <span className="text-right text-xs text-[var(--text-light)]">{title.length}/100</span>
          </div>

          <div className="flex flex-col gap-[7px]">
            <label htmlFor="banner" className={fieldLabelClass}>Event Banner (Optional)</label>
            <p className="text-xs text-[var(--text-light)]">
              Upload square images (1:1). We&apos;ll crop automatically if needed. Up to {MAX_IMAGES} images.
            </p>

            {images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((image, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square overflow-hidden rounded-[var(--radius)] shadow-[var(--shadow)]"
                  >
                    <img src={image.preview} alt={`Preview ${idx + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 p-0 text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={loading}
                      aria-label={`Remove image ${idx + 1}`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}

                {images.length < MAX_IMAGES && (
                  <div className="aspect-square">
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="images"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={loading}
                      className="hidden"
                      multiple
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--bg-light)] p-4 text-[var(--text)] transition hover:border-[var(--primary)] hover:bg-[var(--primary-subtle)] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={loading}
                    >
                      <ImageIcon size={24} className="text-[var(--text-light)]" />
                      <span className="text-sm font-semibold">Add Image</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--bg-light)] px-5 py-9 text-center transition hover:border-[var(--primary)] hover:bg-[var(--primary-subtle)]">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="images"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={loading}
                  className="hidden"
                  multiple
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center gap-2.5 bg-transparent p-0 text-center text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loading}
                >
                  <ImageIcon size={32} className="text-[var(--text-light)]" />
                  <span className="text-[15px] font-semibold text-[var(--text)]">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-xs text-[var(--text-light)]">
                    PNG, JPG, GIF up to 5MB (up to {MAX_IMAGES} images)
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-[7px]">
            <label htmlFor="description" className={fieldLabelClass}>Description</label>
            <textarea
              id="description"
              placeholder="Describe your event and what you're looking for in collaborating societies..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={5}
              maxLength={500}
              className="min-h-[120px] resize-y rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-light)] px-3.5 py-[11px] text-[15px] text-[var(--text)] transition outline-none placeholder:text-[var(--text-light)] focus:border-[var(--primary)] focus:bg-[var(--bg)] focus:shadow-[0_0_0_3px_rgba(232,160,69,0.12)] disabled:text-[var(--text-light)]"
            />
            <span className="text-right text-xs text-[var(--text-light)]">{description.length}/500</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-[7px]">
              <label htmlFor="date" className={fieldLabelClass}>Event Date</label>
              <div className={inputWrapperClass}>
                <Calendar size={20} className="shrink-0 text-[var(--text-light)]" />
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full border-none bg-transparent text-[15px] text-[var(--text)] outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-[7px]">
              <label htmlFor="peopleNeeded" className={fieldLabelClass}>People Needed</label>
              <div className={inputWrapperClass}>
                <Users size={20} className="shrink-0 text-[var(--text-light)]" />
                <input
                  type="number"
                  id="peopleNeeded"
                  placeholder="e.g., 50"
                  value={peopleNeeded}
                  onChange={(e) => setPeopleNeeded(e.target.value)}
                  disabled={loading}
                  min="1"
                  max="999"
                  required
                  className="w-full border-none bg-transparent text-[15px] text-[var(--text)] outline-none placeholder:text-[var(--text-light)] disabled:text-[var(--text-light)]"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-[7px]">
            <label className={fieldLabelClass}>Event Type(s)</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={cn(
                    'flex items-center justify-center gap-[7px] rounded-[var(--radius)] border px-3.5 py-2.5 text-[13px] font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
                    selectedTags.includes(tag)
                      ? 'border-[rgba(232,160,69,0.35)] bg-[var(--primary-subtle)] font-semibold text-[var(--primary-dark)]'
                      : 'border-[var(--border)] bg-[var(--bg-light)] text-[var(--text-mid)] hover:border-[var(--primary)] hover:bg-[var(--primary-subtle)] hover:text-[var(--primary-dark)]',
                  )}
                  onClick={() => toggleTag(tag)}
                  disabled={loading}
                >
                  <Tag size={16} />
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* University visibility */}
          <div className="flex flex-col gap-[7px]">
            <label className={fieldLabelClass}>Visibility</label>
            <p className="text-xs text-[var(--text-light)]">
              Choose which universities can see this listing, or make it open to everyone.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setVisibleToUniversities(null)}
                className={cn(
                  'rounded-[var(--radius)] border px-3.5 py-2 text-[13px] font-medium transition',
                  visibleToUniversities === null
                    ? 'border-[rgba(232,160,69,0.35)] bg-[var(--primary-subtle)] font-semibold text-[var(--primary-dark)]'
                    : 'border-[var(--border)] bg-[var(--bg-light)] text-[var(--text-mid)] hover:border-[var(--primary)] hover:bg-[var(--primary-subtle)] hover:text-[var(--primary-dark)]',
                )}
                disabled={loading}
              >
                🌐 All universities
              </button>
              {UNIVERSITIES.map(({ id, label }) => {
                const selected = visibleToUniversities?.includes(id) ?? false;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setVisibleToUniversities((prev) => {
                        const current = prev ?? [];
                        return current.includes(id)
                          ? current.filter((u) => u !== id) || null
                          : [...current, id];
                      });
                    }}
                    className={cn(
                      'rounded-[var(--radius)] border px-3.5 py-2 text-[13px] font-medium transition',
                      selected
                        ? 'border-[rgba(232,160,69,0.35)] bg-[var(--primary-subtle)] font-semibold text-[var(--primary-dark)]'
                        : 'border-[var(--border)] bg-[var(--bg-light)] text-[var(--text-mid)] hover:border-[var(--primary)] hover:bg-[var(--primary-subtle)] hover:text-[var(--primary-dark)]',
                    )}
                    disabled={loading}
                  >
                    {id}
                  </button>
                );
              })}
            </div>
            {visibleToUniversities !== null && visibleToUniversities.length === 0 && (
              <p className="text-[12px] text-amber-500">Select at least one university or switch back to "All universities".</p>
            )}
          </div>

          {/* Invite specific societies */}
          <div className="flex flex-col gap-[7px]">
            <label className={fieldLabelClass}>
              Invite Specific Societies <span className="font-normal text-[var(--text-light)]">(Optional)</span>
            </label>
            <p className="text-xs text-[var(--text-light)]">
              Directly invite societies to collaborate on this listing. They'll receive a request they can accept or decline.
            </p>

            {/* Search input */}
            <div className="relative">
              <div className={cn(inputWrapperClass, 'relative')}>
                {searching
                  ? <Loader2 size={18} className="shrink-0 animate-spin text-[var(--text-light)]" />
                  : <Search size={18} className="shrink-0 text-[var(--text-light)]" />
                }
                <input
                  type="text"
                  placeholder="Search societies by name…"
                  value={inviteSearch}
                  onChange={(e) => handleInviteSearchChange(e.target.value)}
                  disabled={loading}
                  className="w-full border-none bg-transparent text-[15px] text-[var(--text)] outline-none placeholder:text-[var(--text-light)] disabled:text-[var(--text-light)]"
                />
                {inviteSearch && (
                  <button type="button" onClick={clearInviteSearch} className="text-[var(--text-light)] hover:text-[var(--text)]">
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Dropdown results */}
              {searchResults.length > 0 && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] shadow-[var(--shadow-lg)]">
                  {searchResults.map((s) => (
                    <button
                      key={s.userId}
                      type="button"
                      onClick={() => addInvite(s)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-[var(--bg-light)]"
                    >
                      {s.logoImageUrl
                        ? <img src={s.logoImageUrl} alt={s.name} className="h-7 w-7 shrink-0 rounded-full object-cover border border-[var(--border)]" />
                        : <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary-subtle)] text-[11px] font-bold text-[var(--primary-dark)]">
                            {s.name.slice(0, 2).toUpperCase()}
                          </div>
                      }
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[var(--text)]">{s.name}</p>
                        {s.societyType && <p className="text-[11px] text-[var(--text-light)]">{s.societyType}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected societies chips */}
            {invitedSocieties.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {invitedSocieties.map((s) => (
                  <div
                    key={s.userId}
                    className="flex items-center gap-1.5 rounded-full border border-[rgba(232,160,69,0.35)] bg-[var(--primary-subtle)] pl-1 pr-2.5 py-1"
                  >
                    {s.logoImageUrl
                      ? <img src={s.logoImageUrl} alt={s.name} className="h-5 w-5 rounded-full object-cover" />
                      : <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] text-[9px] font-bold text-white">
                          {s.name.slice(0, 2).toUpperCase()}
                        </div>
                    }
                    <span className="text-[12px] font-semibold text-[var(--primary-dark)]">{s.name}</span>
                    <button
                      type="button"
                      onClick={() => removeInvite(s.userId)}
                      className="ml-0.5 text-[var(--primary-dark)] opacity-60 hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="mt-1 rounded-[var(--radius)] bg-[var(--dark)] px-6 py-3 text-[15px] font-semibold text-white transition hover:-translate-y-px hover:bg-[var(--dark-surface)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            disabled={loading}
          >
            {loading ? 'Creating Listing...' : 'Create Listing'}
          </button>
        </form>
      </div>
    </div>
  );
}
