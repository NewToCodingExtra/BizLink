import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import { AuthProvider, useAuth } from "./context/AuthContext";
import RequireAuth from "./components/RequireAuth";
import Landing from "./pages/Landing";
import HomeFeed from "./pages/HomeFeed";
import About from "./pages/About";
import Reels from "./pages/Reels";
import StoryViewer from "./pages/StoryViewer";
import Search from "./pages/Search";
import OpportunityDetail from "./pages/OpportunityDetail";
import CreateOpportunity from "./pages/CreateOpportunity";
import MessagesInbox from "./pages/MessagesInbox";
import MessageThread from "./pages/MessageThread";
import NotificationsPage from "./pages/Notifications";
import Saved from "./pages/Saved";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Preferences from "./pages/Preferences";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SocialCallback from "./pages/SocialCallback";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function HomeOrLanding() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <p className="text-sm text-slate-500">Loading BizLink...</p>
      </div>
    );
  }
  if (user) {
    return <HomeFeed />;
  }
  return <Landing />;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }
  if (user) {
    return <Navigate to="/feed" replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomeOrLanding />} />
              <Route path="/welcome" element={<Landing />} />
              <Route path="/feed" element={<HomeFeed />} />
              <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
              <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
              <Route path="/auth/google/callback" element={<SocialCallback />} />
              <Route path="/auth/social/callback" element={<SocialCallback />} />
              <Route path="/forgot-password" element={<GuestOnly><ForgotPassword /></GuestOnly>} />
              <Route path="/reset-password" element={<GuestOnly><ResetPassword /></GuestOnly>} />
              <Route path="/about" element={<About />} />
              <Route path="/reels" element={<Reels />} />
              <Route path="/stories/:id" element={<StoryViewer />} />
              <Route path="/search" element={<Search />} />
              <Route path="/post/:id" element={<OpportunityDetail />} />
              <Route path="/create" element={<RequireAuth><CreateOpportunity /></RequireAuth>} />
              <Route path="/messages" element={<RequireAuth><MessagesInbox /></RequireAuth>} />
              <Route path="/messages/:conversationId" element={<RequireAuth><MessageThread /></RequireAuth>} />
              <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
              <Route path="/saved" element={<RequireAuth><Saved /></RequireAuth>} />
              <Route path="/profile/edit" element={<RequireAuth><EditProfile /></RequireAuth>} />
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="/settings/preferences" element={<RequireAuth><Preferences /></RequireAuth>} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<div className="max-w-2xl mx-auto py-16 text-center"><p className="text-slate-500">Page not found.</p></div>} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
