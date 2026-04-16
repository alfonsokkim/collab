import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Edit2,
  Image as ImageIcon,
  Save,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GalleryModal } from '../components/GalleryModal';
import { cn } from '../lib/utils';
import { deleteListing, fetchListingById, updateListing } from '../services/listingService';

interface ListingData {
  id: string;
  title: string;
  description: string;
  date: string;
  peopleNeeded: number;
  tags: string[];
  bannerImageUrl?: string;
  imageUrls?: string[];
  societyName: string;
  societyType?: string;
  userId: string;
  createdAt: string;
}

const ALL_TAGS = [
  'Social',
  'Events',
  'Pubcrawl',
  'Tech',
  'Networking',
  'Sports',
  'Outdoor',
  'Competition',
  'Culture',
  'Festival',
  'Community',
];
const MAX_IMAGES = 8;

const inputClass =
  'w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-light)] px-3.5 py-[11px] text-[15px] text-[var(--text)] transition outline-none placeholder:text-[var(--text-light)] focus:border-[var(--primary)] focus:bg-white focus:shadow-[0_0_0_3px_rgba(232,160,69,0.12)]';

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3.5">
      <Icon size={24} className="mt-0.5 shrink-0 text-[var(--primary)]" />
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--text-light)]">
          {label}
        </label>
        <p className="text-[15px] font-medium text-[var(--text)]">{value}</p>
      </div>
    </div>
  );
}

