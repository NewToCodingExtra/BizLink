export default function Preferences({ preferences, setPreferences }) {
  const categories = ["Food & Beverage","Beauty & Wellness","Health & Fitness","Services & Logistics","Education","Fashion & Apparel"];
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-semibold text-[#0B1F3A]">Preferences</h1>
      <p className="text-sm text-slate-500 mt-1">These drive the auto-filter/sort bonus — manual FilterBar chips remain the primary interaction.</p>

      <div className="mt-6 bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
        <div>
          <p className="text-sm font-semibold text-slate-900">Preferred categories</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map(c => {
              const active = preferences.categories.includes(c);
              return (
                <button key={c} onClick={()=>setPreferences(p=>({...p, categories: active ? p.categories.filter(x=>x!==c) : [...p.categories, c]}))} className={`px-3 py-1.5 rounded-full text-sm font-medium border ${active ? "bg-[#2563EB] text-white border-[#2563EB]" : "bg-white text-slate-600 border-slate-200"}`}>{c}</button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Budget range (₱)</label>
          <div className="mt-2 flex gap-2">
            <input type="number" value={preferences.budgetMin} onChange={e=>setPreferences(p=>({...p, budgetMin: e.target.value}))} placeholder="Min" className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
            <span className="grid place-items-center text-slate-400">—</span>
            <input type="number" value={preferences.budgetMax} onChange={e=>setPreferences(p=>({...p, budgetMax: e.target.value}))} placeholder="Max" className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
          </div>
          <p className="text-xs text-slate-400 mt-2">Used to score opportunities in the feed (auto-sort layer).</p>
        </div>

        <div className="flex gap-2">
          <button onClick={()=>setPreferences({categories:[], budgetMin:"", budgetMax:""})} className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-sm font-medium">Reset</button>
          <span className="text-xs text-slate-400 grid place-items-center">Auto-sorted feed is layered on top of manual chips.</span>
        </div>
      </div>
    </div>
  );
}
