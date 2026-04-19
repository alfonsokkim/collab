import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Landing } from './pages/Landing';
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

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="flex-1">
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
      </main>
    </BrowserRouter>
  );
}

export default App;
