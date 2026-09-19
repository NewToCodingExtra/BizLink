import { useParams } from "react-router-dom";
import OpportunityCard from "../components/OpportunityCard";
import { useState } from "react";

export default function Profile({ opportunities, comments, savedIds, onToggleLike, onToggleSave, onAddComment, onInquire }) {
  const { id } = useParams();
  const brandOpps = opportunities.filter(o => o.brandId===id);
  const brand = brandOpps[0];
  const [following, setFollowing] = useState(false);

  if (!brand) return <div className="max-w-2xl mx-auto py-12 text-center text-slate-500">Profile not found.</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex gap-4">
        <img src={brand.brandAvatar} alt={brand.brandName} className="w-16 h-16 rounded-full object-cover" />
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-[#0B1F3A] flex items-center gap-2">{brand.brandName} {brand.verified && <span className="text-xs bg-green-50 text-[#16A34A] border border-green-100 rounded-full px-2 py-0.5">✓ Verified</span>}</h1>
          <p className="text-sm text-slate-500 mt-1">{brand.category} · {brandOpps.length} opportunit{brandOpps.length!==1?"ies":"y"}</p>
          <button onClick={()=>setFollowing(!following)} className={`mt-3 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${following ? "bg-[#0B1F3A] text-white border-[#0B1F3A]" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}>{following ? "Following" : "Follow"}</button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <h2 className="text-sm font-semibold tracking-widest text-slate-400">POSTS BY THIS BRAND</h2>
        {brandOpps.map(o => (
          <OpportunityCard key={o.id} opp={o} comments={comments} onToggleLike={onToggleLike} onToggleSave={onToggleSave} onAddComment={onAddComment} onInquire={onInquire} saved={savedIds.includes(o.id)} />
        ))}
      </div>
    </div>
  );
}
