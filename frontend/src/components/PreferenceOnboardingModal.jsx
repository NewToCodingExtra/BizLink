import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { api } from '../api/client';

export default function PreferenceOnboardingModal({ user, onComplete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({ brands: [], categories: [] });
  const [step, setStep] = useState(1);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  useEffect(() => {
    if (!user) return;

    // Check if user has preferences
    const checkPreferences = async () => {
      try {
        const res = await api('/preferences');
        if (!res.data.brands?.length && !res.data.categories?.length) {
          // Add a small delay so it doesn't pop up too aggressively
          setTimeout(() => setIsOpen(true), 1500);
        }
      } catch (e) {
        console.error('Failed to fetch preferences', e);
      }
    };

    checkPreferences();
  }, [user]);

  const availableBrands = [
    { id: 'brand-1', name: 'Jollibee', category: 'Franchise' },
    { id: 'brand-2', name: 'McDonalds', category: 'Franchise' },
    { id: 'brand-3', name: 'Potato Corner', category: 'Franchise' },
    { id: 'brand-4', name: '7-Eleven', category: 'Franchise' },
    { id: 'brand-5', name: 'Unilever', category: 'Wholesale' },
    { id: 'brand-6', name: 'Procter & Gamble', category: 'Wholesale' },
    { id: 'brand-7', name: 'Nestle', category: 'Wholesale' },
    { id: 'brand-8', name: 'Avon', category: 'Resell' },
  ];

  const availableCategories = ['Food & Beverage', 'Retail', 'Health & Beauty', 'Services', 'Technology', 'Real Estate'];

  const handleSave = async () => {
    setLoading(true);
    try {
      await api('/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          brands: selectedBrands,
          categories: selectedCategories
        })
      });
      setIsOpen(false);
      if (onComplete) onComplete();
    } catch (e) {
      console.error('Failed to save preferences', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleBrand = (id) => {
    setSelectedBrands(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
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
            Select brands you want to follow. We'll prioritize their opportunities in your feed.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {availableBrands.map(brand => (
              <div
                key={brand.id}
                onClick={() => toggleBrand(brand.id)}
                className={`cursor-pointer border rounded-xl p-4 text-center transition-all ${selectedBrands.includes(brand.id)
                    ? 'border-[var(--color-action)] bg-[var(--color-action)]/5 ring-2 ring-[var(--color-action)]/20'
                    : 'border-[var(--color-border)] hover:border-[var(--color-action)]/50'
                  }`}
              >
                <div className="w-12 h-12 rounded-full bg-bg mx-auto mb-2 flex items-center justify-center text-xl font-bold text-text-secondary overflow-hidden">
                  {brand.name[0]}
                </div>
                <div className="font-medium text-sm text-[var(--color-text-primary)]">{brand.name}</div>
                <div className="text-xs text-[var(--color-text-secondary)]">{brand.category}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <p className="text-[var(--color-text-secondary)] mb-6">
            Select categories that match your business interests.
          </p>
          <div className="flex flex-wrap gap-3">
            {availableCategories.map(cat => (
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
