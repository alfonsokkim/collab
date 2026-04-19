import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Calendar, FileText, Image as ImageIcon, Tag, Users, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { createListing } from '../services/listingService';

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
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

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
          setImages((prev) => [...prev, base64]);
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

    setLoading(true);

    try {
      const societyName = user.user_metadata?.society_name || 'Unknown Society';
      await createListing(
        {
          title,
          description,
          date,
          peopleNeeded: parseInt(peopleNeeded, 10),
          tags: selectedTags,
          images: images.length > 0 ? images : undefined,
        },
        societyName,
      );
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
                    <img src={image} alt={`Preview ${idx + 1}`} className="h-full w-full object-cover" />
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
