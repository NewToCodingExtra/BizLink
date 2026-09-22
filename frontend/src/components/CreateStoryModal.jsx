import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { api } from '../api/client';

export default function CreateStoryModal({ isOpen, onClose, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [duration, setDuration] = useState(0);

  const handleMediaCheck = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 60) {
          setError("Video must be 60 seconds or less.");
        } else {
          setError(null);
          setDuration(video.duration);
          // For demo, we just use a placeholder video URL if they select one
          setMediaUrl("https://www.w3schools.com/html/mov_bbb.mp4");
        }
      };
      video.src = URL.createObjectURL(file);
    } else {
      setError(null);
      setDuration(0);
      setMediaUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!mediaUrl) {
      setError("Please select media.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api('/stories', {
        method: 'POST',
        body: JSON.stringify({
          media_url: mediaUrl,
          caption,
          duration: duration || null,
        })
      });
      onClose();
      if (onComplete) onComplete();
    } catch (e) {
      setError(e.message || 'Failed to create story.');
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
          <Button variant="primary" onClick={handleSave} disabled={loading || !!error || !mediaUrl}>
            {loading ? 'Posting...' : 'Post Story'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
        
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
            Media (Image or Video)
          </label>
          <input 
            type="file" 
            accept="image/*,video/*"
            onChange={handleMediaCheck}
            className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-xs text-text-secondary mt-2">Videos must be 60 seconds or less.</p>
        </div>

        {mediaUrl && (
          <div className="mt-4 rounded-lg overflow-hidden border border-[var(--color-border)] aspect-[9/16] max-w-[240px] mx-auto bg-black">
            {duration > 0 ? (
              <video src={mediaUrl} className="w-full h-full object-cover" controls />
            ) : (
              <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
            Caption (Optional)
          </label>
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            rows={3}
            className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[var(--color-bg)]"
            placeholder="Write something..."
          />
        </div>
      </div>
    </Modal>
  );
}
