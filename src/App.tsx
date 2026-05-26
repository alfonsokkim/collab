import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Landing } from './pages/Landing';
import { Onboarding } from './pages/Onboarding';
import { useAuth } from './contexts/AuthContext';
import { fetchListings, fetchListingsByUserId } from './services/listingService';
import { fetchIncomingRequests } from './services/collabRequestService';
import { getSocietyProfile } from './services/societyService';
import { supabase } from './lib/supabase';
import { Profile } from './pages/Profile';
import { Listings } from './pages/Listings';
import { ListingDetail } from './pages/ListingDetail';
import { History } from './pages/History';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { CreateListing } from './pages/CreateListing';
import { CollabRequests } from './pages/CollabRequests';
import { PublicProfile } from './pages/PublicProfile';
import { Chat } from './pages/Chat';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { ErrorBoundary } from './components/ErrorBoundary';

const BASE_INTERVAL = 300_000;   // 5 min
const MAX_INTERVAL  = 3_600_000; // 1 hour cap

// Returns fetch calls that correspond to the current page, run first on wake
async function prefetchCurrentPage(userId: string | undefined) {
  const path = window.location.pathname;
  if (path === '/listings' || path === '/') {
    await fetchListings();
  } else if (path === '/collab-requests' && userId) {
    await Promise.all([fetchIncomingRequests(), fetchListingsByUserId(userId)]);
  } else if (path === '/profile' && userId) {
    await Promise.all([getSocietyProfile(userId), fetchListingsByUserId(userId)]);
  }
}

async function prefetchAll(userId: string | undefined) {
  fetchListings();
  if (userId) {
    fetchIncomingRequests();
    getSocietyProfile(userId);
    fetchListingsByUserId(userId);
  }
}

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    const done = localStorage.getItem(`collab_onboarding:${user.id}`);
    // Only show on pages that aren't login/signup
    const path = window.location.pathname;
    const isAuthPage = path === '/login' || path === '/signup';
    if (!done && !isAuthPage) setShowOnboarding(true);
  }, [user, loading]);

  return (
    <>
      {children}
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
    </>
  );
}

function LandingOrRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/listings" replace />;
  return <Landing />;
}

function App() {
  useEffect(() => {
    let interval = BASE_INTERVAL;
    let timerId: ReturnType<typeof setTimeout>;
    let wasIdle = false;

    const getSession = () =>
      supabase.auth.getSession().then(({ data: { session } }) => session?.user?.id);

    const schedule = () => {
      timerId = setTimeout(async () => {
        interval = Math.min(interval * 2, MAX_INTERVAL);
        wasIdle = true;
        // background refetch even while idle so cache isn't fully stale on return
        const userId = await getSession();
        prefetchAll(userId);
        schedule();
      }, interval);
    };

    const onActivity = async () => {
      if (wasIdle) {
        wasIdle = false;
        clearTimeout(timerId);
        interval = BASE_INTERVAL;
        // prioritise current page first, then fill the rest
        const userId = await getSession();
        await prefetchCurrentPage(userId);
        prefetchAll(userId);
        schedule();
      }
    };

    // initial load
    getSession().then(userId => prefetchAll(userId));
    schedule();

    window.addEventListener('click', onActivity);
    window.addEventListener('keydown', onActivity);

    return () => {
      clearTimeout(timerId);
      window.removeEventListener('click', onActivity);
      window.removeEventListener('keydown', onActivity);
    };
  }, []);

  return (
    <BrowserRouter>
      <OnboardingGate>
      <Navbar />
      <main className="flex-1">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<LandingOrRedirect />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/listings" element={<Listings />} />
            <Route path="/listings/:id" element={<ListingDetail />} />
            <Route path="/create-listing" element={<CreateListing />} />
            <Route path="/history" element={<History />} />
            <Route path="/collab-requests" element={<CollabRequests />} />
            <Route path="/society/:userId" element={<PublicProfile />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
          </Routes>
        </ErrorBoundary>
      </main>
      </OnboardingGate>
    </BrowserRouter>
  );
}

export default App;
