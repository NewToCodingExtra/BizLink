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
  const [existingPrefs, setExistingPrefs] = useState({ categories: [], budgetMin: '', budgetMax: '' });

  useEffect(() => {
    if (!user) return;

    // Only nag users with genuinely empty personalization: no follows,
    // no categories, no budget range.
    const checkPreferences = async () => {
      try {
        const [prefsRes, followsRes] = await Promise.all([
          httpApi.get('/preferences').catch(() => ({ data: {} })),
          httpApi.get('/follows').catch(() => ({ data: [] })),
        ]);
        const prefs = asPrefs(prefsRes);
        setExistingPrefs(prefs);
        const hasFollows = asList(followsRes).length > 0;
        const hasPrefs = (prefs.categories || []).length > 0 || prefs.budgetMin || prefs.budgetMax;
        if (forceOpen || (!hasFollows && !hasPrefs)) {
          // Add a small delay so it doesn't pop up too aggressively
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

  const handleSave = async () => {
    setLoading(true);
    try {
      // Preserve an existing budget range: re-read prefs and merge.
      let budget = { budgetMin: existingPrefs.budgetMin || '', budgetMax: existingPrefs.budgetMax || '' };
      try {
        const fresh = asPrefs(await httpApi.get('/preferences'));
        budget = { budgetMin: fresh.budgetMin || '', budgetMax: fresh.budgetMax || '' };
      } catch {
        // fall back to the snapshot we already have
      }
      // Follows drive connected-reach ranking; merge categories into prefs
      // without wiping an existing budget range.
      await Promise.all(
        selectedAuthors.map((authorId) => httpApi.post('/follows/toggle', { brand_id: `brand-${authorId}` }).catch(() => null))
      );
      await httpApi.put('/preferences', {
        categories: selectedCategories,
        budgetMin: budget.budgetMin,
        budgetMax: budget.budgetMax,
      });
      setIsOpen(false);
      if (onComplete) onComplete();
    } catch (e) {
      console.error('Failed to save preferences', e);
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
      onClose={() => setIsOpen(false)} // Can close to skip
      title={step === 1 ? 'Personalize Your Feed' : 'What industries interest you?'}
      closeOnClickOutside={false}
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Skip for now</Button>
          {step === 1 ? (
            <Button variant="primary" onClick={() => setStep(2)}>Next</Button>
          ) : (
            <Button variant="primary" onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Finish Setup'}
            </Button>
          )}
        </>
      }
    >
      {step === 1 && (
        <div>
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
    </Modal>
  );
}
