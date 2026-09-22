import { useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function ReelCard({ opp, onToggleLike, onInquire, onOpenComments }) {
  const ref = useRef(null);
  const [muted, setMuted] = useState(true);
  const commentCount = typeof opp.commentsCount === "number" ? opp.commentsCount : (opp.comments || []).length;
  return (
    <div className="snap-start relative h-[100dvh] w-full bg-black flex items-center justify-center overflow-hidden">
      <video
        ref={ref}
        src={opp.videoUrl}
        poster={opp.image}
        autoPlay muted={muted} loop playsInline
        onClick={()=>setMuted(!muted)}
        className="h-full w-full object-cover max-w-md mx-auto"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between gap-4 max-w-md mx-auto w-full">
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm flex items-center gap-2">
            <Link to={`/profile/${opp.brandId}`}><img src={opp.brandAvatar} alt={opp.brandName} className="w-7 h-7 rounded-full border border-white/30" /></Link>
            <Link to={`/profile/${opp.brandId}`} className="hover:underline truncate">{opp.brandName}</Link>
            <span className="text-[10px] tracking-widest bg-white/20 px-2 py-0.5 rounded-full shrink-0">{opp.type}</span>
          </p>
          <Link to={`/post/${opp.id}`} className="block text-white text-sm mt-1 line-clamp-2 hover:underline">{opp.headline}</Link>
          <p className="text-white/70 text-xs mt-1">{opp.capitalRequired} · {opp.roi}</p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <button onClick={()=>onToggleLike(opp.id)} aria-label="Like" className={`w-10 h-10 rounded-full grid place-items-center text-lg ${opp.liked ? "bg-red-500 text-white" : "bg-white/20 text-white"}`}>{opp.liked?"♥":"♡"}</button>
          <button onClick={()=>onOpenComments && onOpenComments(opp)} aria-label="Comments" className="w-10 h-10 rounded-full grid place-items-center bg-white/20 text-white text-sm font-semibold">💬{commentCount > 0 ? <span className="text-[10px] ml-0.5">{commentCount}</span> : null}</button>
          <button onClick={()=>onInquire(opp)} className="px-3 py-1.5 rounded-full bg-[#2563EB] text-white text-xs font-semibold">Inquire</button>
          <button onClick={()=>setMuted(!muted)} aria-label={muted ? "Unmute" : "Mute"} className="w-8 h-8 rounded-full bg-white/20 text-white grid place-items-center text-xs">{muted?"🔇":"🔊"}</button>
        </div>
      </div>
      <span className="absolute top-3 left-1/2 -translate-x-1/2 text-[11px] tracking-widest text-white/70 bg-white/10 px-2 py-1 rounded-full">TAP TO {muted?"UNMUTE":"MUTE"}</span>
    </div>
  );
}
