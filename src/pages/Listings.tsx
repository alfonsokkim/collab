import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wine, Briefcase, Waves, Globe, Calendar, Users } from 'lucide-react';
import { fetchListings } from '../services/listingService';
import '../styles/Listings.css';

interface Listing {
  id: number;
  title: string;
  society: string;
  description: string;
  date: string;
  peopleNeeded: number;
  icon: React.ComponentType<{ size: number; strokeWidth?: number }>;
  bannerImage?: string;
  tags: string[];
}

// Mapping of tags to icons for display
const tagToIconMap: { [key: string]: React.ComponentType<{ size: number; strokeWidth?: number }> } = {
  Social: Wine,
  Events: Wine,
  Pubcrawl: Wine,
  Tech: Briefcase,
  Networking: Briefcase,
  Sports: Waves,
  Outdoor: Waves,
  Competition: Waves,
  Culture: Globe,
  Festival: Globe,
  Community: Globe,
};

export function Listings() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    const loadListings = async () => {
      try {
        setLoading(true);
        const dbListings = await fetchListings();
        // Map database listings to Listing interface with appropriate icons
        const mappedListings: Listing[] = dbListings.map(listing => {
          // Find the first tag that has an icon, or default to Wine
          const icon = listing.tags
            .map(tag => tagToIconMap[tag])
            .find(Boolean) || Wine;

          return {
            id: listing.id as unknown as number,
            title: listing.title,
            society: listing.societyName,
            description: listing.description,
            date: new Date(listing.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            peopleNeeded: listing.peopleNeeded,
            icon,
            bannerImage: listing.bannerImageUrl,
            tags: listing.tags,
          };
        });
        setListings(mappedListings);
      } catch (error) {
        console.error('Error loading listings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadListings();
  }, []);

  const allTags = ['Social', 'Events', 'Tech', 'Sports', 'Culture', 'Networking'];

  const filteredListings = selectedTags.length > 0
    ? listings.filter(listing =>
        selectedTags.every(tag => listing.tags.includes(tag))
      )
    : listings;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div className="listings">
      <div className="listings-header">
        <h1>Event Listings</h1>
        <p>Find societies to collaborate with and create amazing events together</p>
      </div>

      <div className="listings-container">
        <aside className="listings-sidebar">
          <h3>Filter by Type</h3>
          <div className="tag-list">
            {allTags.map(tag => (
              <button
                key={tag}
                className={`tag ${selectedTags.includes(tag) ? 'active' : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
          <button className="reset-btn" onClick={() => setSelectedTags([])}>
            Reset Filters
          </button>
        </aside>

        <main className="listings-main">
          {loading ? (
            <div className="listings-loading">
              <p>Loading listings...</p>
            </div>
          ) : (
            <>
              <div className="listings-count">
                Showing {filteredListings.length} listing{filteredListings.length !== 1 ? 's' : ''}
              </div>

              <div className="listing-cards">
            {filteredListings.map(listing => {
              const IconComponent = listing.icon;
              return (
              <div key={listing.id} className="listing-card">
                <div className="card-header">
                  {listing.bannerImage ? (
                    <div className="card-banner">
                      <img src={listing.bannerImage} alt={listing.title} />
                    </div>
                  ) : (
                    <div className="card-avatar">
                      <IconComponent size={36} strokeWidth={1.5} />
                    </div>
                  )}
                  <div className="card-title-section">
                    <h3>{listing.title}</h3>
                    <p className="card-society">{listing.society}</p>
                  </div>
                </div>

                <p className="card-description">{listing.description}</p>

                <div className="card-meta">
                  <div className="meta-item">
                    <span className="meta-label"><Calendar size={16} /> Date:</span>
                    <span>{listing.date}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label"><Users size={16} /> Need:</span>
                    <span>{listing.peopleNeeded} people</span>
                  </div>
                </div>

                <div className="card-tags">
                  {listing.tags.map(tag => (
                    <span key={tag} className="card-tag">
                      {tag}
                    </span>
                  ))}
                </div>

                <button className="card-cta" onClick={() => navigate(`/listings/${listing.id}`)}>View Details</button>
              </div>
            );
            })}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
