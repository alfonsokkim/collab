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
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
        <Route path="/create-listing" element={<CreateListing />} />
        <Route path="/history" element={<History />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