export function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [listing, setListing] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);

  const [editForm, setEditForm] = useState<Partial<ListingData>>({
    title: '',
    description: '',
    date: '',
    peopleNeeded: 0,
    tags: [],
  });

  useEffect(() => {
    const loadListing = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await fetchListingById(id);

        if (!data) {
          setError('Listing not found');
          return;
        }

        const listingData: ListingData = {
          id: data.id,
          title: data.title,
          description: data.description,
          date: data.date,
          peopleNeeded: data.peopleNeeded,
          tags: data.tags,
          bannerImageUrl: data.bannerImageUrl,
          imageUrls: data.imageUrls || [],
          societyName: data.societyName,
          societyType: data.societyType,
          userId: data.userId,
          createdAt: data.createdAt,
        };

        setListing(listingData);
        setEditForm(listingData);
        setImages(listingData.imageUrls || []);
      } catch (err: any) {
        console.error('Error loading listing:', err);
        setError('Failed to load listing');
      } finally {
        setLoading(false);
      }
    };

    loadListing();
  }, [id]);

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
          setImages((prev) => [...prev, canvas.toDataURL('image/jpeg', 0.8)]);
          setError('');
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleTag = (tag: string) => {
    setEditForm({
      ...editForm,
      tags: editForm.tags?.includes(tag)
        ? editForm.tags.filter((t) => t !== tag)
        : [...(editForm.tags || []), tag],
    });
  };

  const handleSave = async () => {
    if (!listing) return;
    if (!editForm.title?.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const updated = await updateListing(listing.id, {
        title: editForm.title!,
        description: editForm.description!,
        date: editForm.date!,
        peopleNeeded: editForm.peopleNeeded!,
        tags: editForm.tags!,
        ...(images.length > 0 ? { images } : {}),
      });

      if (updated) {
        setListing({
          id: updated.id,
          title: updated.title,
          description: updated.description,
          date: updated.date,
          peopleNeeded: updated.peopleNeeded,
          tags: updated.tags,
          bannerImageUrl: updated.bannerImageUrl,
          imageUrls: updated.imageUrls || [],
          societyName: updated.societyName,
          societyType: updated.societyType,
          userId: updated.userId,
          createdAt: updated.createdAt,
        });
        setImages(updated.imageUrls || []);
        setIsEditing(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save listing');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!listing || !window.confirm('Are you sure you want to delete this listing?')) return;

    setSaving(true);
    setError('');

    try {
      const success = await deleteListing(listing.id);
      if (success) navigate('/listings');
      else setError('Failed to delete listing');
    } catch (err: any) {
      setError(err.message || 'Failed to delete listing');
    } finally {
      setSaving(false);
    }
  };

  const renderImageGallery = () => {
    if (!listing) return null;
    const galleryImages =
      listing.imageUrls && listing.imageUrls.length > 0
        ? listing.imageUrls
        : listing.bannerImageUrl
          ? [listing.bannerImageUrl]
          : [];

    if (galleryImages.length === 0) return null;

    if (galleryImages.length === 1) {
      return (
        <div
          className="mb-8 w-full max-w-[560px] cursor-pointer overflow-hidden rounded-[var(--radius-lg)] transition hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
          onClick={() => {
            setGalleryStartIndex(0);
            setGalleryOpen(true);
          }}
        >
          <img src={galleryImages[0]} alt={listing.title} className="block h-auto w-full object-contain" />
        </div>
      );
    }

    const mainImage = galleryImages[0];
    const thumbnails = galleryImages.slice(1, 5);

    return (
      <div className="mb-9 flex w-fit items-start gap-4 max-md:w-full max-md:flex-col max-md:gap-3">
        <div
          className="h-[280px] w-[280px] shrink-0 cursor-pointer overflow-hidden rounded-[var(--radius-lg)] transition hover:shadow-[0_8px_24px_rgba(0,0,0,0.14)] max-md:h-auto max-md:w-full max-md:aspect-square"
          onClick={() => {
            setGalleryStartIndex(0);
            setGalleryOpen(true);
          }}
        >
          <img src={mainImage} alt={listing.title} className="h-full w-full object-cover" />
        </div>

        <div className="grid w-fit grid-cols-2 gap-2.5 max-md:w-full max-md:grid-cols-2">
          {thumbnails.map((image, idx) => (
            <div
              key={idx}
              className="relative h-[134px] w-[134px] cursor-pointer overflow-hidden rounded-[var(--radius)] bg-[var(--bg-light)] transition hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] max-md:h-auto max-md:w-full max-md:aspect-square"
              onClick={() => {
                setGalleryStartIndex(idx + 1);
                setGalleryOpen(true);
              }}
            >
              <img src={image} alt={`${listing.title} ${idx + 2}`} className="h-full w-full object-cover" />
              {idx === 3 && galleryImages.length > 4 && (
                <div className="absolute inset-0 flex items-center justify-center rounded-[var(--radius)] bg-black/55 backdrop-blur-sm">
                  <button
                    className="rounded-[var(--radius-sm)] bg-white px-5 py-2.5 text-[13px] font-bold text-[var(--text)] transition hover:bg-[var(--primary)] hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setGalleryStartIndex(3);
                      setGalleryOpen(true);
                    }}
                  >
                    View more
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const isOwner = !!(user && listing && user.id === listing.userId);
  const eventDate = listing
    ? new Date(listing.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  if (loading) {
    return (
      <div className="mx-auto max-w-[960px] px-4 py-10 md:px-7">
        <div className="flex min-h-[300px] items-center justify-center text-[15px] text-[var(--text-light)]">
          Loading listing...
        </div>
      </div>
    );
  }

  const BackButton = (
    <button
      onClick={() => navigate('/listings')}
      className="mb-7 inline-flex items-center gap-1.5 rounded-[var(--radius)] border border-[var(--border)] bg-transparent px-4 py-[9px] text-sm font-medium text-[var(--text-mid)] transition hover:border-[var(--text-light)] hover:bg-[var(--bg-light)] hover:text-[var(--text)]"
    >
      <ArrowLeft size={20} />
      Back to Listings
    </button>
  );

  if (error && !listing) {
    return (
      <div className="mx-auto max-w-[960px] px-4 py-10 md:px-7">
        {BackButton}
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-red-200 bg-red-50 p-6 text-red-600">
          <AlertCircle size={24} />
          <p>{error || 'Listing not found'}</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-[960px] px-4 py-10 md:px-7">
        {BackButton}
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-red-200 bg-red-50 p-6 text-red-600">
          <AlertCircle size={24} />
          <p>Listing not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[960px] px-4 py-10 md:px-7">
      {BackButton}

      <div
        className={cn(
          'rounded-[var(--radius-lg)] border bg-white p-5 shadow-[var(--shadow-sm)] md:p-10',
          isOwner ? 'border-[rgba(232,160,69,0.3)]' : 'border-[var(--border)]',
        )}
      >
        {isOwner && isEditing ? (
          <>
            <div className="mb-8">
              <h1 className="text-[var(--text)]">Edit Listing</h1>
            </div>

            {error && (
              <div className="mb-5 flex items-center gap-2.5 rounded-[var(--radius)] border border-red-200 bg-red-50 px-3.5 py-[11px] text-[13px] text-red-600">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-[22px]">
              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-semibold text-[var(--text)]">Title</label>
                <input
                  type="text"
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Listing title"
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-semibold text-[var(--text)]">Description</label>
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Event description"
                  rows={5}
                  className={`${inputClass} min-h-[120px] resize-y`}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-[7px]">
                  <label className="text-[13px] font-semibold text-[var(--text)]">Date</label>
                  <input
                    type="date"
                    value={editForm.date || ''}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-[7px]">
                  <label className="text-[13px] font-semibold text-[var(--text)]">Attendance</label>
                  <input
                    type="number"
                    value={editForm.peopleNeeded || 0}
                    onChange={(e) =>
                      setEditForm({ ...editForm, peopleNeeded: parseInt(e.target.value || '0', 10) })
                    }
                    min="1"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-semibold text-[var(--text)]">Event Type</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {ALL_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={cn(
                        'rounded-[var(--radius)] border px-3.5 py-2.5 text-[13px] font-medium transition',
                        editForm.tags?.includes(tag)
                          ? 'border-[rgba(232,160,69,0.35)] bg-[var(--primary-subtle)] font-semibold text-[var(--primary-dark)]'
                          : 'border-[var(--border)] bg-[var(--bg-light)] text-[var(--text-mid)] hover:border-[var(--primary)] hover:bg-[var(--primary-subtle)] hover:text-[var(--primary-dark)]',
                      )}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-semibold text-[var(--text)]">Event Images</label>
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
                        <img src={image} alt={`Preview ${idx + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={saving}
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
                          disabled={saving}
                          className="hidden"
                          multiple
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--bg-light)] p-4 text-[var(--text)] transition hover:border-[var(--primary)] hover:bg-[var(--primary-subtle)] disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={saving}
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
                      disabled={saving}
                      className="hidden"
                      multiple
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full flex-col items-center gap-2.5 bg-transparent p-0 text-center text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={saving}
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

              <div className="mt-5 flex flex-col gap-2.5 md:flex-row">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--dark)] px-[22px] py-[11px] text-sm font-semibold text-white transition hover:bg-[var(--dark-surface)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-light)] px-[22px] py-[11px] text-sm font-semibold text-[var(--text-mid)] transition hover:bg-[var(--border-light)] hover:text-[var(--text)]"
                >
                  <X size={18} />
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-[var(--radius)] border border-red-200 bg-red-50 px-[22px] py-[11px] text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 md:ml-auto"
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {renderImageGallery()}

            <div className={cn('mb-8 max-w-[640px]', isOwner && 'flex max-w-none items-start justify-between gap-6 max-md:flex-col')}>
              <div className="flex-1">
                <div className="mb-2">
                  <h1 className="text-[34px] text-[var(--text)] max-md:text-[26px]">{listing.title}</h1>
                </div>
                <div className="mb-1.5 flex items-center gap-2">
                  <p className="text-[15px] font-semibold text-[var(--text-mid)]">{listing.societyName}</p>
                  {listing.societyType && (
                    <span className="inline-block rounded-full border border-[rgba(232,160,69,0.4)] bg-[rgba(232,160,69,0.2)] px-3 py-1 text-xs font-semibold tracking-[0.04em] text-[var(--primary)]">
                      {listing.societyType}
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-[var(--text-light)]">Posted on {eventDate}</p>
              </div>

              {isOwner && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-[var(--radius)] bg-[var(--dark)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--dark-surface)] max-md:w-full max-md:justify-center"
                >
                  <Edit2 size={18} />
                  Edit
                </button>
              )}
            </div>

            <div className="mb-8 grid max-w-[640px] gap-5 border-y border-[var(--border-light)] py-5 md:grid-cols-2">
              <InfoItem icon={Calendar} label="Date" value={eventDate} />
              <InfoItem icon={Users} label="Attendance" value={`${listing.peopleNeeded} people`} />
            </div>

            <div className="mb-8 max-w-[640px]">
              <h2 className="mb-3.5 text-sm font-bold uppercase tracking-[0.08em] text-[var(--text-light)]">
                About This Event
              </h2>
              <p className="text-[15px] leading-7 text-[var(--text-mid)]">{listing.description}</p>
            </div>

            <div className="mb-8 max-w-[640px]">
              <h2 className="mb-3.5 text-sm font-bold uppercase tracking-[0.08em] text-[var(--text-light)]">
                Event Type
              </h2>
              <div className="flex flex-wrap gap-2">
                {listing.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-[var(--primary-subtle)] px-3.5 py-1.5 text-[13px] font-semibold text-[var(--primary-dark)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {!isOwner && (
              <div className="max-w-[640px]">
                <h2 className="mb-3.5 text-sm font-bold uppercase tracking-[0.08em] text-[var(--text-light)]">
                  Interested?
                </h2>
                <p className="mb-4 text-[15px] leading-[1.65] text-[var(--text-mid)]">
                  Contact {listing.societyName} to express your interest in collaborating on this event!
                </p>
                <button className="inline-flex items-center rounded-[var(--radius)] bg-[var(--dark)] px-7 py-3 text-[15px] font-semibold text-white transition hover:-translate-y-px hover:bg-[var(--dark-surface)]">
                  Express Interest
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {galleryOpen && listing.imageUrls && listing.imageUrls.length > 0 && (
        <GalleryModal
          images={listing.imageUrls}
          initialIndex={galleryStartIndex}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </div>
  );
}
