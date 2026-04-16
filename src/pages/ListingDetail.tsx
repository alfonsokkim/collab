import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Calendar, Users, ArrowLeft, AlertCircle, Edit2, Save, X, Trash2, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GalleryModal } from '../components/GalleryModal';
import { fetchListingById, updateListing, deleteListing } from '../services/listingService';
import '../styles/ListingDetail.css';

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

const ALL_TAGS = ['Social', 'Events', 'Pubcrawl', 'Tech', 'Networking', 'Sports', 'Outdoor', 'Competition', 'Culture', 'Festival', 'Community'];
const MAX_IMAGES = 8;

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

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const toggleTag = (tag: string) => {
    setEditForm({
      ...editForm,
      tags: editForm.tags?.includes(tag)
        ? editForm.tags.filter(t => t !== tag)
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
      if (success) {
        navigate('/listings');
      } else {
        setError('Failed to delete listing');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete listing');
    } finally {
      setSaving(false);
    }
  };

  // Render image gallery grid
  const renderImageGallery = () => {
    if (!listing) return null;
    const images = listing.imageUrls && listing.imageUrls.length > 0 ? listing.imageUrls : (listing.bannerImageUrl ? [listing.bannerImageUrl] : []);
    console.log('renderImageGallery - listing.imageUrls:', listing.imageUrls, 'images array:', images);

    if (images.length === 0) {
      return null;
    }

    if (images.length === 1) {
      return (
        <div className="single-image" onClick={() => { setGalleryStartIndex(0); setGalleryOpen(true); }}>
          <img src={images[0]} alt={listing.title} />
        </div>
      );
    }

    // Multiple images - show grid layout
    const mainImage = images[0];
    const thumbnails = images.slice(1, 5);

    return (
      <div className="listing-images-grid">
        <div className="main-image" onClick={() => { setGalleryStartIndex(0); setGalleryOpen(true); }}>
          <img src={mainImage} alt={listing.title} />
        </div>

        <div className="thumbnail-grid">
          {thumbnails.map((image, idx) => (
            <div
              key={idx}
              className="thumbnail-cell"
              onClick={() => { setGalleryStartIndex(idx + 1); setGalleryOpen(true); }}
            >
              <img src={image} alt={`${listing.title} ${idx + 2}`} />
              {idx === 3 && images.length > 4 && (
                <div className="view-more-overlay">
                  <button className="view-more-btn" onClick={(e) => { e.stopPropagation(); setGalleryStartIndex(3); setGalleryOpen(true); }}>
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

  const isOwner = user && listing && user.id === listing.userId;
  console.log('ListingDetail render - isOwner:', isOwner, 'isEditing:', isEditing, 'listing:', listing);

  if (loading) {
    return (
      <div className="listing-detail">
        <div className="detail-loading">Loading listing...</div>
      </div>
    );
  }

  if (error && !listing) {
    return (
      <div className="listing-detail">
        <button onClick={() => navigate('/listings')} className="back-btn">
          <ArrowLeft size={20} />
          Back to Listings
        </button>
        <div className="error-box">
          <AlertCircle size={24} />
          <p>{error || 'Listing not found'}</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="listing-detail">
        <button onClick={() => navigate('/listings')} className="back-btn">
          <ArrowLeft size={20} />
          Back to Listings
        </button>
        <div className="error-box">
          <AlertCircle size={24} />
          <p>Listing not found</p>
        </div>
      </div>
    );
  }

  const eventDate = new Date(listing.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (isOwner && isEditing) {
    return (
      <div className="listing-detail">
        <button onClick={() => navigate('/listings')} className="back-btn">
          <ArrowLeft size={20} />
          Back to Listings
        </button>

        <div className="detail-card admin-card">
          <div className="detail-header">
            <h1>Edit Listing</h1>
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="edit-form">
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={editForm.title || ''}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Listing title"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={editForm.description || ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Event description"
                rows={5}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={editForm.date || ''}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Attendance</label>
                <input
                  type="number"
                  value={editForm.peopleNeeded || 0}
                  onChange={(e) => setEditForm({ ...editForm, peopleNeeded: parseInt(e.target.value) })}
                  min="1"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Event Type</label>
              <div className="tags-grid">
                {ALL_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    className={`tag-button ${editForm.tags?.includes(tag) ? 'active' : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Event Images</label>
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
                        disabled={saving}
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
                        disabled={saving}
                        style={{ display: 'none' }}
                        multiple
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="add-image-btn"
                        disabled={saving}
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
                    disabled={saving}
                    style={{ display: 'none' }}
                    multiple
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="upload-btn"
                    disabled={saving}
                  >
                    <ImageIcon size={32} />
                    <span>Click to upload or drag and drop</span>
                    <span className="text-small">PNG, JPG, GIF up to 5MB (up to {MAX_IMAGES} images)</span>
                  </button>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button onClick={handleSave} disabled={saving} className="save-btn">
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setIsEditing(false)} className="cancel-btn">
                <X size={18} />
                Cancel
              </button>
              <button onClick={handleDelete} disabled={saving} className="delete-btn">
                <Trash2 size={18} />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isOwner) {
    return (
      <div className="listing-detail">
        <button onClick={() => navigate('/listings')} className="back-btn">
          <ArrowLeft size={20} />
          Back to Listings
        </button>

        <div className="detail-card admin-card">
          {renderImageGallery()}
          <div className="detail-header admin-header">
            <div>
              <div className="detail-title-section">
                <h1>{listing.title}</h1>
                <div className="detail-society-row">
                  <p className="detail-society">{listing.societyName}</p>
                  {listing.societyType && (
                    <span className="society-type-badge">{listing.societyType}</span>
                  )}
                </div>
                <p className="detail-posted">Posted on {eventDate}</p>
              </div>
            </div>
            <button onClick={() => setIsEditing(true)} className="edit-btn">
              <Edit2 size={18} />
              Edit
            </button>
          </div>

          <div className="detail-info-grid">
            <div className="info-item">
              <Calendar size={24} />
              <div>
                <label>Date</label>
                <p>{eventDate}</p>
              </div>
            </div>
            <div className="info-item">
              <Users size={24} />
              <div>
                <label>Attendance</label>
                <p>{listing.peopleNeeded} people</p>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h2>About This Event</h2>
            <p className="detail-description">{listing.description}</p>
          </div>

          <div className="detail-section">
            <h2>Event Type</h2>
            <div className="detail-tags">
              {listing.tags.map(tag => (
                <span key={tag} className="detail-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
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

  console.log('Rendering public view for listing:', listing?.id);
  return (
    <div className="listing-detail">
      <button onClick={() => navigate('/listings')} className="back-btn">
        <ArrowLeft size={20} />
        Back to Listings
      </button>

      <div className="detail-card">
        {renderImageGallery()}

        <div className="detail-header">
          <div className="detail-title-section">
            <h1>{listing.title}</h1>
            <div className="detail-society-row">
              <p className="detail-society">{listing.societyName}</p>
              {listing.societyType && (
                <span className="society-type-badge">{listing.societyType}</span>
              )}
            </div>
            <p className="detail-posted">Posted on {eventDate}</p>
          </div>
        </div>

        <div className="detail-info-grid">
          <div className="info-item">
            <Calendar size={24} />
            <div>
              <label>Date</label>
              <p>{eventDate}</p>
            </div>
          </div>
          <div className="info-item">
            <Users size={24} />
            <div>
              <label>Attendance</label>
              <p>{listing.peopleNeeded} people</p>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h2>About This Event</h2>
          <p className="detail-description">{listing.description}</p>
        </div>

        <div className="detail-section">
          <h2>Event Type</h2>
          <div className="detail-tags">
            {listing.tags.map(tag => (
              <span key={tag} className="detail-tag">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="detail-section">
          <h2>Interested?</h2>
          <p className="detail-cta-text">
            Contact {listing.societyName} to express your interest in collaborating on this event!
          </p>
          <button className="cta-btn">
            Express Interest
          </button>
        </div>
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
