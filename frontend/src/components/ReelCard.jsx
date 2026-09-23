import { useRef, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import { HeartIcon, CommentIcon, VolumeOnIcon, VolumeOffIcon } from "./icons";
import { profilePath } from "../utils/profilePath";
import { displayCapital, displayRoi } from "../utils/money";
import { useToast } from "../context/ToastContext";

export default function ReelCard({ opp, onToggleLike, onInquire, onOpenComments }) {
  const ref = useRef(null);
  const [muted, setMuted] = useState(true);
  const toast = useToast();
  const { auth } = usePage().props;
  void auth;
  const commentCount = typeof opp.commentsCount === "number" ? opp.commentsCount : (opp.comments || []).length;
  // From a reel, the author profile should open straight on its REELS tab —
  // otherwise the just-watched video is hidden under POSTS.
  const authorProfile = `${profilePath({ username: opp.user?.username || opp.authorUsername, authorId: opp.authorId, brandId: opp.brandId })}?tab=reels`;
  return (
    <div className="snap-start relative h-[100dvh] w-full bg-black flex items-center justify-center overflow-hidden">
      {opp.videoUrl ? (
        <video
          ref={ref}
          src={opp.videoUrl}
          poster={opp.image || undefined}
          autoPlay muted={muted} loop playsInline
          onClick={()=>setMuted(!muted)}
          className="h-full w-full object-cover max-w-md mx-auto"
        />
      ) : (
        <img src={opp.image || opp.brandAvatar} alt={opp.headline} className="h-full w-full object-cover max-w-md mx-auto" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between gap-4 max-w-md mx-auto w-full">
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm flex items-center gap-2">
            <Link href={authorProfile}><img src={opp.brandAvatar} alt={opp.brandName} className="w-7 h-7 rounded-full border border-white/30" /></Link>
            <Link href={authorProfile} className="hover:underline truncate">{opp.brandName}</Link>
            <span className="text-[10px] tracking-widest bg-white/20 px-2 py-0.5 rounded-full shrink-0">{opp.type}</span>
          </p>
          <Link href={`/post/${opp.slug}`} className="block text-white text-sm mt-1 line-clamp-2 hover:underline">{opp.headline}</Link>
          <p className="text-white/70 text-xs mt-1">{displayCapital(opp)} · {displayRoi(opp)}</p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <button onClick={()=>onToggleLike(opp.id)} aria-label="Like" className={`w-10 h-10 rounded-full grid place-items-center ${opp.liked ? "bg-error text-white" : "bg-white/20 text-white"}`}><HeartIcon filled={!!opp.liked} className="w-5 h-5" /></button>
          <button onClick={()=>onOpenComments && onOpenComments(opp)} aria-label="Comments" className="w-10 h-10 rounded-full grid place-items-center bg-white/20 text-white text-sm font-semibold"><CommentIcon className="w-5 h-5" />{commentCount > 0 ? <span className="text-[10px] ml-0.5">{commentCount}</span> : null}</button>
          <button onClick={()=>onInquire(opp)} className="px-3 py-1.5 rounded-full bg-action text-white text-xs font-semibold">Inquire</button>
          <button onClick={()=>setMuted(!muted)} aria-label={muted ? "Unmute" : "Mute"} className="w-8 h-8 rounded-full bg-white/20 text-white grid place-items-center">{muted ? <VolumeOffIcon className="w-4 h-4" /> : <VolumeOnIcon className="w-4 h-4" />}</button>
          <div className="relative">
            <button onClick={() => {
              const el = document.getElementById(`menu-reel-${opp.id}`);
              el.classList.toggle('hidden');
            }} className="w-8 h-8 rounded-full bg-white/20 text-white grid place-items-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
            </button>
            <div id={`menu-reel-${opp.id}`} className="hidden absolute bottom-full right-0 mb-2 w-48 bg-[var(--color-surface)] rounded-lg shadow-xl border border-[var(--color-border)] z-20 py-1">
              <button
                onClick={() => {
                  document.getElementById(`menu-reel-${opp.id}`).classList.add('hidden');
                  if (window.onHideOpp) window.onHideOpp(opp.id);
                }}
                className="w-full text-left px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" /></svg>
                Not Interested
              </button>
              <button
                onClick={() => {
                  document.getElementById(`menu-reel-${opp.id}`).classList.add('hidden');
                  toast.success("Reported successfully.");
                }}
                className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error/10 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Report
              </button>
            </div>
          </div>
        </div>
      </div>
      <span className="absolute top-3 left-1/2 -translate-x-1/2 text-[11px] tracking-widest text-white/70 bg-white/10 px-2 py-1 rounded-full">TAP TO {muted?"UNMUTE":"MUTE"}</span>
    </div>
  );
}
