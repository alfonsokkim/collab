import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Landing } from './pages/Landing';
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
      <Navbar />
      <main className="flex-1">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Landing />} />
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
          </Routes>
        </ErrorBoundary>
      </main>
    </BrowserRouter>
  );
}

export default App;
