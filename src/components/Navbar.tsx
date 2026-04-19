import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Handshake, LogOut, Menu, MessageSquare, Moon, Sun, User as UserIcon, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchIncomingRequests } from '../services/collabRequestService';
import type { CollabRequest } from '../services/collabRequestService';
import { getTotalUnread } from '../services/chatService';
import { cn } from '../lib/utils';

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return [dark, () => setDark((d) => !d)] as const;
}

function timeAgo(dateStr: string): string {
  const normalized = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z';
  const diff = Date.now() - new Date(normalized).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dark, toggleDark] = useDarkMode();
  const [bellOpen, setBellOpen] = useState(false);
  const [bellSeen, setBellSeen] = useState(false);
  const [recentRequests, setRecentRequests] = useState<CollabRequest[]>([]);
  const [unreadChats, setUnreadChats] = useState(0);
  const bellRef = useRef<HTMLDivElement>(null);

  const societyName = user?.user_metadata?.society_name || 'My Society';
  const pendingCount = recentRequests.filter((r) => r.status === 'pending').length;

  useEffect(() => {
    if (!user) return;
    fetchIncomingRequests().then((reqs) => {
      setRecentRequests(reqs.filter((r) => r.status === 'pending').slice(0, 5));
      setBellSeen(false);
    });
    getTotalUnread().then(setUnreadChats);
  }, [user]);

  useEffect(() => {
    if (location.pathname === '/chat') setUnreadChats(0);
  }, [location.pathname]);

  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bellOpen]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const navLinkClass =
    'rounded-md px-3 py-2 text-sm font-medium text-white/65 transition hover:bg-white/8 hover:text-white';

  return (
    <nav className="sticky top-0 z-[1000] border-b border-white/6 bg-[var(--dark)]">
      {/* Inner container */}
      <div className="mx-auto flex h-[60px] w-full max-w-[1200px] items-center justify-between px-4 md:px-7">
        <Link to="/" className="flex items-center gap-2.5 text-white transition hover:opacity-85">
          <Handshake size={28} className="text-[var(--primary)]" />
          <span className="font-[var(--heading)] text-[20px] font-bold tracking-[-0.3px] text-white">
            Collab
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <Link to="/" className={navLinkClass}>Home</Link>
          <button onClick={() => navigate(user ? '/profile' : '/login')} className={navLinkClass}>Profile</button>
          <Link to="/listings" className={navLinkClass}>Explore</Link>
          <button onClick={() => navigate(user ? '/history' : '/login')} className={navLinkClass}>Listings</button>

          {user && (
            <button
              onClick={() => navigate('/chat')}
              className="relative flex h-9 w-9 items-center justify-center rounded-md text-white/65 transition hover:bg-white/8 hover:text-white"
              aria-label="Messages"
            >
              <MessageSquare size={18} strokeWidth={2} />
              {unreadChats > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-[7px] w-[7px] items-center justify-center rounded-full bg-[var(--primary)]" />
              )}
            </button>
          )}

          {user && (
            <div className="relative ml-1" ref={bellRef}>
              <button
                onClick={() => { setBellOpen((v) => !v); setBellSeen(true); }}
                className="relative flex h-9 w-9 items-center justify-center rounded-md text-white/65 transition hover:bg-white/8 hover:text-white"
                aria-label="Notifications"
              >
                <Bell size={18} strokeWidth={2} />
                {pendingCount > 0 && !bellSeen && (
                  <span className="absolute right-1.5 top-1.5 flex h-[7px] w-[7px] items-center justify-center rounded-full bg-[var(--primary)]" />
                )}
              </button>

              {bellOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-[1000] w-[290px] overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] shadow-[var(--shadow-lg)]">
                  <div className="border-b border-[var(--border-light)] px-4 py-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-light)]">
                      Collab Requests
                    </span>
                  </div>

                  {recentRequests.length === 0 ? (
                    <div className="px-4 py-5 text-center text-sm text-[var(--text-light)]">
                      No pending requests
                    </div>
                  ) : (
                    <div>
                      {recentRequests.map((req) => (
                        <Link
                          key={req.id}
                          to={`/society/${req.fromUserId}`}
                          onClick={() => setBellOpen(false)}
                          className="flex items-start gap-3 border-b border-[var(--border-light)] px-4 py-3 last:border-0 transition hover:bg-[var(--bg-light)]"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary-subtle)] text-[11px] font-bold text-[var(--primary-dark)]">
                            {(req.fromSociety?.name ?? '?')
                              .split(' ')
                              .slice(0, 2)
                              .map((w) => w[0])
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-semibold text-[var(--text)]">
                              {req.fromSociety?.name ?? 'Unknown Society'}
                            </p>
                            <p className="truncate text-[12px] text-[var(--text-light)]">
                              for <span className="text-[var(--text-mid)]">{req.toListing.title}</span>
                            </p>
                            <p className="text-[11px] text-[var(--text-light)] mt-0.5">
                              {timeAgo(req.createdAt)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-[var(--border-light)]">
                    <Link
                      to="/collab-requests"
                      onClick={() => setBellOpen(false)}
                      className="block px-4 py-3 text-center text-[13px] font-medium text-[var(--primary-dark)] transition hover:bg-[var(--primary-subtle)]"
                    >
                      View all requests
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {user ? (
            <div
              className="relative ml-1 after:absolute after:left-0 after:right-0 after:top-full after:h-2 after:content-['']"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button className="flex items-center gap-2 whitespace-nowrap rounded-md border border-white/12 bg-white/10 px-3.5 py-[7px] text-sm font-medium text-white transition hover:bg-white/15">
                <span>{societyName}</span>
                <ChevronDown size={16} className="opacity-70" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-[1000] min-w-[190px] overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] shadow-[var(--shadow-lg)] dark:bg-[var(--bg-light)]">
                  <button
                    onClick={() => navigate('/profile')}
                    className="flex w-full items-center gap-2.5 bg-transparent px-4 py-[11px] text-left text-sm font-medium text-[var(--text)] transition hover:bg-[var(--bg-light)]"
                  >
                    <UserIcon size={16} className="shrink-0 text-[var(--text-light)]" />
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 border-t border-[var(--border-light)] bg-transparent px-4 py-[11px] text-left text-sm font-medium text-red-500 transition hover:bg-red-500/10"
                  >
                    <LogOut size={16} className="shrink-0 text-red-500" />
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

          {/* Dark mode toggle — inline in desktop nav */}
          <button
            onClick={toggleDark}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-md text-white/50 transition hover:bg-white/8 hover:text-white"
          >
            {dark ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="inline-flex items-center justify-center rounded-md p-2 text-white transition hover:bg-white/10 md:hidden"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-b border-white/6 bg-[var(--dark-surface)] px-4 pb-4 pt-3 md:hidden">
          <div className="flex flex-col gap-1">
            {([
              ['/', 'Home', false],
              ['/profile', 'Profile', true],
              ['/listings', 'Explore', false],
              ['/history', 'Listings', true],
              ['/collab-requests', 'Requests', true],
              ['/chat', 'Messages', true],
            ] as [string, string, boolean][]).map(([href, label, requiresAuth]) => (
              <button
                key={href}
                onClick={() => { navigate(requiresAuth && !user ? '/login' : href); setMobileMenuOpen(false); }}
                className="rounded-md px-3 py-3 text-left text-[15px] font-medium text-white/80 transition hover:bg-white/8 hover:text-white"
              >
                {label}
              </button>
            ))}

            {user ? (
              <>
                <button
                  onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}
                  className="flex w-full items-center gap-3 rounded-md bg-transparent px-3 py-3 text-left text-[15px] font-medium text-white/80 transition hover:bg-white/8 hover:text-white"
                >
                  <UserIcon size={16} />
                  {societyName}
                </button>
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
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

            <button
              onClick={toggleDark}
              className="mt-2 flex w-full items-center gap-3 rounded-md border-t border-white/8 bg-transparent px-3 pt-3 text-left text-[15px] font-medium text-white/60 transition hover:bg-white/8 hover:text-white"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
              {dark ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
