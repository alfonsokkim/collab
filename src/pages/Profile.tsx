import { useState, useEffect, useRef } from 'react';
import { Mail, Users, Edit2, Save, X, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getSocietyProfile, saveSocietyProfile, type SocietyProfile } from '../services/societyService';
import instagramIcon from '../assets/instagram-icon.svg';
import discordIcon from '../assets/discord-icon.svg';
import facebookIcon from '../assets/facebook-icon.svg';
import linkedinIcon from '../assets/linkedin-icon.svg';
import '../styles/Profile.css';

export function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [logoImage, setLogoImage] = useState<string | null>(null);
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

  // Load profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const profile = await getSocietyProfile(user.id);
        if (profile) {
          setSociety(profile);
          setEditForm(profile);
          setLogoImage(profile.logoImageUrl || null);
        } else {
          // New user - pre-fill with society name from signup
          const defaultName = user.user_metadata?.society_name || '';
          setSociety({ ...society, name: defaultName });
          setEditForm({ ...editForm, name: defaultName });
        }
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
          setLogoImage(base64);
          setEditForm({ ...editForm, logoImageUrl: base64 });
          setError('');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const removeLogoImage = () => {
    setLogoImage(null);
    setEditForm({ ...editForm, logoImageUrl: undefined });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      <div className="profile">
        <div className="profile-loading">Loading profile...</div>
      </div>
    );
  }

  const displaySociety = isEditing ? editForm : society;

  return (
    <div className="profile">
      <div className="profile-header">
        {logoImage || society.logoImageUrl ? (
          <div className="profile-avatar-image">
            <img src={logoImage || society.logoImageUrl} alt="Society logo" />
          </div>
        ) : (
          <div className="profile-avatar">
            <Users size={64} strokeWidth={1.5} />
          </div>
        )}
        <div className="profile-info">
          {isEditing ? (
            <div className="profile-form-group">
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Society Name"
                className="profile-name-input"
              />
            </div>
          ) : (
            <h1>{displaySociety.name || 'My Society'}</h1>
          )}

          {isEditing ? (
            <textarea
              value={editForm.description || ''}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder="Society description..."
              className="profile-description-input"
              rows={3}
            />
          ) : (
            <p className="profile-description">
              {displaySociety.description || 'No description yet'}
            </p>
          )}

          {!isEditing && (
            <div className="profile-stats">
              <div className="stat">
                <strong>{displaySociety.membersCount || 0}</strong>
                <span>Members</span>
              </div>
              <div className="stat">
                <strong>Since {displaySociety.foundedYear || new Date().getFullYear()}</strong>
                <span>Founded</span>
              </div>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="profile-actions">
            <button onClick={handleSave} disabled={saving} className="save-btn">
              <Save size={18} />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => setIsEditing(false)} className="cancel-btn">
              <X size={18} />
            </button>
          </div>
        ) : (
          <button onClick={() => setIsEditing(true)} className="edit-btn">
            <Edit2 size={18} />
            Edit Profile
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="profile-content">
        {isEditing && (
          <section className="profile-section">
            <h2>Profile Photo</h2>
            {logoImage || society.logoImageUrl ? (
              <div className="logo-preview">
                <img src={logoImage || society.logoImageUrl} alt="Logo" />
                <button
                  type="button"
                  onClick={removeLogoImage}
                  className="remove-logo-btn"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="image-upload-area">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="upload-btn"
                >
                  <ImageIcon size={32} />
                  <span>Click to upload society logo</span>
                </button>
              </div>
            )}
          </section>
        )}

        {isEditing && (
          <section className="profile-section">
            <h2>Additional Info</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Members</label>
                <input
                  type="number"
                  value={editForm.membersCount || 0}
                  onChange={(e) => setEditForm({ ...editForm, membersCount: parseInt(e.target.value) })}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Founded Year</label>
                <input
                  type="number"
                  value={editForm.foundedYear || new Date().getFullYear()}
                  onChange={(e) => setEditForm({ ...editForm, foundedYear: parseInt(e.target.value) })}
                  min="2000"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>
          </section>
        )}

        <section className="profile-section">
          <h2>Quick Links</h2>
          <div className="quick-links">
            <a href="/listings" className="link-btn">
              View My Listings
            </a>
            <a href="/history" className="link-btn">
              View History
            </a>
            <a href="/create-listing" className="link-btn">
              Create New Event
            </a>
          </div>
        </section>

        <section className="profile-section">
          <h2>Contact</h2>
          <div className="contact-section">
            <div className="contact-item">
              <Mail size={20} strokeWidth={2} />
              <span>{user?.email || 'No email'}</span>
            </div>

            {isEditing ? (
              <div className="social-form">
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
                    placeholder="Your Society Name"
                  />
                </div>
              </div>
            ) : (
              <div className="social-links">
                {displaySociety.instagram && (
                  <div className="social-item">
                    <img src={instagramIcon} alt="Instagram" className="social-icon" />
                    <span>{displaySociety.instagram}</span>
                  </div>
                )}
                {displaySociety.discordUrl && (
                  <div className="social-item">
                    <img src={discordIcon} alt="Discord" className="social-icon" />
                    <a href={displaySociety.discordUrl} target="_blank" rel="noopener noreferrer">
                      Join Discord
                    </a>
                  </div>
                )}
                {displaySociety.facebook && (
                  <div className="social-item">
                    <img src={facebookIcon} alt="Facebook" className="social-icon" />
                    <span>{displaySociety.facebook}</span>
                  </div>
                )}
                {displaySociety.linkedin && (
                  <div className="social-item">
                    <img src={linkedinIcon} alt="LinkedIn" className="social-icon" />
                    <span>{displaySociety.linkedin}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
