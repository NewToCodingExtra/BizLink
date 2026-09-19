import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useMemo } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ContactForm from "./components/ContactForm";
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
import Preferences from "./pages/Preferences";
import Contact from "./pages/Contact";

import { opportunitiesSeed } from "./data/opportunities";
import { commentsSeed } from "./data/comments";
import { storiesSeed } from "./data/stories";
import { conversationsSeed, messagesSeed, notificationsSeed } from "./data/conversations";

export default function App() {
  const [opportunities, setOpportunities] = useState(opportunitiesSeed);
  const [comments, setComments] = useState(commentsSeed);
  const [stories, setStories] = useState(storiesSeed);
  const [conversations, setConversations] = useState(conversationsSeed);
  const [messages, setMessages] = useState(messagesSeed);
  const [notifications, setNotifications] = useState(notificationsSeed);
  const [savedIds, setSavedIds] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [preferences, setPreferences] = useState({ categories: [], budgetMin: "", budgetMax: "" });
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // auto-sort bonus derived from preferences – scored array
  const scoredOpportunities = useMemo(() => {
    if (preferences.categories.length===0) return opportunities;
    return [...opportunities].sort((a,b) => {
      const aScore = preferences.categories.includes(a.category) ? 1 : 0;
      const bScore = preferences.categories.includes(b.category) ? 1 : 0;
      return bScore - aScore;
    });
  }, [opportunities, preferences]);

  const onToggleLike = (id) => {
    setOpportunities(prev => prev.map(o => o.id===id ? { ...o, liked: !o.liked, likes: o.liked ? o.likes-1 : o.likes+1 } : o));
  };
  const onToggleSave = (id) => {
    setSavedIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
  };
  const onAddComment = (c) => {
    setComments(prev => [...prev, c]);
    // simulated notification
    setNotifications(prev => [{ id:`n-${Date.now()}`, type:"comment", message:`New comment on ${c.postId}`, read:false, timestamp:"now" }, ...prev]);
  };
  const onInquire = (opp) => {
    setSelectedPost(opp);
    setIsModalOpen(true);
  };
  const handleInquirySubmit = ({ name, email, message, source }) => {
    // create or reuse conversation
    const existing = conversations.find(c => c.with===source.brandName);
    if (existing) {
      setMessages(prev => [...prev, { id:`m-${Date.now()}`, conversationId: existing.id, from:"me", text: `Inquiry: ${message}`, time: "now" }]);
      setConversations(prev => prev.map(c => c.id===existing.id ? {...c, lastMessage: message, unread: 0} : c));
    } else {
      const newId = `conv-${Date.now()}`;
      setConversations(prev => [{ id:newId, with: source.brandName, avatar: source.brandAvatar, lastMessage: message, unread:0, brandId: source.brandId }, ...prev]);
      setMessages(prev => [...prev, { id:`m-${Date.now()}`, conversationId: newId, from:"me", text: `Inquiry: ${message}`, time:"now" }]);
    }
    setNotifications(prev => [{ id:`n-${Date.now()}`, type:"inquiry", message:`You inquired on ${source.headline}`, read:false, timestamp:"now" }, ...prev]);
  };
  const onCreate = (post) => {
    setOpportunities(prev => [post, ...prev]);
    setNotifications(prev => [{ id:`n-${Date.now()}`, type:"new_post", message:`Your opportunity "${post.headline}" is live on the feed`, read:false, timestamp:"now"}, ...prev]);
  };
  const onSend = (conversationId, text) => {
    setMessages(prev => [...prev, { id:`m-${Date.now()}`, conversationId, from:"me", text, time:"now"}]);
    setConversations(prev => prev.map(c=> c.id===conversationId ? {...c, lastMessage: text} : c));
  };
  const onMarkRead = (id) => {
    setNotifications(prev => prev.map(n => n.id===id ? {...n, read:true} : n));
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
        <Navbar notifications={notifications} onMarkRead={onMarkRead} />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={
              <HomeFeed opportunities={scoredOpportunities} comments={comments} stories={stories} activeFilter={activeFilter} setActiveFilter={setActiveFilter} savedIds={savedIds} onToggleLike={onToggleLike} onToggleSave={onToggleSave} onAddComment={onAddComment} onInquire={onInquire} />
            } />
            <Route path="/about" element={<About />} />
            <Route path="/reels" element={<Reels opportunities={opportunities} onToggleLike={onToggleLike} onInquire={onInquire} />} />
            <Route path="/stories/:id" element={<StoryViewer stories={stories} setStories={setStories} />} />
            <Route path="/search" element={<Search opportunities={opportunities} comments={comments} savedIds={savedIds} onToggleLike={onToggleLike} onToggleSave={onToggleSave} onAddComment={onAddComment} onInquire={onInquire} />} />
            <Route path="/post/:id" element={<OpportunityDetail opportunities={opportunities} comments={comments} savedIds={savedIds} onToggleLike={onToggleLike} onToggleSave={onToggleSave} onAddComment={onAddComment} onInquire={onInquire} />} />
            <Route path="/create" element={<CreateOpportunity onCreate={onCreate} />} />
            <Route path="/messages" element={<MessagesInbox conversations={conversations} />} />
            <Route path="/messages/:conversationId" element={<MessageThread conversations={conversations} messages={messages} onSend={onSend} />} />
            <Route path="/notifications" element={<NotificationsPage notifications={notifications} onMarkRead={onMarkRead} />} />
            <Route path="/saved" element={<Saved opportunities={opportunities} comments={comments} savedIds={savedIds} onToggleLike={onToggleLike} onToggleSave={onToggleSave} onAddComment={onAddComment} onInquire={onInquire} />} />
            <Route path="/profile/:id" element={<Profile opportunities={opportunities} comments={comments} savedIds={savedIds} onToggleLike={onToggleLike} onToggleSave={onToggleSave} onAddComment={onAddComment} onInquire={onInquire} />} />
            <Route path="/settings/preferences" element={<Preferences preferences={preferences} setPreferences={setPreferences} />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<div className="max-w-2xl mx-auto py-16 text-center"><p className="text-slate-500">Page not found.</p></div>} />
          </Routes>
        </main>
        <Footer />

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0B1F3A]/60 backdrop-blur-sm" onClick={()=>setIsModalOpen(false)} />
            <div className="relative w-full max-w-lg max-h-[90vh] overflow-auto">
              <ContactForm prefill={selectedPost} onClose={()=>setIsModalOpen(false)} onSubmit={handleInquirySubmit} />
            </div>
          </div>
        )}
      </div>
    </BrowserRouter>
  );
}
