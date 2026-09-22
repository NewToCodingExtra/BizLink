import { useEffect, useState } from "react";
import { preferencesApi } from "../api/client";

export default function Preferences() {
  const categories = ["Food & Beverage", "Beauty & Wellness", "Health & Fitness", "Services & Logistics", "Education", "Fashion & Apparel"];
  const [prefs, setPrefs] = useState({ categories: [], budgetMin: "", budgetMax: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    preferencesApi
      .get()
      .then((res) => {
        if (!cancelled) setPrefs({ categories: res.data.categories || [], budgetMin: res.data.budgetMin || "", budgetMax: res.data.budgetMax || "" });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load preferences");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleCategory = (c) => {
    setPrefs((p) => ({ ...p, categories: p.categories.includes(c) ? p.categories.filter((x) => x !== c) : [...p.categories, c] }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await preferencesApi.update({ categories: prefs.categories, budgetMin: prefs.budgetMin, budgetMax: prefs.budgetMax });
      setPrefs({ categories: res.data.categories || [], budgetMin: res.data.budgetMin || "", budgetMax: res.data.budgetMax || "" });
      setSaved(true);
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    setPrefs({ categories: [], budgetMin: "", budgetMax: "" });
    setSaving(true);
    try {
      await preferencesApi.update({ categories: [], budgetMin: "", budgetMax: "" });
      setSaved(true);
    } catch (err) {
      setError(err.message || "Reset failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="max-w-2xl mx-auto py-12 text-center text-slate-500">Loading preferences...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-semibold text-[#0B1F3A]">Preferences</h1>
      <p className="text-sm text-slate-500 mt-1">Persisted in MySQL. Drives the auto-sort bonus on the feed.</p>

      {error && <p className="mt-4 text-sm text-[#DC2626] bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
      {saved && <p className="mt-4 text-sm text-[#16A34A] bg-green-50 border border-green-100 rounded-lg px-3 py-2">Preferences saved.</p>}

      <div className="mt-6 bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
        <div>
          <p className="text-sm font-semibold text-slate-900">Preferred categories</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((c) => {
              const active = prefs.categories.includes(c);
              return (
                <button key={c} onClick={() => toggleCategory(c)} className={`px-3 py-1.5 rounded-full text-sm font-medium border ${active ? "bg-[#2563EB] text-white border-[#2563EB]" : "bg-white text-slate-600 border-slate-200"}`}>{c}</button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Budget range (₱)</label>
          <div className="mt-2 flex gap-2">
            <input value={prefs.budgetMin} onChange={(e) => setPrefs((p) => ({ ...p, budgetMin: e.target.value }))} placeholder="Min" className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
            <span className="grid place-items-center text-slate-400">—</span>
            <input value={prefs.budgetMax} onChange={(e) => setPrefs((p) => ({ ...p, budgetMax: e.target.value }))} placeholder="Max" className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
          </div>
          <p className="text-xs text-slate-400 mt-2">Used to score opportunities in the feed.</p>
        </div>

        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className="px-5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-blue-300 text-white text-sm font-medium">{saving ? "Saving..." : "Save preferences"}</button>
          <button onClick={reset} className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-sm font-medium">Reset</button>
        </div>
      </div>
    </div>
  );
}
