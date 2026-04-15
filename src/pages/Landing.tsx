import { Link } from 'react-router-dom';
import { Users, Calendar, BarChart3 } from 'lucide-react';
import ncsLogo from '../assets/NCS-logo.png';
import '../styles/Landing.css';

export function Landing() {
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-content">
          <span className="hero-eyebrow">UNSW Society Collaboration</span>
          <h1>Bringing Societies <em>Together</em></h1>
          <p className="hero-subtitle">
            Connect with UNSW societies to co-host events, share resources,
            and build bigger experiences for students.
          </p>
          <div className="hero-buttons">
            <Link to="/listings" className="btn-primary">
              Browse Events
            </Link>
            <Link to="/create-listing" className="btn-secondary">
              Create a Listing
            </Link>
          </div>
        </div>
      </section>

      <div className="hero-divider" />

      <section className="features">
        <p className="features-label">Everything you need to collaborate</p>
        <div className="feature-container">
          <div className="feature-card">
            <div className="feature-icon">
              <Users size={22} />
            </div>
            <h3>Easy Collaboration</h3>
            <p>Connect with other societies to create larger, more exciting events that reach more students.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Calendar size={22} />
            </div>
            <h3>Event Listings</h3>
            <p>Post what you're looking for and find the perfect partner societies for your next event.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <BarChart3 size={22} />
            </div>
            <h3>Track History</h3>
            <p>Keep records of past collaborations and build a reputation as a reliable partner.</p>
          </div>
        </div>
      </section>

      <section className="cta">
        <h2>Ready to Collaborate?</h2>
        <p>Join societies across UNSW and create unforgettable experiences</p>
        <Link to="/listings" className="btn-primary">
          Explore Listings
        </Link>
        <footer className="landing-footer">
          <p>
            cos we couldnt find collabs...  <img src={ncsLogo} alt="No Code Society" className="ncs-logo" />
          </p>
        </footer>
      </section>
    </div>
  );
}
