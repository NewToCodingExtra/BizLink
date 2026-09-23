import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi, uploadFile } from "../api/client";

export default function EditProfile() {
  const { user, setUser } = useAuth();
  const fileRef = useRef(null);
  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    authApi
      .me()
      .then((res) => {
        setUser(res.user);
        setName(res.user.name || "");
        setAvatar(res.user.avatar || "");
        setBio(res.user.bio || "");
      })
      .catch(() => {});
  }, [setUser]);

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Profile photos must be images.");
      return;
    }
    setError("");
    setUploading(true);
    setProgress(0);
    try {
      const res = await uploadFile(file, setProgress);
      setAvatar(res.url);
      setSaved(false);
    } catch (err) {
      setError(err.message || "Photo upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await authApi.updateProfile({ name: name.trim(), avatar: avatar.trim() || null, bio: bio.trim() || null });
      setUser(res.user);
      setSaved(true);
    } catch (err) {
      const errors = err?.data?.errors;
      const first = errors ? Object.values(errors).flat()[0] : null;
      setError(first || err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <Link to="/profile/me" className="text-sm text-text-secondary hover:text-text-primary">← Back to profile</Link>
      <h1 className="text-2xl font-semibold text-primary mt-2">Edit profile</h1>
      <p className="text-sm text-text-secondary mt-1">How brands and entrepreneurs see you across BizLink.</p>

      {error && <p className="mt-4 text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">{error}</p>}
      {saved && <p className="mt-4 text-sm text-success bg-success/10 border border-success/20 rounded-lg px-3 py-2">Profile saved.</p>}

      <form onSubmit={submit} className="mt-6 bg-surface rounded-xl border border-border shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-4">
          <img src={avatar || "https://i.pravatar.cc/100?img=12"} alt="preview" className="w-16 h-16 rounded-full object-cover border border-border bg-bg" />
          <div className="flex-1">
            <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} className="hidden" />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="px-4 py-2 rounded-lg bg-surface border border-border text-text-primary text-sm font-medium hover:bg-bg disabled:opacity-60 transition-colors">
              {uploading ? `Uploading ${progress}%...` : "Upload photo"}
            </button>
            <p className="text-xs text-text-secondary mt-1.5">...or paste an image URL below</p>
          </div>
        </div>
        {uploading && (
          <div className="h-2 rounded-full bg-bg overflow-hidden">
            <div className="h-full bg-action transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-text-primary">Display name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={255} placeholder="Juan Dela Cruz" className="mt-1 w-full border border-border focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2.5 text-sm" />
        </div>

        <div>
          <label className="text-sm font-medium text-text-primary">Photo URL</label>
          <input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://..." className="mt-1 w-full border border-border focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2.5 text-sm" />
        </div>

        <div>
          <label className="text-sm font-medium text-text-primary">Bio ({bio.length}/500)</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} rows={3} placeholder="What do you do, and what are you looking for?" className="mt-1 w-full border border-border focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2.5 text-sm resize-none" />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-text-secondary">Signed in as <span className="font-medium text-text-secondary">{user?.email}</span> · Role <span className="font-medium text-text-secondary capitalize">{user?.role}</span></span>
        </div>

        <button type="submit" disabled={saving || uploading} className="w-full bg-action hover:bg-action-hover disabled:bg-blue-300 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}
