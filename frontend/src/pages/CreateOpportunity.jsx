import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { opportunitiesApi } from "../api/client";

export default function CreateOpportunity() {
  const navigate = useNavigate();
  const [type, setType] = useState("Franchise");
  const [headline, setHeadline] = useState("");
  const [capital, setCapital] = useState("");
  const [roi, setRoi] = useState("");
  const [category, setCategory] = useState("Food & Beverage");
  const [description, setDescription] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
    setBusy(true);
    try {
      const res = await opportunitiesApi.create({
        type,
        category,
        headline: headline.trim(),
        capital_required: capital.trim(),
        roi: roi.trim(),
        description: description.trim(),
        image: imageUrl || undefined,
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

  const categories = ["Food & Beverage", "Beauty & Wellness", "Health & Fitness", "Services & Logistics", "Education", "Fashion & Apparel"];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-semibold text-[#0B1F3A]">Post an Opportunity</h1>
      <p className="text-sm text-slate-500 mt-1">Saved to MySQL via Laravel. It appears instantly at the top of the feed.</p>

      {error && <p className="mt-4 text-sm text-[#DC2626] bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

      <form onSubmit={submit} className="mt-6 bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex gap-2">
          {["Franchise", "Wholesale", "Resell"].map((t) => (
            <button key={t} type="button" onClick={() => setType(t)} className={`px-4 py-1.5 rounded-full text-sm font-medium border ${type === t ? "bg-[#0B1F3A] text-white border-[#0B1F3A]" : "bg-white text-slate-600 border-slate-200"}`}>{t}</button>
          ))}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Headline *</label>
          <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Premium Coffee Franchise — High Foot Traffic" className="mt-1 w-full border border-slate-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2.5 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Capital Required *</label>
            <input value={capital} onChange={(e) => setCapital(e.target.value)} placeholder="₱850K" className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">ROI / Margin *</label>
            <input value={roi} onChange={(e) => setRoi(e.target.value)} placeholder="28% ROI" className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white">
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Description * ({description.length}/2000)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={4} placeholder="Describe support, location, payback..." className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm resize-none" />
        </div>

        <div className="flex gap-2">
          {["image", "video"].map((m) => (
            <button key={m} type="button" onClick={() => setMediaType(m)} className={`px-4 py-1.5 rounded-full text-sm font-medium border capitalize ${mediaType === m ? "bg-[#2563EB] text-white border-[#2563EB]" : "bg-white text-slate-600 border-slate-200"}`}>{m}</button>
          ))}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Media URL (optional)</label>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://... image or mp4" className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
          {imageUrl && <img src={imageUrl} alt="preview" className="mt-3 w-full h-48 object-cover rounded-lg border border-slate-100" onError={(e) => { e.target.style.display = "none"; }} />}
        </div>

        <button type="submit" disabled={busy} className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-blue-300 text-white text-sm font-medium py-3 rounded-lg transition-colors">{busy ? "Publishing..." : "Publish Opportunity"}</button>
      </form>
    </div>
  );
}
