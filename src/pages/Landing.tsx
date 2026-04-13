import { Link } from 'react-router-dom';
import { Users, Calendar, BarChart3 } from 'lucide-react';
import ncsLogo from '../assets/NCS-logo.png';
import '../styles/Landing.css';

export function Landing() {
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-content">
          <h1>Bringing Societies Together</h1>
          <p className="hero-subtitle">
            Connect UNSW societies for collaborative events.
            Make bigger, better, more inclusive experiences for students.
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

        <svg className="wave" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path
            d="M0,50 Q300,0 600,50 T1200,50 L1200,120 L0,120 Z"
            fill="white"
          />
        </svg>
      </section>

      <section className="features">
        <div className="feature-container">
          <div className="feature-card">
            <div className="feature-icon">
              <Users size={48} />
            </div>
            <h3>Easy Collaboration</h3>
            <p>Connect with other societies to create larger, more exciting events</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Calendar size={48} />
            </div>
            <h3>Event Listings</h3>
            <p>Post what you're looking for and find the perfect partner societies</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <BarChart3 size={48} />
            </div>
            <h3>Track History</h3>
            <p>Keep records of your past collaborations and successful events</p>
          </div>
        </div>
      </section>

      <section className="cta">
        <h2>Ready to Collaborate?</h2>
        <p>Join societies across UNSW and create unforgettable experiences</p>
        <Link to="/listings" className="btn-primary">
          Explore Listings Today
        </Link>
      <footer className="landing-footer">
        <p>
          made with love by <img src={ncsLogo} alt="No Code Society" className="ncs-logo" /></p>
      </footer>
      </section>
    </div>
  );
}
