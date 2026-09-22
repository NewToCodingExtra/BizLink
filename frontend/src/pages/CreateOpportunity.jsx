import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { opportunitiesApi, uploadFile } from "../api/client";

export default function CreateOpportunity() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [type, setType] = useState("Franchise");
  const [headline, setHeadline] = useState("");
  const [capital, setCapital] = useState("");
  const [roi, setRoi] = useState("");
  const [category, setCategory] = useState("Food & Beverage");
  const [description, setDescription] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [disk, setDisk] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    setProgress(0);
    try {
      const res = await uploadFile(file, setProgress);
      setImageUrl(res.url);
      setMediaType(res.media_type || (file.type.startsWith("video") ? "video" : "image"));
      setDisk(res.disk === "gcs" ? "Stored in Google Cloud Storage" : "Stored on the app server");
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!headline.trim() || !capital.trim() || !roi.trim() || !description.trim()) {
      setError("Please fill required fields.");
      return;
    }
    if (description.length > 2000) {
      setError("Description must be within 2000 characters.");
      return;
    }
    if (uploading) {
      setError("Wait for the upload to finish.");
      return;
    }
    setBusy(true);
    try {
      const res = await opportunitiesApi.create({
        type,
        category,
        headline: headline.trim(),
        capital_required: capital.trim(),
        roi: roi.trim(),
        description: description.trim(),
        image: mediaType === "image" ? imageUrl || undefined : undefined,
        media_type: mediaType,
        video_url: mediaType === "video" ? imageUrl || undefined : undefined,
      });
      navigate(`/post/${res.data.id}`);
    } catch (err) {
      const errors = err?.data?.errors;
      const first = errors ? Object.values(errors).flat()[0] : null;
      setError(first || err.message || "Publish failed");
    } finally {
      setBusy(false);
    }
  };

  const categories = ["Food & Beverage", "Beauty & Wellness", "Health & Fitness", "Services & Logistics", "Education", "Fashion & Apparel", "Home & Living"];

  const preview = imageUrl || "";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-semibold text-primary">Post an Opportunity</h1>
      <p className="text-sm text-text-secondary mt-1">Saved to MySQL via Laravel. Images and videos go to Google Cloud Storage when configured, otherwise the app server.</p>

      {error && <p className="mt-4 text-sm text-[#DC2626] bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

      <form onSubmit={submit} className="mt-6 bg-surface rounded-xl border border-border shadow-sm p-6 space-y-4">
        <div className="flex gap-2">
          {["Franchise", "Wholesale", "Resell"].map((t) => (
            <button key={t} type="button" onClick={() => setType(t)} className={`px-4 py-1.5 rounded-full text-sm font-medium border ${type === t ? "bg-primary text-white border-[#0B1F3A]" : "bg-surface text-text-secondary border-border"}`}>{t}</button>
          ))}
        </div>

        <div>
          <label className="text-sm font-medium text-text-primary">Headline *</label>
          <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Premium Coffee Franchise — High Foot Traffic" className="mt-1 w-full border border-border focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2.5 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-text-primary">Capital Required *</label>
            <input value={capital} onChange={(e) => setCapital(e.target.value)} placeholder="₱850K" className="mt-1 w-full border border-border rounded-lg px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-text-primary">ROI / Margin *</label>
            <input value={roi} onChange={(e) => setRoi(e.target.value)} placeholder="28% ROI" className="mt-1 w-full border border-border rounded-lg px-3 py-2.5 text-sm" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-text-primary">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-surface">
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-text-primary">Description * ({description.length}/2000)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={4} placeholder="Describe support, location, payback..." className="mt-1 w-full border border-border rounded-lg px-3 py-2.5 text-sm resize-none" />
        </div>

        <div>
          <label className="text-sm font-medium text-text-primary">Media</label>
          <input ref={fileRef} type="file" accept="image/*,video/mp4,video/quicktime" onChange={onPickFile} className="hidden" />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-light disabled:opacity-60 transition-colors">
              {uploading ? `Uploading ${progress}%...` : "Upload photo / video"}
            </button>
            <span className="text-xs text-text-secondary">JPG, PNG, WebP, GIF, MP4 up to 20MB</span>
          </div>
          {uploading && (
            <div className="mt-2 h-2 rounded-full bg-bg overflow-hidden">
              <div className="h-full bg-action transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
          {disk && !uploading && <p className="mt-2 text-xs text-[#16A34A]">{disk}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-text-primary">...or paste a media URL</label>
          <input value={imageUrl} onChange={(e) => { setImageUrl(e.target.value); setDisk(""); }} placeholder="https://... image or mp4" className="mt-1 w-full border border-border rounded-lg px-3 py-2.5 text-sm" />
          {preview && mediaType === "image" && <img src={preview} alt="preview" className="mt-3 w-full h-48 object-cover rounded-lg border border-border" onError={(e) => { e.target.style.display = "none"; }} />}
          {preview && mediaType === "video" && <video src={preview} controls className="mt-3 w-full h-48 object-cover rounded-lg border border-border" />}
        </div>

        <button type="submit" disabled={busy || uploading} className="w-full bg-action hover:bg-action-hover disabled:bg-blue-300 text-white text-sm font-medium py-3 rounded-lg transition-colors">{busy ? "Publishing..." : "Publish Opportunity"}</button>
      </form>
    </div>
  );
}
