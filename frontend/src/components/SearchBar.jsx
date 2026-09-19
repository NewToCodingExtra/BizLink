import { useState, useEffect } from "react";

export default function SearchBar({ onSearch, placeholder="Search brands, categories..." }) {
  const [q, setQ] = useState("");

  // debounce 300ms
  useEffect(() => {
    if (q.trim() === "") return;
    const t = setTimeout(() => onSearch && onSearch(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const submit = (e) => {
    e.preventDefault();
    onSearch && onSearch(q);
  };

  return (
    <form onSubmit={submit} className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="M20 20L16.5 16.5" /></svg>
      </span>
      <input
        value={q}
        onChange={(e)=>setQ(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/10 md:bg-white border border-white/10 md:border-slate-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none text-sm md:text-sm text-white md:text-slate-700 placeholder:text-slate-400 rounded-full md:rounded-lg pl-9 pr-4 py-2.5 transition"
      />
    </form>
  );
}
