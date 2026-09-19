import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateOpportunity({ onCreate }) {
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

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (!headline.trim() || !capital.trim() || !roi.trim() || !description.trim()) { setError("Please fill required fields."); return; }
    if (description.length > 280) { setError("Description must be within 280 characters."); return; }
    const newPost = {
      id: `opp-${Date.now()}`,
      brandName: "Your Brand",
      brandAvatar: "https://i.pravatar.cc/100?img=12",
      brandId: "brand-me",
      type, category, headline: headline.trim(),
      capitalRequired: capital.trim(), roi: roi.trim(),
      description: description.trim(),
      image: imageUrl || "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80&auto=format&fit=crop",
      mediaType,
      videoUrl: mediaType==="video" ? (imageUrl || "https://videos.pexels.com/video-files/5310859/5310859-uhd_2560_1440_25fps.mp4") : undefined,
      featured: false, verified: false, likes: 0, liked:false, saves:0, isNew:true, createdAt: Date.now(),
    };
    onCreate(newPost);
    navigate("/");
  };

  const categories = ["Food & Beverage","Beauty & Wellness","Health & Fitness","Services & Logistics","Education","Fashion & Apparel"];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-semibold text-[#0B1F3A]">Post an Opportunity</h1>
      <p className="text-sm text-slate-500 mt-1">Create a franchise, wholesale or resell listing. It will appear instantly at the top of the feed.</p>

      {error && <p className="mt-4 text-sm text-[#DC2626] bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

      <form onSubmit={submit} className="mt-6 bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex gap-2">
          {["Franchise","Wholesale","Resell"].map(t => (
            <button key={t} type="button" onClick={()=>setType(t)} className={`px-4 py-1.5 rounded-full text-sm font-medium border ${type===t ? "bg-[#0B1F3A] text-white border-[#0B1F3A]" : "bg-white text-slate-600 border-slate-200"}`}>{t}</button>
          ))}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Headline *</label>
          <input value={headline} onChange={e=>setHeadline(e.target.value)} placeholder="e.g. Premium Coffee Franchise — High Foot Traffic" className="mt-1 w-full border border-slate-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2.5 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Capital Required *</label>
            <input value={capital} onChange={e=>setCapital(e.target.value)} placeholder="₱850K" className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">ROI / Margin *</label>
            <input value={roi} onChange={e=>setRoi(e.target.value)} placeholder="28% ROI" className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Category</label>
          <select value={category} onChange={e=>setCategory(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white">
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Description * ({description.length}/280)</label>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} maxLength={280} rows={4} placeholder="Describe support, location, payback..." className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm resize-none" />
        </div>

        <div className="flex gap-2">
          {["image","video"].map(m => (
            <button key={m} type="button" onClick={()=>setMediaType(m)} className={`px-4 py-1.5 rounded-full text-sm font-medium border capitalize ${mediaType===m ? "bg-[#2563EB] text-white border-[#2563EB]" : "bg-white text-slate-600 border-slate-200"}`}>{m}</button>
          ))}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Media URL (optional — object URL mocked)</label>
          <input value={imageUrl} onChange={e=>setImageUrl(e.target.value)} placeholder="https://... image or mp4" className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
          {imageUrl && <img src={imageUrl} alt="preview" className="mt-3 w-full h-48 object-cover rounded-lg border border-slate-100" onError={e=>e.target.style.display='none'} />}
        </div>

        <button type="submit" className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium py-3 rounded-lg transition-colors">Publish Opportunity</button>
      </form>
    </div>
  );
}
