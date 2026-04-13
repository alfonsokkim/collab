import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, Users, Tag, AlertCircle, Image as ImageIcon, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createListing } from '../services/listingService';
import '../styles/CreateListing.css';

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

  const availableTags = ['Social', 'Events', 'Tech', 'Sports', 'Culture', 'Networking', 'Pubcrawl', 'Festival'];
  const MAX_IMAGES = 8;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Process all selected files
    Array.from(files).forEach((file) => {
      // Check if we've hit the max number of images
      if (images.length >= MAX_IMAGES) {
        setError(`You can upload a maximum of ${MAX_IMAGES} images`);
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Crop to square
          const size = Math.min(img.width, img.height);
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const offsetX = (img.width - size) / 2;
            const offsetY = (img.height - size) / 2;
            ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);
            const base64 = canvas.toDataURL('image/jpeg', 0.8);
            setImages(prev => [...prev, base64]);
            setError('');
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
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

    if (!peopleNeeded || parseInt(peopleNeeded) < 1) {
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
          peopleNeeded: parseInt(peopleNeeded),
          tags: selectedTags,
          images: images.length > 0 ? images : undefined,
        },
        societyName
      );

      // Redirect to listings page on success
      navigate('/listings');
    } catch (err: any) {
      setError(err.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-listing-container">
      <div className="create-listing-card">
        <div className="create-listing-header">
          <h1>Create Event Listing</h1>
          <p>Post a new collaboration opportunity for your society</p>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-listing-form">
          <div className="form-group">
            <label htmlFor="title">Event Title</label>
            <div className="input-wrapper">
              <FileText size={20} />
              <input
                type="text"
                id="title"
                placeholder="e.g., Epic Pubcrawl Collaboration"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                maxLength={100}
              />
            </div>
            <span className="char-count">{title.length}/100</span>
          </div>

          <div className="form-group">
            <label htmlFor="banner">Event Banner (Optional)</label>
            <p className="field-hint">Upload square images (1:1). We'll crop automatically if needed. Up to {MAX_IMAGES} images.</p>
            {images.length > 0 ? (
              <div className="images-preview-grid">
                {images.map((image, idx) => (
                  <div key={idx} className="image-preview-item">
                    <img src={image} alt={`Preview ${idx + 1}`} />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="remove-image-btn"
                      disabled={loading}
                      aria-label={`Remove image ${idx + 1}`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {images.length < MAX_IMAGES && (
                  <div className="add-image-cell">
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="images"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={loading}
                      style={{ display: 'none' }}
                      multiple
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="add-image-btn"
                      disabled={loading}
                    >
                      <ImageIcon size={24} />
                      <span>Add Image</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="image-upload-area">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="images"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={loading}
                  style={{ display: 'none' }}
                  multiple
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="upload-btn"
                  disabled={loading}
                >
                  <ImageIcon size={32} />
                  <span>Click to upload or drag and drop</span>
                  <span className="text-small">PNG, JPG, GIF up to 5MB (up to {MAX_IMAGES} images)</span>
                </button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              placeholder="Describe your event and what you're looking for in collaborating societies..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={5}
              maxLength={500}
            />
            <span className="char-count">{description.length}/500</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Event Date</label>
              <div className="input-wrapper">
                <Calendar size={20} />
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="peopleNeeded">People Needed</label>
              <div className="input-wrapper">
                <Users size={20} />
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
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Event Type(s)</label>
            <div className="tags-grid">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={`tag-button ${selectedTags.includes(tag) ? 'active' : ''}`}
                  onClick={() => toggleTag(tag)}
                  disabled={loading}
                >
                  <Tag size={16} />
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Creating Listing...' : 'Create Listing'}
          </button>
        </form>
      </div>
    </div>
  );
}
