import { useRef, useState } from 'react';
import { useForm, Head } from '@inertiajs/react';
import { useToast } from '../context/ToastContext';

const CATEGORIES = ['Food & Beverage', 'Beauty & Wellness', 'Health & Fitness', 'Services & Logistics', 'Education', 'Fashion & Apparel', 'Home & Living'];
function csrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

// Inline multipart upload to /uploads (expects { url, media_type, ... }).
// XHR is used so the progress bar keeps working (fetch has no upload progress).
function uploadToServer(file, onProgress) {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append('file', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/uploads');
    xhr.setRequestHeader('X-CSRF-TOKEN', csrfToken());
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.withCredentials = true;
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && onProgress) onProgress(Math.round((ev.loaded / ev.total) * 100));
    };
    xhr.onload = () => {
      let json = null;
      try {
        json = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        json = null;
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(json || {});
      else reject(new Error(json?.message || `Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(fd);
  });
}

export default function CreateOpportunity() {
  const fileRef = useRef(null);
  const toast = useToast();
  const { data, setData, post, processing, errors, setError, clearErrors } = useForm({
    type: 'Franchise',
    category: 'Food & Beverage',
    headline: '',
    capital_amount: '',
    roi_percent: '',
    description: '',
    image: '',
    media_type: 'image',
    video_url: '',
    brand_name: '',
    brand_avatar: '',
  });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [disk, setDisk] = useState('');

  const handleBlur = (field, e) => {
    if (!e.target.checkValidity()) {
      setError(field, e.target.validationMessage);
    } else {
      clearErrors(field);
    }
  };

  const getInputClass = (field, extraClass = "") => {
    const base = `mt-1 w-full border outline-none rounded-lg px-3 py-2.5 text-sm transition-colors ${extraClass}`;
    return errors[field]
      ? `${base} border-error focus:border-error focus:ring-2 focus:ring-error/20 bg-error/5`
      : `${base} border-border focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 bg-transparent`;
  };

  const preview = data.media_type === 'video' ? data.video_url : data.image;

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Client-side guard only (the server re-checks everything):
    // videos up to 100MB, images up to 20MB.
    const isVideoPicked = (file.type || '').startsWith('video');
    const maxBytes = isVideoPicked ? 100 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(isVideoPicked ? 'Video must be under 100MB.' : 'Image must be under 20MB.');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const res = await uploadToServer(file, setProgress);
      const mediaType = res.media_type || (file.type.startsWith('video') ? 'video' : 'image');
      setData('media_type', mediaType);
      if (mediaType === 'video') {
        setData('video_url', res.url || '');
        setData('image', '');
      } else {
        setData('image', res.url || '');
        setData('video_url', '');
      }
      setProgress(100);
      setDisk(res.disk === 'gcs' ? 'Stored in Google Cloud Storage' : res.disk ? String(res.disk) : 'Upload complete.');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onPasteUrl = (value) => {
    if (data.media_type === 'video') setData('video_url', value);
    else setData('image', value);
    setDisk('');
  };

  const submit = (e) => {
    e.preventDefault();
    if (!data.headline.trim() || String(data.capital_amount ?? '').trim() === '' || String(data.roi_percent ?? '').trim() === '' || !data.description.trim()) {
      toast.error('Please fill required fields.');
      return;
    }
    if (data.description.length > 2000) {
      toast.error('Description must be within 2000 characters.');
      return;
    }
    if (uploading) {
      toast.error('Wait for the upload to finish.');
      return;
    }
    // Server creates the post and redirects to it; no client navigation.
    post('/opportunities', {
      onError: (errs) => {
        const first = errs ? Object.values(errs).flat()[0] : null;
        if (first) toast.error(first);
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <Head title="Post an Opportunity" />
      <h1 className="text-2xl font-semibold text-text-primary">Post an Opportunity</h1>
      <p className="text-sm text-text-secondary mt-1">Saved to MySQL via Laravel. Images and videos go to Google Cloud Storage when configured, otherwise the app server.</p>

      <form onSubmit={submit} className="mt-6 bg-surface rounded-xl border border-border shadow-sm p-6 space-y-4">
        <div className="flex gap-2">
          {['Franchise', 'Wholesale', 'Resell'].map((t) => (
            <button key={t} type="button" onClick={() => setData('type', t)} className={`px-4 py-1.5 rounded-full text-sm font-medium border ${data.type === t ? 'bg-primary text-white border-[#0B1F3A]' : 'bg-surface text-text-secondary border-border'}`}>{t}</button>
          ))}
        </div>
        {errors.type && <p className="text-xs text-error">{errors.type}</p>}

        <div>
          <label className="text-sm font-medium text-text-primary">Headline *</label>
          <input value={data.headline} onChange={(e) => setData('headline', e.target.value)} onBlur={(e) => handleBlur('headline', e)} required placeholder="e.g. Premium Coffee Franchise — High Foot Traffic" className={getInputClass('headline')} />
          {errors.headline && <p className="mt-1 text-xs text-error">{errors.headline}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-text-primary">Capital Required (₱) *</label>
            <input type="number" min="0" step="1" value={data.capital_amount} onChange={(e) => setData('capital_amount', e.target.value)} onBlur={(e) => handleBlur('capital_amount', e)} required placeholder="850000" className={getInputClass('capital_amount')} />
            {errors.capital_amount && <p className="mt-1 text-xs text-error">{errors.capital_amount}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-text-primary">ROI / Margin (%) *</label>
            <input type="number" min="0" max="1000" step="0.1" value={data.roi_percent} onChange={(e) => setData('roi_percent', e.target.value)} onBlur={(e) => handleBlur('roi_percent', e)} required placeholder="28" className={getInputClass('roi_percent')} />
            {errors.roi_percent && <p className="mt-1 text-xs text-error">{errors.roi_percent}</p>}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-text-primary">Category</label>
          <select value={data.category} onChange={(e) => setData('category', e.target.value)} className={getInputClass('category', 'bg-surface text-text-primary')}>
            {CATEGORIES.map((c) => <option key={c} value={c} className="bg-surface text-text-primary">{c}</option>)}
          </select>
          {errors.category && <p className="mt-1 text-xs text-error">{errors.category}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-text-primary">Description * ({data.description.length}/2000)</label>
          <textarea value={data.description} onChange={(e) => setData('description', e.target.value)} onBlur={(e) => handleBlur('description', e)} required maxLength={2000} rows={4} placeholder="Describe support, location, payback..." className={getInputClass('description', 'resize-none')} />
          {errors.description && <p className="mt-1 text-xs text-error">{errors.description}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-text-primary">Media</label>
          <input ref={fileRef} type="file" accept="image/*,video/mp4,video/quicktime" onChange={onPickFile} className="hidden" />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-light disabled:opacity-60 transition-colors">
              {uploading ? `Uploading ${progress}%...` : 'Upload photo / video'}
            </button>
            <span className="text-xs text-text-secondary">JPG, PNG, WebP, GIF up to 20MB · MP4, MOV up to 100MB</span>
          </div>
          {uploading && (
            <div className="mt-2 h-2 rounded-full bg-bg overflow-hidden">
              <div className="h-full bg-action transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
          {disk && !uploading && <p className="mt-2 text-xs text-success">{disk}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-text-primary">...or paste a media URL</label>
          <input value={preview || ''} onChange={(e) => onPasteUrl(e.target.value)} onBlur={(e) => handleBlur(data.media_type === 'video' ? 'video_url' : 'image', e)} placeholder="https://... image or mp4" className={getInputClass(data.media_type === 'video' ? 'video_url' : 'image')} />
          {(errors.image || errors.video_url) && <p className="mt-1 text-xs text-error">{errors.image || errors.video_url}</p>}
          {preview && data.media_type === 'image' && <img src={preview} alt="preview" className="mt-3 w-full h-48 object-cover rounded-lg border border-border" onError={(e) => { e.target.style.display = 'none'; }} />}
          {preview && data.media_type === 'video' && <video src={preview} controls className="mt-3 w-full h-48 object-cover rounded-lg border border-border" />}
        </div>

        <button type="submit" disabled={processing || uploading} className="w-full bg-action hover:bg-action-hover disabled:bg-blue-300 text-white text-sm font-medium py-3 rounded-lg transition-colors">{processing ? 'Publishing...' : 'Publish Opportunity'}</button>
      </form>
    </div>
  );
}
