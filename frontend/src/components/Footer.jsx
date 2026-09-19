import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-[#0B1F3A] text-slate-300 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#C9A24B] grid place-items-center text-[#0B1F3A] font-extrabold text-sm">B</span>
              <span className="text-white font-bold text-lg tracking-tight">BuseLink</span>
            </div>
            <p className="text-sm text-slate-400 mt-3 max-w-md leading-relaxed">Bridging Brands and Business Owners — connecting franchisers and wholesalers with aspiring buyers through verified opportunities and direct matchmaking.</p>
            <p className="text-sm text-slate-400 mt-3">Contact: hello@buselink.ph · +63 917 000 0000</p>
            <div className="flex gap-3 mt-4">
              <a href="#" aria-label="Facebook" className="w-8 h-8 rounded-full bg-white/10 grid place-items-center hover:bg-white/15 transition-colors text-white text-sm">f</a>
              <a href="#" aria-label="Instagram" className="w-8 h-8 rounded-full bg-white/10 grid place-items-center hover:bg-white/15 transition-colors text-white text-sm">◎</a>
              <a href="#" aria-label="LinkedIn" className="w-8 h-8 rounded-full bg-white/10 grid place-items-center hover:bg-white/15 transition-colors text-white text-sm">in</a>
            </div>
          </div>
          <div>
            <p className="text-white text-sm font-semibold">Explore</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">Feed</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link to="/reels" className="hover:text-white transition-colors">Reels</Link></li>
              <li><Link to="/search" className="hover:text-white transition-colors">Search</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white text-sm font-semibold">Support</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/settings/preferences" className="hover:text-white transition-colors">Preferences</Link></li>
              <li><Link to="/saved" className="hover:text-white transition-colors">Saved Opportunities</Link></li>
              <li><Link to="/messages" className="hover:text-white transition-colors">Consultation Inbox</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} BuseLink. All rights reserved.</p>
          <p className="text-xs text-slate-500">Verified Brands · Direct Matchmaking · Nationwide Reach</p>
        </div>
      </div>
    </footer>
  );
}
