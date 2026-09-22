import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { storiesApi } from "../api/client";
import { useAuth } from "../context/AuthContext";

function timeAgo(dateInput) {
  if (!dateInput) return 'now';
  const seconds = Math.floor((new Date() - new Date(dateInput)) / 1000);
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
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    storiesApi
      .list()
      .then((res) => {
        const mapped = (res.data || []).map((s) => ({
          id: s.id,
          brandId: s.brandId,
          brandName: s.brandName,
          avatar: s.avatar,
          mediaUrl: s.mediaUrl,
          caption: s.caption,
          expiresAt: s.expiresAt ? new Date(s.expiresAt).getTime() : Date.now() + 1000 * 60 * 60 * 20,
          createdAt: s.createdAt,
          seen: s.seen,
          duration: s.duration || 5, // Default 5s per story
        }));
        setStories(mapped);
      })
      .catch(() => setStories([]));
  }, []);

  const idx = stories.findIndex((s) => String(s.id) === String(id));
  const story = stories[idx];

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
            navigate(`/stories/${nextStory.id}`, { replace: true });
          } else {
            navigate("/feed", { replace: true });
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
      alert("Log in to inquire.");
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
        alert(data.message || 'Failed to send inquiry');
      }
    } catch (e) {
      alert('Failed to send inquiry');
    }
    setIsPaused(false);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    const prev = stories[idx - 1]; 
    if (prev) navigate(`/stories/${prev.id}`, { replace: true }); 
  };
  
  const handleNext = (e) => {
    e.stopPropagation();
    const nxt = stories[idx + 1]; 
    if (nxt) navigate(`/stories/${nxt.id}`, { replace: true }); 
    else navigate("/feed");
  };

  if (stories.length > 0 && !story) return <div className="grid place-items-center h-[100dvh] bg-black text-white">Story not found or expired.</div>;
  if (!story) return <div className="grid place-items-center h-[100dvh] bg-black text-text-secondary">Loading story...</div>;

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1121] flex flex-col items-center select-none">
      <div className="absolute top-0 left-0 right-0 z-10 w-full max-w-md mx-auto">
        <div className="flex gap-1 px-2 pt-2">
          {stories.map((s, i) => (
            <div key={s.id} className="h-1 flex-1 bg-surface/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[var(--color-action)] to-[var(--color-accent)] transition-all ease-linear" 
                style={{ 
                  width: i < idx ? '100%' : i === idx ? `${progress}%` : '0%',
                  transitionDuration: i === idx && !isPaused ? '100ms' : '0ms'
                }} 
              />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-white">
          <div className="flex items-center gap-2 drop-shadow-md">
            <Link to={`/profile/${story.brandId}`}><img src={story.avatar} alt={story.brandName} className="w-8 h-8 rounded-full border border-white/50" /></Link>
            <Link to={`/profile/${story.brandId}`} className="text-sm font-semibold hover:underline">{story.brandName}</Link>
            <span className="text-xs text-white/80">· {timeAgo(story.createdAt)}</span>
          </div>
          <button onClick={() => navigate(-1)} className="w-8 h-8 grid place-items-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors">×</button>
        </div>
      </div>

      <div 
        className="relative flex-1 w-full max-w-md mx-auto flex items-center justify-center bg-black overflow-hidden"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {story.mediaUrl?.endsWith('.mp4') || story.duration > 5 ? (
          <video src={story.mediaUrl} className="w-full h-full object-cover" autoPlay playsInline muted={false} onEnded={handleNext} />
        ) : (
          <img src={story.mediaUrl} alt={story.caption} className="w-full h-full object-cover" />
        )}
        
        {/* Hover Navigation Buttons */}
        <button onClick={handlePrev} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white opacity-0 hover:opacity-100 md:opacity-100 flex items-center justify-center backdrop-blur-sm transition-opacity">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button onClick={handleNext} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white opacity-0 hover:opacity-100 md:opacity-100 flex items-center justify-center backdrop-blur-sm transition-opacity">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
        </button>
        
        {/* Invisible Click Zones for Mobile */}
        <div className="absolute inset-y-0 left-0 w-1/3 z-0" onClick={handlePrev} />
        <div className="absolute inset-y-0 right-0 w-1/3 z-0" onClick={handleNext} />
        
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-20">
          <p className="text-white text-sm drop-shadow-md mb-4">{story.caption}</p>
          <button 
            onClick={(e) => { e.stopPropagation(); handleInquire(); }}
            className="w-full py-3 rounded-full bg-[var(--color-action)]/90 hover:bg-[var(--color-action)] text-white font-semibold backdrop-blur-sm transition-colors text-sm"
          >
            Inquire about this
          </button>
        </div>
      </div>
    </div>
  );
}
