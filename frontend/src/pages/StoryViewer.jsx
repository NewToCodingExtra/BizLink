import { useCallback, useEffect, useMemo, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { profilePath } from "../utils/profilePath";
import { httpApi } from "../utils/http";
import { useToast } from "../context/ToastContext";
import CreativeLoader from "../Components/CreativeLoader";

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

function currentIdFromPath() {
  if (typeof window === "undefined") return null;
  const m = window.location.pathname.match(/\/stories\/([^/?#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function authorQueryFromUrl() {
  if (typeof window === "undefined") return null;
  try {
    return new URLSearchParams(window.location.search).get("author");
  } catch {
    return null;
  }
}

export default function StoryViewer({ stories: serverStories, id: idProp, storyId, author: authorProp }) {
  const { auth } = usePage().props;
  const user = auth?.user ?? null;
  const toast = useToast();

  const routeId = idProp ?? storyId ?? currentIdFromPath();
  const authorFilter = authorProp ?? authorQueryFromUrl();

  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [localStories, setLocalStories] = useState(serverStories ?? []);

  useEffect(() => {
    setLocalStories(serverStories ?? []);
  }, [serverStories]);

  // Return to the source page. For direct visits, fall back to /feed.
  const closeViewer = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      router.visit("/feed");
    }
  }, []);

  useEffect(() => {
    let timeout;
    if (showControls) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [showControls, progress]);

  const stories = useMemo(() => {
    const mapped = (localStories || []).map((s) => ({
      id: s.id,
      brandId: s.brandId,
      brandName: s.brandName,
      authorId: s.authorId,
      authorUsername: s.authorUsername,
      avatar: s.avatar,
      mediaUrl: s.mediaUrl,
      caption: s.caption,
      expiresAt: s.expiresAt
        ? (typeof s.expiresAt === "number" ? s.expiresAt : new Date(s.expiresAt).getTime())
        : Date.now() + 1000 * 60 * 60 * 20,
      createdAt: s.createdAt,
      seen: s.seen,
      duration: s.duration || 5,
      liked: s.liked,
      likesCount: s.likesCount,
    }));

    // Group by brandId
    const grouped = {};
    mapped.forEach((s) => {
      if (!grouped[s.brandId]) grouped[s.brandId] = [];
      grouped[s.brandId].push(s);
    });

    // Sort groups by newest story, then inside group oldest first
    const groupArray = Object.values(grouped).sort((a, b) =>
      String(b[0]?.createdAt ?? "").localeCompare(String(a[0]?.createdAt ?? ""))
    );
    groupArray.forEach((group) =>
      group.sort((a, b) => String(a.createdAt ?? "").localeCompare(String(b.createdAt ?? "")))
    );

    let finalStories = groupArray.flat();
    // Query-param grouping filter: ?author=<brandId>
    if (authorFilter) {
      const filtered = finalStories.filter((s) => String(s.brandId) === String(authorFilter));
      if (filtered.length > 0) finalStories = filtered;
      else {
        const target = finalStories.find((st) => String(st.id) === String(routeId));
        if (target) finalStories = finalStories.filter((s) => s.brandId === target.brandId);
      }
    }
    return finalStories;
  }, [localStories, authorFilter, routeId]);

  const idx = stories.findIndex((s) => String(s.id) === String(routeId));
  const story = stories[idx];
  const authorStories = story ? stories.filter((s) => s.brandId === story.brandId) : [];
  const localIdx = authorStories.findIndex((s) => String(s.id) === String(routeId));

  const visitStory = useCallback(
    (nextId, replace = true) => {
      const qs = authorFilter ? `?author=${encodeURIComponent(authorFilter)}` : "";
      router.visit(`/stories/${nextId}${qs}`, { replace });
    },
    [authorFilter]
  );

  useEffect(() => {
    if (!story || isPaused || !mediaLoaded) return;
    const tick = 100; // ms
    const increment = (tick / (story.duration * 1000)) * 100;

    const iv = setInterval(() => {
      setProgress((p) => {
        const next = p + increment;
        if (next >= 100) {
          clearInterval(iv);
          const nextStory = stories[idx + 1];
          if (nextStory && nextStory.expiresAt > Date.now()) {
            visitStory(nextStory.id, true);
          } else {
            closeViewer();
          }
          return 0;
        }
        return next;
      });
    }, tick);
    return () => clearInterval(iv);
  }, [routeId, story, stories, idx, isPaused, mediaLoaded, closeViewer, visitStory]);

  useEffect(() => {
    setProgress(0);
    setMediaLoaded(false);
  }, [routeId]);

  useEffect(() => {
    if (story && user && !story.seen) {
      httpApi.post(`/stories/${story.id}/seen`).catch(() => {});
      setLocalStories((prev) => prev.map((s) => (String(s.id) === String(routeId) ? { ...s, seen: true } : s)));
    }
  }, [routeId, story, user]);

  // Keyboard: Esc closes, arrows move.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowLeft") {
        const prev = stories[idx - 1];
        if (prev) visitStory(prev.id, true);
      }
      if (e.key === "ArrowRight") {
        const nxt = stories[idx + 1];
        if (nxt) visitStory(nxt.id, true);
        else closeViewer();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stories, idx, closeViewer, visitStory]);

  const handleInquire = async () => {
    if (!user) {
      toast.error("Log in to inquire.");
      return;
    }
    const msg = prompt("Send an inquiry message:");
    if (!msg) return;

    setIsPaused(true);
    try {
      const res = await httpApi.post("/inquiries", { story_id: story.id, message: msg });
      const convId = res?.conversation?.id ?? res?.data?.conversation?.id;
      if (convId) {
        router.visit(`/messages/${convId}`);
      } else {
        toast.success("Inquiry sent.");
      }
    } catch (e) {
      toast.error(e.message || "Failed to send inquiry");
    }
    setIsPaused(false);
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) return toast.error("Log in to like stories.");
    const originalStories = [...localStories];
    setLocalStories((prev) =>
      prev.map((s) =>
        String(s.id) === String(routeId)
          ? {
              ...s,
              liked: !s.liked,
              likesCount: s.liked ? Math.max(0, (s.likesCount || 1) - 1) : (s.likesCount || 0) + 1,
            }
          : s
      )
    );

    try {
      const res = await httpApi.post(`/stories/${routeId}/like`);
      setLocalStories((prev) =>
        prev.map((s) =>
          String(s.id) === String(routeId)
            ? { ...s, liked: res.liked ?? s.liked, likesCount: res.likes_count ?? res.likesCount ?? s.likesCount }
            : s
        )
      );
    } catch {
      setLocalStories(originalStories);
      toast.error("Failed to like story.");
    }
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    const prev = stories[idx - 1];
    if (prev) visitStory(prev.id, true);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    const nxt = stories[idx + 1];
    if (nxt) visitStory(nxt.id, true);
    else closeViewer();
  };

  if (!serverStories) return <CreativeLoader text="Loading story..." fullScreen={true} />;
  if (stories.length > 0 && !story) return <div className="grid place-items-center h-[100dvh] bg-black text-white">Story not found or expired.</div>;
  if (!story) return <div className="grid place-items-center h-[100dvh] bg-black text-white">No stories found.</div>;

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1121] flex flex-col items-center select-none">
      <Head title={`${story.brandName} · Story`} />
      <div className="absolute top-0 left-0 right-0 z-50 w-full max-w-md mx-auto pointer-events-none">
        <div className="flex gap-1 px-2 pt-2 pointer-events-auto">
          {authorStories.map((s, i) => (
            <div key={s.id} className="h-1 flex-1 bg-surface/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--color-action)] to-[var(--color-accent)] transition-all ease-linear"
                style={{
                  width: i < localIdx ? "100%" : i === localIdx ? `${progress}%` : "0%",
                  transitionDuration: i === localIdx && !isPaused ? "100ms" : "0ms",
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-white pointer-events-auto">
          <Link
            href={profilePath({ username: story.authorUsername, authorId: story.authorId || story.brandId, brandId: story.brandId })}
            className="flex items-center gap-2 drop-shadow-md z-20 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img src={story.avatar} alt={story.brandName} className="w-8 h-8 rounded-full border border-white/50" />
            <span className="text-sm font-semibold hover:underline">{story.brandName}</span>
            <span className="text-xs text-white/80">· {timeAgo(story.createdAt)}</span>
          </Link>
          <button onClick={(e) => { e.stopPropagation(); closeViewer(); }} className="w-8 h-8 grid place-items-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors z-20 cursor-pointer">×</button>
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
        {story.mediaUrl?.endsWith(".mp4") || story.duration > 5 ? (
          <video
            key={story.id}
            src={story.mediaUrl}
            className="w-full h-full object-cover"
            autoPlay playsInline muted
            preload="auto"
            onLoadedData={() => setMediaLoaded(true)}
            onCanPlay={() => setMediaLoaded(true)}
            onError={() => setMediaLoaded(true)}
            onEnded={handleNext}
          />
        ) : (
          <img
            key={story.id}
            src={story.mediaUrl}
            alt={story.caption}
            className="w-full h-full object-cover"
            onLoad={() => setMediaLoaded(true)}
            onError={() => setMediaLoaded(true)}
          />
        )}

        {/* Media loader: never a black hang while the story downloads */}
        {!mediaLoaded && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-black">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-white/90 animate-spin" />
              <p className="text-xs tracking-[0.2em] text-white/70 font-medium">LOADING</p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className={`absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 transition-opacity duration-300 z-20 ${showControls ? "opacity-100" : "opacity-0"}`}>
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

        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 pt-32 flex flex-col justify-end min-h-[250px] pointer-events-none z-30">
          <div className={`flex gap-4 items-end transition-transform duration-300 pointer-events-auto ${showControls ? "-translate-y-[60px]" : "translate-y-0"}`}>
            <div className="flex-1">
              <p className="text-white text-sm drop-shadow-md">{story.caption}</p>
            </div>
            <button
              onClick={handleLike}
              onTouchStart={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="flex flex-col items-center gap-1 group z-20 transition-transform active:scale-75"
            >
              <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white transition-colors hover:bg-black/60 shadow-lg border border-white/10">
                <svg className={`w-5 h-5 transition-colors ${story.liked ? "text-red-500 fill-red-500" : "text-white"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="text-white text-xs drop-shadow-md font-medium">{story.likesCount || ""}</span>
            </button>
          </div>
          <div className="absolute bottom-6 left-6 right-6 pointer-events-auto">
            <button
              onClick={(e) => { e.stopPropagation(); handleInquire(); }}
              onTouchStart={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className={`w-full py-3 rounded-full bg-[var(--color-action)]/90 hover:bg-[var(--color-action)] text-white font-semibold backdrop-blur-sm shadow-lg transition-all duration-300 text-sm relative z-20 ${showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
            >
              Inquire about this
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
