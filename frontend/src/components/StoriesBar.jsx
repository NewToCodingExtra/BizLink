import { Link } from "react-router-dom";

export default function StoriesBar({ stories }) {
  const active = stories.filter(s => s.expiresAt > Date.now());
  if (active.length===0) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-4 mb-4 max-w-2xl mx-auto">
      <p className="text-xs font-semibold tracking-widest text-slate-400">DAILY OPPORTUNITIES</p>
      <div className="mt-3 flex gap-4 overflow-auto pb-1">
        {active.map(s => (
          <Link key={s.id} to={`/stories/${s.id}`} className="shrink-0 text-center group">
            <span className={`block w-[68px] h-[68px] rounded-full p-[3px] ${s.seen ? "bg-slate-200" : "bg-gradient-to-tr from-amber-400 via-orange-500 to-pink-500"}`}>
              <img src={s.avatar} alt={s.brandName} className="w-full h-full rounded-full object-cover border-2 border-white group-hover:scale-[1.02] transition" />
            </span>
            <span className="block mt-1.5 text-xs font-medium text-slate-700 truncate w-[68px]">{s.brandName}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
