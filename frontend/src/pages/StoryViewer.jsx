import { useEffect, useState } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { storiesApi } from "../api/client";
import { profilePath } from "../utils/profilePath";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import CreativeLoader from "../components/CreativeLoader";

function timeAgo(dateInput) {
  if (!dateInput) return 'now';
  const parsed = dateInput.includes('T') ? new Date(dateInput) : new Date(dateInput.replace(' ', 'T') + 'Z');
  const seconds = Math.floor((Date.now() - parsed.getTime()) / 1000);
  if (seconds < 60) return `${Math.max(1, seconds)}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function StoryViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const toast = useToast();
  const [stories, setStories] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    let timeout;
    if (showControls) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [showControls, progress]);

  useEffect(() => {
    storiesApi
      .list()
      .then((res) => {
        const mapped = (res.data || []).map((s) => ({
          id: s.id,
          brandId: s.brandId,
          brandName: s.brandName,
          authorId: s.authorId,
          authorUsername: s.authorUsername,
          avatar: s.avatar,
          mediaUrl: s.mediaUrl,
          caption: s.caption,
          expiresAt: s.expiresAt ? new Date(s.expiresAt).getTime() : Date.now() + 1000 * 60 * 60 * 20,
          createdAt: s.createdAt,
          seen: s.seen,
          duration: s.duration || 5, // Default 5s per story
          liked: s.liked,
          likesCount: s.likesCount,
        }));
        
        // Group by brandId
        const grouped = {};
        mapped.forEach(s => {
          if (!grouped[s.brandId]) grouped[s.brandId] = [];
          grouped[s.brandId].push(s);
        });
        
        // Sort groups by newest story, then inside group oldest first
        const groupArray = Object.values(grouped).sort((a, b) => b[0].createdAt.localeCompare(a[0].createdAt));
        groupArray.forEach(group => group.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
        
        let finalStories = groupArray.flat();
        if (location.state?.fromProfile) {
          const targetStory = finalStories.find(st => String(st.id) === String(id));
          if (targetStory) {
            finalStories = finalStories.filter(s => s.brandId === targetStory.brandId);
          }
        }
        
        setStories(finalStories);
      })
      .catch(() => setStories([]))
      .finally(() => setStoriesLoading(false));
  }, []);

  const idx = stories.findIndex((s) => String(s.id) === String(id));
  const story = stories[idx];
  const authorStories = story ? stories.filter(s => s.brandId === story.brandId) : [];
  const localIdx = authorStories.findIndex((s) => String(s.id) === String(id));

  useEffect(() => {
    if (!story || isPaused) return;
    const tick = 100; // ms
    const increment = (tick / (story.duration * 1000)) * 100;
    
    const iv = setInterval(() => {
      setProgress((p) => {
        const next = p + increment;
        if (next >= 100) {
          clearInterval(iv);
          const nextStory = stories[idx + 1];
          if (nextStory && nextStory.expiresAt > Date.now()) {
            navigate(`/stories/${nextStory.id}`, { replace: true, state: location.state });
          } else {
            navigate(-1);
          }
          return 0; // Reset for next
        }
        return next;
      });
    }, tick);
    return () => clearInterval(iv);
  }, [id, story, stories, idx, navigate, isPaused]);

  useEffect(() => {
    setProgress(0);
  }, [id]);

  useEffect(() => {
    if (story && user && !story.seen) {
      storiesApi.markSeen(story.id).catch(() => {});
      setStories((prev) => prev.map((s) => (String(s.id) === String(id) ? { ...s, seen: true } : s)));
    }
  }, [id, story, user]);

  const handleInquire = async () => {
    if (!user) {
      toast.error("Log in to inquire.");
      return;
    }
    const msg = prompt("Send an inquiry message:");
    if (!msg) return;
    
    setIsPaused(true);
    try {
      // In a real app we'd use inboxApi to inquire on the story_id
      // but inboxApi might not be fully wired up for story_id in frontend yet.
      // Assuming api/client.js handles it if we pass story_id.
      // We will just do a standard fetch.
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ story_id: story.id, message: msg })
      });
      const data = await res.json();
      if (res.ok) {
        navigate(`/messages/${data.conversation.id}`);
      } else {
        toast.error(data.message || 'Failed to send inquiry');
      }
    } catch (e) {
      toast.error('Failed to send inquiry');
    }
    setIsPaused(false);
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) return toast.error("Log in to like stories.");
    const originalStories = [...stories];
    setStories(prev => prev.map(s => String(s.id) === String(id) ? { 
      ...s, 
      liked: !s.liked, 
      likesCount: s.liked ? Math.max(0, s.likesCount - 1) : (s.likesCount + 1)
    } : s));
    
    try {
      const res = await fetch(`/api/stories/${id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
      if (!res.ok) throw new Error("Failed to like");
    } catch (err) {
      setStories(originalStories);
    }
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    const prev = stories[idx - 1]; 
    if (prev) navigate(`/stories/${prev.id}`, { replace: true, state: location.state }); 
  };
  
  const handleNext = (e) => {
    e.stopPropagation();
    const nxt = stories[idx + 1]; 
    if (nxt) navigate(`/stories/${nxt.id}`, { replace: true, state: location.state }); 
    else navigate(-1);
  };

  if (storiesLoading) return <CreativeLoader text="Loading story..." fullScreen={true} />;
  if (stories.length > 0 && !story) return <div className="grid place-items-center h-[100dvh] bg-black text-white">Story not found or expired.</div>;
  if (!story) return <div className="grid place-items-center h-[100dvh] bg-black text-white">No stories found.</div>;

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1121] flex flex-col items-center select-none">
      <div className="absolute top-0 left-0 right-0 z-50 w-full max-w-md mx-auto pointer-events-none">
        <div className="flex gap-1 px-2 pt-2 pointer-events-auto">
          {authorStories.map((s, i) => (
            <div key={s.id} className="h-1 flex-1 bg-surface/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[var(--color-action)] to-[var(--color-accent)] transition-all ease-linear" 
                style={{ 
                  width: i < localIdx ? '100%' : i === localIdx ? `${progress}%` : '0%',
                  transitionDuration: i === localIdx && !isPaused ? '100ms' : '0ms'
                }} 
              />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-white pointer-events-auto">
          <div 
            onClick={(e) => { e.stopPropagation(); navigate(profilePath({ username: story.authorUsername, authorId: story.authorId || story.brandId, brandId: story.brandId })); }} 
            className="flex items-center gap-2 drop-shadow-md z-20 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img src={story.avatar} alt={story.brandName} className="w-8 h-8 rounded-full border border-white/50" />
            <span className="text-sm font-semibold hover:underline">{story.brandName}</span>
            <span className="text-xs text-white/80">· {timeAgo(story.createdAt)}</span>
          </div>
          <button onClick={(e) => { e.stopPropagation(); navigate(-1); }} className="w-8 h-8 grid place-items-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors z-20 cursor-pointer">×</button>
        </div>
      </div>

      <div 
        className="relative flex-1 w-full max-w-md mx-auto flex items-center justify-center bg-black overflow-hidden group"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => { setIsPaused(false); setShowControls(false); }}
        onTouchStart={() => { setIsPaused(true); setShowControls(true); }}
        onTouchEnd={() => setIsPaused(false)}
        onMouseMove={() => setShowControls(true)}
      >
        {story.mediaUrl?.endsWith('.mp4') || story.duration > 5 ? (
          <video src={story.mediaUrl} className="w-full h-full object-cover" autoPlay playsInline muted={false} onEnded={handleNext} />
        ) : (
          <img src={story.mediaUrl} alt={story.caption} className="w-full h-full object-cover" />
        )}
        
        {/* Navigation Buttons */}
        <div className={`absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 transition-opacity duration-300 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <button 
            onClick={handlePrev} 
            className="w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors backdrop-blur-sm shadow-lg disabled:opacity-0"
            disabled={idx === 0}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button 
            onClick={handleNext} 
            className="w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors backdrop-blur-sm shadow-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        
        {/* Invisible Click Zones for Mobile */}
        <div className="absolute inset-y-0 left-0 w-1/3 z-0" onClick={handlePrev} />
        <div className="absolute inset-y-0 right-0 w-1/3 z-0" onClick={handleNext} />
        
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-20">
          <div className="flex gap-4 items-end mb-4">
            <div className="flex-1">
              <p className="text-white text-sm drop-shadow-md">{story.caption}</p>
            </div>
            <button 
              onClick={handleLike} 
              className="flex flex-col items-center gap-1 group z-20 transition-transform active:scale-75"
            >
              <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white transition-colors hover:bg-black/60">
                <svg className={`w-5 h-5 transition-colors ${story.liked ? 'text-red-500 fill-red-500' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="text-white text-xs drop-shadow-md font-medium">{story.likesCount || ''}</span>
            </button>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); handleInquire(); }}
            className={`w-full py-3 rounded-full bg-[var(--color-action)]/90 hover:bg-[var(--color-action)] text-white font-semibold backdrop-blur-sm transition-all duration-300 text-sm relative z-20 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
          >
            Inquire about this
          </button>
        </div>
      </div>
    </div>
  );
}
