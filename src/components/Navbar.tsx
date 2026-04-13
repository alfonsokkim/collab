import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Handshake, LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const societyName = user?.user_metadata?.society_name || 'My Society';

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <Handshake size={28} />
          <span className="brand-text">Collab</span>
        </Link>
        <div className="navbar-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/profile" className="nav-link">Profile</Link>
          <Link to="/listings" className="nav-link">Listings</Link>
          <Link to="/history" className="nav-link">History</Link>
          {user ? (
            <div
              className="user-menu"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button className="user-btn">
                <span>{societyName}</span>
                <ChevronDown size={16} />
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <button onClick={handleProfileClick} className="dropdown-item">
                    <UserIcon size={16} />
                    Profile
                  </button>
                  <button onClick={handleLogout} className="dropdown-item logout-item">
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="nav-btn">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
