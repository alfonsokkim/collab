import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Handshake, LogOut, Menu, User as UserIcon, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const societyName = user?.user_metadata?.society_name || 'My Society';

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const navLinkClass =
    'rounded-md px-3 py-2 text-sm font-medium text-white/65 transition hover:bg-white/8 hover:text-white';

  return (
    <nav className="sticky top-0 z-[1000] border-b border-white/6 bg-[var(--dark)]">
      <div className="mx-auto flex h-[60px] w-full max-w-[1200px] items-center justify-between px-4 md:px-7">
        <Link to="/" className="flex items-center gap-2.5 text-white transition hover:opacity-85">
          <Handshake size={28} className="text-[var(--primary)]" />
          <span className="font-[var(--heading)] text-[20px] font-bold tracking-[-0.3px] text-white">
            Collab
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <Link to="/" className={navLinkClass}>Home</Link>
          <Link to="/profile" className={navLinkClass}>Profile</Link>
          <Link to="/listings" className={navLinkClass}>Listings</Link>
          <Link to="/history" className={navLinkClass}>History</Link>

          {user ? (
            <div
              className="relative ml-2 after:absolute after:left-0 after:right-0 after:top-full after:h-2 after:content-['']"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button className="flex items-center gap-2 whitespace-nowrap rounded-md border border-white/12 bg-white/10 px-3.5 py-[7px] text-sm font-medium text-white transition hover:bg-white/15">
                <span>{societyName}</span>
                <ChevronDown size={16} className="opacity-70" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-[1000] min-w-[190px] overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-white shadow-[var(--shadow-lg)]">
                  <button
                    onClick={() => navigate('/profile')}
                    className="flex w-full items-center gap-2.5 bg-transparent px-4 py-[11px] text-left text-sm font-medium text-[var(--text)] transition hover:bg-[var(--bg-light)]"
                  >
                    <UserIcon size={16} className="shrink-0 text-[var(--text-light)]" />
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 border-t border-[var(--border-light)] bg-transparent px-4 py-[11px] text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut size={16} className="shrink-0 text-red-600" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="ml-2 inline-flex items-center rounded-md bg-[var(--primary)] px-[18px] py-2 text-sm font-semibold text-white transition hover:bg-[var(--primary-dark)]"
            >
              Login
            </Link>
          )}
        </div>

        <button
          className="inline-flex items-center justify-center rounded-md p-2 text-white transition hover:bg-white/10 md:hidden"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-b border-white/6 bg-[var(--dark-surface)] px-4 pb-4 pt-3 md:hidden">
          <div className="flex flex-col gap-1">
            {[
              ['/', 'Home'],
              ['/profile', 'Profile'],
              ['/listings', 'Listings'],
              ['/history', 'History'],
            ].map(([href, label]) => (
              <Link
                key={href}
                to={href}
                className="rounded-md px-3 py-3 text-[15px] font-medium text-white/80 transition hover:bg-white/8 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                {label}
              </Link>
            ))}

            {user ? (
              <>
                <button
                  onClick={() => {
                    navigate('/profile');
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-md bg-transparent px-3 py-3 text-left text-[15px] font-medium text-white/80 transition hover:bg-white/8 hover:text-white"
                >
                  <UserIcon size={16} />
                  {societyName}
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    'mt-2 flex w-full items-center gap-3 border-t border-white/8 bg-transparent px-3 pt-3 text-left text-[15px] font-medium text-red-300 transition hover:bg-white/8',
                  )}
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-md px-3 py-3 text-[15px] font-medium text-white/80 transition hover:bg-white/8 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
