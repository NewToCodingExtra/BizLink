import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
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
import CreativeLoader from "./components/CreativeLoader";

function HomeOrLanding() {
  const { user, loading } = useAuth();
  if (loading) {
    return <CreativeLoader text="Loading BizLink..." fullScreen={true} />;
  }
  if (user) {
    return <HomeFeed />;
  }
  return <Landing />;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  const [initialUser] = React.useState(user);

  if (loading) {
    return <CreativeLoader text="Loading..." fullScreen={true} />;
  }
  // Only redirect if they were already logged in when arriving
  if (initialUser) {
    return <Navigate to="/feed" replace />;
  }
  // Once mounted without user, don't auto-unmount when user becomes true.
  // The children (Login, Register, SocialCallback) will handle their own redirect after showing welcome screens.
  return children;
}

import React, { useState, useEffect } from 'react';
import PreferenceOnboardingModal from "./components/PreferenceOnboardingModal";
import CreateStoryModal from "./components/CreateStoryModal";

function GlobalModals() {
  const { user } = useAuth();
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const msg = sessionStorage.getItem('welcome_toast');
    if (msg) {
      setToastMessage(msg);
      sessionStorage.removeItem('welcome_toast');
      setTimeout(() => setToastMessage(""), 4000);
    }
  }, [user]);

  useEffect(() => {
    window.onOpenCreateStory = () => {
      if (!user) {
        alert("Log in to create a story.");
        return;
      }
      setIsStoryModalOpen(true);
    };
    return () => {
      delete window.onOpenCreateStory;
    };
  }, [user]);

  if (!user) return null;
  
  return (
    <>
      <PreferenceOnboardingModal user={user} />
      <CreateStoryModal 
        isOpen={isStoryModalOpen} 
        onClose={() => setIsStoryModalOpen(false)} 
        onComplete={() => {
          // Simplest way to refresh stories globally: reload or trigger event
          window.location.reload(); 
        }}
      />
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] shadow-lg rounded-xl px-5 py-3 flex items-center gap-3 animate-[fade-in_0.3s_ease-out]">
          <span className="text-xl">👋</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </>
  );
}

export const ThemeContext = React.createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

function MainApp() {
  const location = useLocation();
  const background = location.state && location.state.backgroundLocation;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)] flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes location={background || location}>
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
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/settings/preferences" element={<RequireAuth><Preferences /></RequireAuth>} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<div className="max-w-2xl mx-auto py-16 text-center"><p className="text-text-secondary">Page not found.</p></div>} />
        </Routes>
      </main>
      <Footer />
      {background && (
        <Routes>
          <Route path="/stories/:id" element={<StoryViewer />} />
        </Routes>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <ScrollToTop />
            <GlobalModals />
            <MainApp />
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
