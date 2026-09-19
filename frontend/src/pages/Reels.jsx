import ReelCard from "../components/ReelCard";

export default function Reels({ opportunities, onToggleLike, onInquire }) {
  const reels = opportunities.filter(o => o.mediaType === "video");
  if (reels.length===0) return <div className="max-w-md mx-auto py-12 text-center"><p className="text-slate-500">No pitch reels yet — post a video opportunity.</p></div>;
  return (
    <div className="h-[calc(100dvh-64px)] overflow-y-scroll snap-y snap-mandatory bg-black">
      {reels.map(r => (
        <ReelCard key={r.id} opp={r} onToggleLike={onToggleLike} onInquire={onInquire} />
      ))}
    </div>
  );
}
