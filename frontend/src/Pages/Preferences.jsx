import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { httpApi } from '../utils/http';
import { SparkleIcon } from '../Components/icons';
import { useToast } from '../context/ToastContext';

const CATEGORIES = ['Food & Beverage', 'Beauty & Wellness', 'Health & Fitness', 'Services & Logistics', 'Education', 'Fashion & Apparel', 'Home & Living'];

function normalizePrefs(raw) {
  const d = raw?.data ?? raw ?? {};
  return {
    categories: d.categories || [],
    budgetMin: d.budgetMin ?? '',
    budgetMax: d.budgetMax ?? '',
  };
}

export default function Preferences({ prefs: initialPrefs }) {
  const toast = useToast();
  const [prefs, setPrefs] = useState(() => normalizePrefs(initialPrefs));
  const [saving, setSaving] = useState(false);

  const [saved, setSaved] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const toggleCategory = (c) => {
    setPrefs((p) => ({ ...p, categories: p.categories.includes(c) ? p.categories.filter((x) => x !== c) : [...p.categories, c] }));
    setSaved(false);
  };

  const showPersonalizedToast = (savedPrefs) => {
    const cats = savedPrefs.categories || [];
    toast.info(
      <span>
        <SparkleIcon className="w-3.5 h-3.5 inline-block -mt-0.5" /> Personalized for you
        {cats.length > 0 ? ` · ${cats.join(", ")}` : ""}
        {(savedPrefs.budgetMin || savedPrefs.budgetMax) ? ` · ₱${savedPrefs.budgetMin || "0"}–₱${savedPrefs.budgetMax || "∞"}` : ""}
        {" · "}<Link href="/feed" className="text-action font-medium hover:underline">View feed</Link>
      </span>
    );
  };

  const validateBudgets = () => {
    const min = parseFloat(prefs.budgetMin);
    const max = parseFloat(prefs.budgetMax);
    if (!isNaN(min) && !isNaN(max) && min > max) {
      setFieldErrors({ budgetMin: true, budgetMax: true });
      toast.error("Min budget cannot be greater than max budget");
      return false;
    }
    setFieldErrors({});
    return true;
  };

  const save = async () => {
    if (!validateBudgets()) return;
    setSaving(true);
    try {
      const res = await httpApi.put('/preferences', { categories: prefs.categories, budgetMin: prefs.budgetMin, budgetMax: prefs.budgetMax, onboardingCompleted: true });
      const next = normalizePrefs(res);
      setPrefs(next);
      setSaved(true);
      showPersonalizedToast(next);
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    setPrefs({ categories: [], budgetMin: '', budgetMax: '' });
    setFieldErrors({});
    setSaving(true);
    try {
      await httpApi.put('/preferences', { categories: [], budgetMin: '', budgetMax: '', onboardingCompleted: true });
      setSaved(true);
      toast.success('Preferences reset.');
    } catch (err) {
      toast.error(err.message || 'Reset failed');
    } finally {
      setSaving(false);
    }
  };

  const getInputClass = (hasError) => {
    const base = "flex-1 bg-transparent text-text-primary border rounded-lg px-3 py-2.5 text-sm transition-colors outline-none";
    return hasError 
      ? `${base} border-error focus:border-error focus:ring-2 focus:ring-error/20 bg-error/5` 
      : `${base} border-border focus:border-action focus:ring-2 focus:ring-blue-100`;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <Head title="Preferences" />
      <h1 className="text-2xl font-semibold text-text-primary">Preferences</h1>
      <p className="text-sm text-text-secondary mt-1">Persisted in MySQL. Drives the auto-sort bonus on the feed.</p>

      {saved && <p className="mt-4 text-sm text-success bg-success/10 border border-success/20 rounded-lg px-3 py-2">Preferences saved.</p>}

      <div className="mt-6 bg-surface rounded-xl border border-border shadow-sm p-6 space-y-6">
        <div>
          <p className="text-sm font-semibold text-text-primary">Preferred categories</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const active = prefs.categories.includes(c);
              return (
                <button key={c} onClick={() => toggleCategory(c)} className={`px-3 py-1.5 rounded-full text-sm font-medium border ${active ? 'bg-action text-white border-[#2563EB]' : 'bg-surface text-text-secondary border-border'}`}>{c}</button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-text-primary">Budget range (₱)</label>
          <div className="mt-2 flex gap-2">
            <input type="number" onBlur={validateBudgets} value={prefs.budgetMin} onChange={(e) => setPrefs((p) => ({ ...p, budgetMin: e.target.value }))} placeholder="Min" className={getInputClass(fieldErrors.budgetMin)} />
            <span className="grid place-items-center text-text-secondary">—</span>
            <input type="number" onBlur={validateBudgets} value={prefs.budgetMax} onChange={(e) => setPrefs((p) => ({ ...p, budgetMax: e.target.value }))} placeholder="Max" className={getInputClass(fieldErrors.budgetMax)} />
          </div>
          <p className="text-xs text-text-secondary mt-2">Used to score opportunities in the feed.</p>
        </div>

        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className="px-5 py-2 rounded-lg bg-action hover:bg-action-hover disabled:bg-blue-300 text-white text-sm font-medium">{saving ? 'Saving...' : 'Save preferences'}</button>
          <button onClick={reset} className="px-4 py-2 rounded-lg bg-surface border border-border text-text-secondary text-sm font-medium">Reset</button>
        </div>
      </div>
    </div>
  );
}
