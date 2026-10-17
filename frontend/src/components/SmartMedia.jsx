import { useEffect, useRef, useState } from "react";
import { captureVideoThumbnail } from "../utils/videoThumb";
import { resolveMediaUrl } from "../utils/media";

export function useVideoPoster(videoUrl, fallback = null) {
  const [poster, setPoster] = useState(fallback);
  useEffect(() => {
    let alive = true;
    setPoster(fallback);
    if (!videoUrl) return undefined;
    captureVideoThumbnail(videoUrl).then((shot) => {
      if (alive && shot) setPoster(shot);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoUrl]);
  return poster;
}

/**
 * Feed/card media: video posts render a <video> with a captured-frame
 * poster (never a blank intro, never an unrelated stock photo); image posts
 * render a plain <img>. Same component is reused by the post modal.
 */
export default function SmartMedia({ opp, className = "", videoProps = {} }) {
  const [videoError, setVideoError] = useState(false);
  const [imgError, setImgError] = useState(false);
  const videoUrl = resolveMediaUrl(opp?.videoUrl);
  const imageUrl = resolveMediaUrl(opp?.image);
  const isVideo = opp?.mediaType === "video" && videoUrl && !videoError;
  const smart = useVideoPoster(isVideo ? videoUrl : null, imageUrl);

  const fallbackImage = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80&auto=format&fit=crop";

  if (!isVideo) {
    const src = (!imgError && imageUrl) ? imageUrl : (opp?.brandAvatar || fallbackImage);
    return (
      <img
        src={src}
        alt={opp?.headline || "Opportunity"}
        className={className}
        loading="lazy"
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <video
      src={videoUrl}
      muted
      loop
      playsInline
      preload="metadata"
      poster={smart || imageUrl || undefined}
      className={className}
      onError={() => setVideoError(true)}
      {...videoProps}
    />
  );
}

/**
 * Facebook-style feed player: autoplays muted while ≥50% visible, pauses off
 * screen, click toggles play/pause, speaker chip toggles sound. The paused
 * overlay doubles as the "this is a video" affordance photos don't have.
 */
export function FeedVideo({ opp, className = "" }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoUrl = resolveMediaUrl(opp?.videoUrl);
  const imageUrl = resolveMediaUrl(opp?.image);
  const smart = useVideoPoster(videoUrl, imageUrl);

  useEffect(() => {
    const v = ref.current;
    if (!v) return undefined;
    v.muted = muted;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;
        if (e.isIntersecting && e.intersectionRatio >= 0.5) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: [0, 0.5, 1] }
    );
    obs.observe(v);
    return () => {
      obs.disconnect();
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoUrl]);

  useEffect(() => {
    if (ref.current) ref.current.muted = muted;
  }, [muted]);

  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      <video
        ref={ref}
        src={videoUrl}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        poster={smart || undefined}
        onClick={() => {
          const v = ref.current;
          if (!v) return;
          if (v.paused) v.play().catch(() => {});
          else v.pause();
        }}
        className="w-full h-full object-cover cursor-pointer"
      />
      {!playing && (
        <button
          onClick={() => ref.current?.play().catch(() => {})}
          aria-label="Play video"
          className="absolute inset-0 grid place-items-center bg-black/30 transition-colors"
        >
          <span className="w-14 h-14 rounded-full bg-black/60 border border-white/40 grid place-items-center text-white">
            <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </span>
        </button>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
        aria-label={muted ? "Unmute" : "Mute"}
        className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white grid place-items-center border border-white/20"
      >
        {muted ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.107 12 5v14c0 .893-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.107 12 5v14c0 .893-1.077 1.337-1.707.707L5.586 15z" /></svg>
        )}
      </button>
      <span className="absolute top-2 left-2 text-[10px] font-bold tracking-widest bg-black/60 text-white px-2 py-0.5 rounded-full pointer-events-none">VIDEO</span>
    </div>
  );
}
