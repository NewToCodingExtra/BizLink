import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { storiesApi } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function StoryViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [progress, setProgress] = useState(0);

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
          seen: s.seen,
        }));
        setStories(mapped);
      })
      .catch(() => setStories([]));
  }, []);

  const idx = stories.findIndex((s) => String(s.id) === String(id));
  const story = stories[idx];

  useEffect(() => {
    if (!story) return;
    setProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += 2;
      setProgress(p);
      if (p >= 100) {
        clearInterval(iv);
        const next = stories[idx + 1];
        if (next && next.expiresAt > Date.now()) navigate(`/stories/${next.id}`, { replace: true });
        else navigate("/feed", { replace: true });
      }
    }, 100);
    return () => clearInterval(iv);
  }, [id, story, stories, idx, navigate]);

  useEffect(() => {
    if (story && user && !story.seen) {
      storiesApi.markSeen(story.id).catch(() => {});
      setStories((prev) => prev.map((s) => (String(s.id) === String(id) ? { ...s, seen: true } : s)));
    }
  }, [id, story, user]);

  if (stories.length > 0 && !story) return <div className="grid place-items-center h-[60vh] text-white">Story not found or expired.</div>;
  if (!story) return <div className="grid place-items-center h-[60vh] text-slate-500">Loading story...</div>;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="h-1 bg-white/20 w-full"><div className="h-full bg-white transition-all" style={{ width: `${progress}%` }} /></div>
      <div className="flex items-center justify-between px-4 py-3 text-white max-w-md mx-auto w-full">
        <div className="flex items-center gap-2">
          <Link to={`/profile/${story.brandId}`}><img src={story.avatar} alt={story.brandName} className="w-8 h-8 rounded-full" /></Link>
          <Link to={`/profile/${story.brandId}`} className="text-sm font-semibold hover:underline">{story.brandName}</Link>
          <span className="text-xs text-white/60">· now</span>
        </div>
        <button onClick={() => navigate(-1)} className="w-8 h-8 grid place-items-center rounded-full bg-white/10 text-white">×</button>
      </div>
      <div className="flex-1 grid place-items-center p-4">
        <img src={story.mediaUrl} alt={story.caption} className="max-h-[70vh] w-full max-w-md object-cover rounded-2xl" />
      </div>
      <p className="text-center text-white text-sm pb-6 max-w-md mx-auto px-4">{story.caption}</p>
      <div className="absolute inset-0 flex">
        <button className="flex-1" onClick={() => { const prev = stories[idx - 1]; if (prev) navigate(`/stories/${prev.id}`, { replace: true }); }} aria-label="prev" />
        <button className="flex-1" onClick={() => { const nxt = stories[idx + 1]; if (nxt) navigate(`/stories/${nxt.id}`, { replace: true }); else navigate("/feed"); }} aria-label="next" />
      </div>
    </div>
  );
}
