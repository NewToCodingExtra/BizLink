import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function expiryOf(s) {
  if (!s) return 0;
  const v = s.expiresAt;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const t = new Date(v).getTime();
    return Number.isNaN(t) ? 0 : t;
  }
  return 0;
}

export default function StoriesBar({ stories }) {
  const { user } = useAuth();
  const location = useLocation();
  
  const active = (stories || []).filter((s) => expiryOf(s) > Date.now());
  if (active.length === 0 && !user) return null;
  
  const grouped = [];
  const seenBrands = new Set();
  for (const s of active) {
    if (!seenBrands.has(s.brandId)) {
      seenBrands.add(s.brandId);
      grouped.push(s);
    }
  }
  
  return (
    <div className="bg-surface border border-border rounded-xl shadow-sm p-4 mb-4 max-w-2xl mx-auto">
      <p className="text-xs font-semibold tracking-widest text-text-secondary">DAILY OPPORTUNITIES</p>
      <div className="mt-3 flex gap-4 overflow-auto pb-1 items-start">
        {/* Create Story Button */}
        <button 
          onClick={() => {
            if (window.onOpenCreateStory) window.onOpenCreateStory();
          }} 
          className="shrink-0 text-center group flex flex-col items-center"
        >
          <span className="relative flex items-center justify-center w-[68px] h-[68px] rounded-full border border-border bg-bg group-hover:bg-bg transition p-0.5">
            {user ? (
              <img src={user.avatar || `https://i.pravatar.cc/100?u=${user.id}`} alt="Create Story" className="w-full h-full rounded-full object-cover opacity-80 group-hover:opacity-100 transition" />
            ) : (
              <svg className="w-8 h-8 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            )}
            <div className="absolute bottom-0 right-0 bg-action text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-sm">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            </div>
          </span>
          <span className="block mt-1.5 text-xs font-medium text-text-primary truncate w-[68px]">Create</span>
        </button>

        {grouped.map((s) => (
          <Link key={s.id} to={`/stories/${s.id}`} state={{ backgroundLocation: location }} className="shrink-0 text-center group flex flex-col items-center">
            <span className={`block w-[68px] h-[68px] rounded-full p-[3px] ${s.seen ? "bg-bg" : "bg-gradient-to-tr from-amber-400 via-orange-500 to-pink-500"}`}>
              <img src={s.avatar} alt={s.brandName} className="w-full h-full rounded-full object-cover border-2 border-white group-hover:scale-[1.02] transition" />
            </span>
            <span className="block mt-1.5 text-xs font-medium text-text-primary truncate w-[68px]">{s.brandName}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
