import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { httpApi } from '../utils/http';

const REAL_CATEGORIES = ['Food & Beverage', 'Beauty & Wellness', 'Health & Fitness', 'Services & Logistics', 'Education', 'Fashion & Apparel', 'Home & Living'];

// Defensive unwrappers — endpoints may return { data } or raw payloads.
function asList(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
}

function asPrefs(res) {
  const d = res?.data ?? res ?? {};
  return {
    categories: d.categories || [],
    budgetMin: d.budgetMin ?? '',
    budgetMax: d.budgetMax ?? '',
    onboardingCompleted: Boolean(d.onboardingCompleted),
  };
}

export default function PreferenceOnboardingModal({ user, onComplete, forceOpen = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [brands, setBrands] = useState([]);
  const [step, setStep] = useState(1);
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    const checkPreferences = async () => {
      try {
        const prefsRes = await httpApi.get('/preferences');
        const prefs = asPrefs(prefsRes);
        setSelectedCategories(prefs.categories);
        setBudgetMin(prefs.budgetMin);
        setBudgetMax(prefs.budgetMax);
        const dismissedThisSession = sessionStorage.getItem(`bizlink:preference-onboarding:${user.id}`) === 'done';
        if (forceOpen || (!prefs.onboardingCompleted && !dismissedThisSession)) {
          setTimeout(() => setIsOpen(true), forceOpen ? 0 : 1500);
        }
      } catch (e) {
        console.error('Failed to fetch preferences', e);
      }
    };

    checkPreferences();
  }, [user, forceOpen]);

  // Real brands from the live feed (deduped by author), so follows actually match posts.
  useEffect(() => {
    if (!isOpen || brands.length > 0) return;
    let cancelled = false;
    setLoadingBrands(true);
    httpApi
      .get('/opportunities?per_page=50')
      .then((res) => {
        if (cancelled) return;
        const seen = new Map();
        for (const o of asList(res)) {
          const key = String(o.authorId ?? o.brandId);
          if (!seen.has(key)) {
            seen.set(key, {
              authorId: o.authorId,
              name: o.brandName,
              avatar: o.brandAvatar,
              type: o.type,
            });
          }
          if (seen.size >= 8) break;
        }
        setBrands([...seen.values()]);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingBrands(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, brands.length]);

  const completeOnboarding = async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all(
        selectedAuthors.map((authorId) => httpApi.post('/follows/toggle', { brand_id: `brand-${authorId}` }).catch(() => null))
      );
      await httpApi.put('/preferences', {
        categories: selectedCategories,
        budgetMin,
        budgetMax,
        onboardingCompleted: true,
      });
      sessionStorage.setItem(`bizlink:preference-onboarding:${user.id}`, 'done');
      setIsOpen(false);
      if (onComplete) onComplete();
    } catch (e) {
      setError(e?.data?.message || e.message || 'Could not save your preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const dismiss = async () => {
    setLoading(true);
    setError('');
    try {
      await httpApi.put('/preferences', { onboardingCompleted: true });
      sessionStorage.setItem(`bizlink:preference-onboarding:${user.id}`, 'done');
      setIsOpen(false);
    } catch (e) {
      setError(e?.data?.message || 'Could not save your choice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthor = (authorId) => {
    setSelectedAuthors(prev =>
      prev.includes(authorId) ? prev.filter(a => a !== authorId) : [...prev, authorId]
    );
  };

  const toggleCategory = (cat) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={dismiss}
      title={step === 1 ? 'Personalize your feed' : step === 2 ? 'What industries interest you?' : 'Set your budget range'}
      closeOnClickOutside={false}
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={dismiss} disabled={loading}>Skip for now</Button>
          {step === 1 ? (
            <Button variant="primary" onClick={() => setStep(2)}>Next</Button>
          ) : step === 2 ? (
            <>
              <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
              <Button variant="primary" onClick={() => setStep(3)}>Next</Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setStep(2)} disabled={loading}>Back</Button>
              <Button variant="primary" onClick={completeOnboarding} disabled={loading}>
                {loading ? 'Saving...' : 'Finish Setup'}
              </Button>
            </>
          )}
        </>
      }
    >
      {step === 1 && (
        <div>
          <p className="mb-4 text-xs font-semibold tracking-wide text-[var(--color-action)]">Step 1 of 3</p>
          <p className="text-[var(--color-text-secondary)] mb-6">
            Select brands you want to follow. We&apos;ll prioritize their opportunities in your feed.
          </p>
          {loadingBrands ? (
            <p className="text-sm text-[var(--color-text-secondary)] text-center py-6">Loading brands…</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {brands.map(brand => (
                <div
                  key={String(brand.authorId)}
                  onClick={() => toggleAuthor(brand.authorId)}
                  className={`cursor-pointer border rounded-xl p-4 text-center transition-all ${selectedAuthors.includes(brand.authorId)
                      ? 'border-[var(--color-action)] bg-[var(--color-action)]/5 ring-2 ring-[var(--color-action)]/20'
                      : 'border-[var(--color-border)] hover:border-[var(--color-action)]/50'
                    }`}
                >
                  <div className="w-12 h-12 rounded-full bg-bg mx-auto mb-2 flex items-center justify-center text-xl font-bold text-text-secondary overflow-hidden">
                    {brand.avatar ? <img src={brand.avatar} alt={brand.name} className="w-full h-full object-cover" /> : brand.name?.[0]}
                  </div>
                  <div className="font-medium text-sm text-[var(--color-text-primary)] truncate">{brand.name}</div>
                  <div className="text-xs text-[var(--color-text-secondary)]">{brand.type}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div>
          <p className="mb-4 text-xs font-semibold tracking-wide text-[var(--color-action)]">Step 2 of 3</p>
          <p className="text-[var(--color-text-secondary)] mb-6">
            Select categories that match your business interests.
          </p>
          <div className="flex flex-wrap gap-3">
            {REAL_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${selectedCategories.includes(cat)
                    ? 'bg-[var(--color-action)] text-white border-[var(--color-action)]'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-primary)] border-[var(--color-border)] hover:border-[var(--color-action)]'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <p className="mb-4 text-xs font-semibold tracking-wide text-[var(--color-action)]">Step 3 of 3</p>
          <p className="text-[var(--color-text-secondary)] mb-6">
            What investment range works for you? This helps surface opportunities that fit your budget.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
            <label className="block text-sm font-medium text-[var(--color-text-primary)]">
              Minimum budget (₱)
              <input type="number" min="0" inputMode="decimal" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="e.g. 10000" className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-[var(--color-text-primary)] outline-none focus:border-[var(--color-action)] focus:ring-2 focus:ring-[var(--color-action)]/20" />
            </label>
            <span className="hidden pb-3 text-[var(--color-text-secondary)] sm:block">to</span>
            <label className="block text-sm font-medium text-[var(--color-text-primary)]">
              Maximum budget (₱)
              <input type="number" min="0" inputMode="decimal" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="e.g. 50000" className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-[var(--color-text-primary)] outline-none focus:border-[var(--color-action)] focus:ring-2 focus:ring-[var(--color-action)]/20" />
            </label>
          </div>
          <p className="mt-3 text-xs text-[var(--color-text-secondary)]">You can leave either field empty and update this anytime in Preferences.</p>
        </div>
      )}

      {error && <p role="alert" className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>}
    </Modal>
  );
}
