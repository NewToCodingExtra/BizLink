import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function CreateStoryModal({ isOpen, onClose, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const toast = useToast();

  const handleMediaCheck = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newItems = [];
    let errorCount = 0;

    files.forEach((file) => {
      const isVideo = file.type.startsWith('video/');
      const url = URL.createObjectURL(file);

      if (isVideo) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          if (video.duration > 60) {
            toast.error(`Video "${file.name}" must be 60 seconds or less.`);
            errorCount++;
          } else {
            setItems((prev) => [...prev, { file, url, type: 'video', duration: video.duration, caption: '' }]);
          }
        };
        video.src = url;
      } else {
        newItems.push({ file, url, type: 'image', duration: 0, caption: '' });
      }
    });

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
    }
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCaption = (index, text) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index].caption = text;
      return updated;
    });
  };

  const handleSave = async () => {
    if (items.length === 0) {
      toast.error("Please select at least one media.");
      return;
    }
    setLoading(true);
    let successCount = 0;
    try {
      for (const item of items) {
        // Upload logic should handle file upload, here we simulate with dummy URL or createObjectURL
        // In real app, you'd upload item.file to storage and get a URL back.
        // We'll just pass item.url for demo purposes or hardcode video url if video
        const finalUrl = item.type === 'video' ? "https://www.w3schools.com/html/mov_bbb.mp4" : item.url;
        await api('/stories', {
          method: 'POST',
          body: JSON.stringify({
            media_url: finalUrl,
            caption: item.caption,
            duration: item.duration || null,
          })
        });
        successCount++;
      }
      toast.success(`Successfully posted ${successCount} stor${successCount === 1 ? 'y' : 'ies'}.`);
      onClose();
      if (onComplete) onComplete();
    } catch (e) {
      toast.error(e.message || 'Failed to create stories.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Story"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={loading || items.length === 0}>
            {loading ? 'Posting...' : `Post ${items.length} ${items.length === 1 ? 'Story' : 'Stories'}`}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
            Media (Images or Videos)
          </label>
          <input 
            type="file" 
            accept="image/*,video/*"
            multiple
            onChange={handleMediaCheck}
            className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-[var(--color-action)]/10 file:text-[var(--color-action)] hover:file:bg-[var(--color-action)]/20"
          />
          <p className="text-xs text-text-secondary mt-2">Select multiple files to post them together. Videos must be 60s max.</p>
        </div>

        {items.length > 0 && (
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {items.map((item, index) => (
              <div key={index} className="flex-shrink-0 w-60 flex flex-col gap-2">
                <div className="relative rounded-xl overflow-hidden border border-[var(--color-border)] aspect-[9/16] bg-black group">
                  {item.type === 'video' ? (
                    <video src={item.url} className="w-full h-full object-cover" controls />
                  ) : (
                    <img src={item.url} alt="Preview" className="w-full h-full object-cover" />
                  )}
                  <button 
                    onClick={() => removeItem(index)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-[var(--color-text-primary)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <textarea
                  value={item.caption}
                  onChange={e => updateCaption(index, e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border-[var(--color-border)] shadow-sm focus:border-[var(--color-action)] focus:ring-[var(--color-action)] sm:text-xs bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                  placeholder="Caption this..."
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
