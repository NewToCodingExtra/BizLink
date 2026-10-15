import { useRef, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import { HeartIcon, CommentIcon, VolumeOffIcon } from "./icons";
import { profilePath } from "../utils/profilePath";
import { displayCapital, displayRoi } from "../utils/money";
import { useToast } from "../context/ToastContext";
import { useShare } from "../context/ShareContext";
import ReportModal from "./ReportModal";
import DropdownMenu from "./DropdownMenu";
import AuthorRoleBadge from "./AuthorRoleBadge";
import { useVideoPoster } from "./SmartMedia";

export default function ReelCard({ opp, onToggleLike, onInquire, onOpenComments }) {
  const share = useShare();
  const ref = useRef(null);
  const [muted, setMuted] = useState(true);
  // Toggle via the DOM property (React's muted prop doesn't propagate after
  // mount in some browsers) and resume playback when unmuting.
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    const v = ref.current;
    if (v) {
      v.muted = next;
      if (!next) v.play().catch(() => {});
    }
  };
  const toast = useToast();
  const { auth } = usePage().props;
  void auth; void toast;
  const [reportOpen, setReportOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef(null);
  // Captured-frame poster (never a blank intro, never a stock photo).
  const smartPoster = useVideoPoster(opp.videoUrl, opp.image);
  const commentCount = typeof opp.commentsCount === "number" ? opp.commentsCount : (opp.comments || []).length;
  // From a reel, the author profile should open straight on its REELS tab —
  // otherwise the just-watched video is hidden under POSTS.
  const authorProfile = `${profilePath({ username: opp.user?.username || opp.authorUsername, authorId: opp.authorId, brandId: opp.brandId })}?tab=reels`;
  return (
    <div className="snap-start relative h-[calc(100dvh-130px)] md:h-[calc(100dvh-64px)] w-full bg-black flex items-center justify-center overflow-hidden">
      {opp.videoUrl ? (
        <video
          ref={ref}
          src={opp.videoUrl}
          poster={smartPoster || undefined}
          autoPlay muted={muted} loop playsInline
          onClick={()=>setMuted(!muted)}
          className="h-full w-full object-cover max-w-md mx-auto"
        />
      ) : (
        <img src={opp.image || opp.brandAvatar} alt={opp.headline} className="h-full w-full object-cover max-w-md mx-auto" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/25 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex items-end justify-between gap-3 max-w-md mx-auto w-full">
        <div className="flex-1 min-w-0 pr-1">
          <p className="text-white font-semibold text-sm flex items-center gap-1.5 flex-wrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            <Link href={authorProfile} className="shrink-0"><img src={opp.brandAvatar} alt={opp.brandName} className="w-7 h-7 rounded-full border border-white/30 object-cover aspect-square" /></Link>
            <Link href={authorProfile} className="hover:underline truncate min-w-0 max-w-full">{opp.brandName}</Link>
            <span className="text-[10px] tracking-widest bg-white/20 px-2 py-0.5 rounded-full shrink-0">{opp.type}</span>
            <AuthorRoleBadge opp={opp} dark />
          </p>
          <Link href={`/post/${opp.slug}`} className="block text-white text-sm mt-1.5 leading-snug line-clamp-2 hover:underline drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{opp.headline}</Link>
          <p className="text-white/80 text-xs mt-1 truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{displayCapital(opp)} · {displayRoi(opp)}</p>
        </div>
        <div className="flex flex-col items-center gap-2.5 shrink-0">
          <button onClick={()=>onToggleLike(opp.id)} aria-label="Like" className={`w-10 h-10 rounded-full grid place-items-center ${opp.liked ? "bg-error text-white" : "bg-white/20 text-white"}`}><HeartIcon filled={!!opp.liked} className="w-5 h-5" /></button>
          <button onClick={()=>onOpenComments && onOpenComments(opp)} aria-label="Comments" className="w-10 h-10 rounded-full grid place-items-center bg-white/20 text-white text-sm font-semibold"><CommentIcon className="w-5 h-5" />{commentCount > 0 ? <span className="text-[10px] ml-0.5">{commentCount}</span> : null}</button>
          <button
            onClick={() => share({
              title: opp.headline,
              text: opp.description,
              url: `/post/${opp.slug}`,
            })}
            aria-label="Share"
            className="w-10 h-10 rounded-full grid place-items-center bg-white/20 text-white hover:bg-white/30 active:scale-95 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          </button>
          <button onClick={()=>onInquire(opp)} className="px-3 py-1.5 rounded-full bg-action text-white text-xs font-semibold">Inquire</button>
          {muted && (
            <button onClick={toggleMute} aria-label="Unmute" className="w-8 h-8 rounded-full bg-white/20 text-white grid place-items-center"><VolumeOffIcon className="w-4 h-4" /></button>
          )}
          <div>
            <button
              ref={menuBtnRef}
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Reel options"
              className="flex items-center justify-center w-11 h-11 rounded-full bg-white/20 text-white hover:bg-white/30 active:bg-white/30 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
            </button>
            <DropdownMenu open={menuOpen} onClose={() => setMenuOpen(false)} triggerRef={menuBtnRef} align="right" width={192} preferAbove>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  share({
                    title: opp.headline,
                    text: opp.description,
                    url: `/post/${opp.slug}`,
                  });
                }}
                className="w-full text-left px-4 py-2 min-h-[44px] flex items-center text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] gap-2"
              >
                <svg className="w-4 h-4 text-action" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                Share
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  if (window.onHideOpp) window.onHideOpp(opp.id);
                }}
                className="w-full text-left px-4 py-2 min-h-[44px] flex items-center text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" /></svg>
                Not Interested
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setReportOpen(true);
                }}
                className="w-full text-left px-4 py-2 min-h-[44px] flex items-center text-sm text-error hover:bg-error/10 gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Report
              </button>
            </DropdownMenu>
          </div>
        </div>
      </div>
      {muted && (
        <span className="absolute top-[max(0.75rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 text-[11px] tracking-widest text-white/80 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full pointer-events-none whitespace-nowrap">TAP TO UNMUTE</span>
      )}
      <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} endpoint={`/opportunities/${opp.id}/report`} title="Report this reel" />
    </div>
  );
}
