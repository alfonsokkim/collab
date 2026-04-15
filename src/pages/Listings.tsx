import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wine, Briefcase, Waves, Globe, Calendar, Users, Search, X } from 'lucide-react';
import { fetchListings } from '../services/listingService';
import { SOCIETY_TYPES } from '../services/societyService';
import '../styles/Listings.css';

interface Listing {
  id: number;
  title: string;
  society: string;
  societyType?: string;
  description: string;
  date: string;
  peopleNeeded: number;
  icon: React.ComponentType<{ size: number; strokeWidth?: number }>;
  bannerImage?: string;
  tags: string[];
}

const tagToIconMap: { [key: string]: React.ComponentType<{ size: number; strokeWidth?: number }> } = {
  Social: Wine,
  Events: Wine,
  Pubcrawl: Wine,
  Tech: Briefcase,
  Networking: Briefcase,
  Workshop: Briefcase,
  Sports: Waves,
  Outdoor: Waves,
  Competition: Waves,
  Culture: Globe,
  Festival: Globe,
  Community: Globe,
};

const EVENT_TYPES = ['Social', 'Networking', 'Workshop', 'Sports', 'Cultural', 'Tech', 'Festival', 'Charity'];

export function Listings() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [selectedSocietyTypes, setSelectedSocietyTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadListings = async () => {
      try {
        setLoading(true);
        const dbListings = await fetchListings();
        const mappedListings: Listing[] = dbListings.map(listing => {
          const icon = listing.tags.map(tag => tagToIconMap[tag]).find(Boolean) || Wine;
          return {
            id: listing.id as unknown as number,
            title: listing.title,
            society: listing.societyName,
            societyType: listing.societyType,
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

  const filteredListings = listings.filter(listing => {
    const matchesEventType = selectedEventTypes.length === 0 || selectedEventTypes.some(t => listing.tags.includes(t));
    const matchesSocietyType = selectedSocietyTypes.length === 0 || (listing.societyType && selectedSocietyTypes.includes(listing.societyType));
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || listing.title.toLowerCase().includes(q) || listing.society.toLowerCase().includes(q) || listing.description.toLowerCase().includes(q);
    return matchesEventType && matchesSocietyType && matchesSearch;
  });

  const toggleEventType = (tag: string) => {
    setSelectedEventTypes(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const toggleSocietyType = (type: string) => {
    setSelectedSocietyTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const hasFilters = selectedEventTypes.length > 0 || selectedSocietyTypes.length > 0 || searchQuery;

  return (
    <div className="listings">
      <div className="listings-header">
        <h1>Event Listings</h1>
        <p>Find societies to collaborate with and create amazing events together</p>
      </div>

      <div className="listings-layout">
        <aside className="listings-sidebar">
          <div className="sidebar-section">
            <h3>Event Type</h3>
            <div className="tag-list">
              {EVENT_TYPES.map(tag => (
                <button
                  key={tag}
                  className={`tag ${selectedEventTypes.includes(tag) ? 'active' : ''}`}
                  onClick={() => toggleEventType(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Society Type</h3>
            <div className="tag-list">
              {SOCIETY_TYPES.map(type => (
                <button
                  key={type}
                  className={`tag ${selectedSocietyTypes.includes(type) ? 'active' : ''}`}
                  onClick={() => toggleSocietyType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {hasFilters && (
            <button
              className="reset-btn"
              onClick={() => { setSelectedEventTypes([]); setSelectedSocietyTypes([]); setSearchQuery(''); }}
            >
              <X size={13} /> Clear All
            </button>
          )}
        </aside>

        <main className="listings-main">
          <div className="listings-search">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="listings-count">
            Showing {filteredListings.length} listing{filteredListings.length !== 1 ? 's' : ''}
          </div>

          {loading ? (
            <div className="listings-loading">Loading listings...</div>
          ) : (
            <div className="listing-cards">
              {filteredListings.map(listing => {
                const IconComponent = listing.icon;
                return (
                  <div key={listing.id} className="listing-card" onClick={() => navigate(`/listings/${listing.id}`)}>
                    <div className="card-thumbnail">
                      {listing.bannerImage ? (
                        <img src={listing.bannerImage} alt={listing.title} />
                      ) : (
                        <div className="card-thumbnail-placeholder">
                          <IconComponent size={36} strokeWidth={1.25} />
                        </div>
                      )}
                    </div>
                    <div className="card-body">
                      <div className="card-body-top">
                        <div>
                          <h3>{listing.title}</h3>
                          <p className="card-society">
                            {listing.society}
                            {listing.societyType && (
                              <span className="card-society-type">{listing.societyType}</span>
                            )}
                          </p>
                        </div>
                        <div className="card-tags">
                          {listing.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="card-tag">{tag}</span>
                          ))}
                        </div>
                      </div>
                      <p className="card-description">{listing.description}</p>
                      <div className="card-meta">
                        <div className="meta-item">
                          <span className="meta-label"><Calendar size={13} /> Date</span>
                          <span>{listing.date}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label"><Users size={13} /> Need</span>
                          <span>{listing.peopleNeeded} people</span>
                        </div>
                      </div>
                    </div>
                    <div className="card-cta-col">
                      <button className="card-cta" onClick={(e) => { e.stopPropagation(); navigate(`/listings/${listing.id}`); }}>
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
