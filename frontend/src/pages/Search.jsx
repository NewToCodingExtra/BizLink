import { useSearchParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import OpportunityCard from "../components/OpportunityCard";

export default function Search({ opportunities, comments, savedIds, onToggleLike, onToggleSave, onAddComment, onInquire }) {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const [input, setInput] = useState(q);

  useEffect(()=> setInput(q), [q]);

  // debounce sync to URL
  useEffect(()=> {
    const t = setTimeout(()=> {
      if (input !== q) setParams(input ? { q: input } : {}, { replace:true });
    }, 300);
    return ()=> clearTimeout(t);
  }, [input]);

  const results = useMemo(()=> {
    if (!q.trim()) return [];
    const s = q.toLowerCase();
    return opportunities.filter(o =>
      o.brandName.toLowerCase().includes(s) ||
      o.headline.toLowerCase().includes(s) ||
      o.description.toLowerCase().includes(s) ||
      o.category.toLowerCase().includes(s) ||
      o.type.toLowerCase().includes(s)
    );
  }, [opportunities, q]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-semibold text-[#0B1F3A]">Search</h1>
      <div className="mt-4 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="M20 20L16.5 16.5"/></svg>
        </span>
        <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Search brands, categories..." className="w-full border border-slate-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-lg pl-9 pr-4 py-3 text-sm bg-white" />
      </div>

      {!q ? (
        <p className="text-sm text-slate-500 mt-6">Type to search franchises, wholesale and resell opportunities.</p>
      ) : results.length===0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-8 text-center mt-6">
          <p className="text-sm text-slate-600">No opportunities match “{q}” — try a broader term.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-slate-500">{results.length} result{results.length!==1?"s":""} for “{q}”</p>
          {results.map(o => (
            <OpportunityCard key={o.id} opp={o} comments={comments} onToggleLike={onToggleLike} onToggleSave={onToggleSave} onAddComment={onAddComment} onInquire={onInquire} saved={savedIds.includes(o.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
