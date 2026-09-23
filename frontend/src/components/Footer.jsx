import { Link, usePage } from '@inertiajs/react';
import markUrl from '../assets/bizlink-mark.svg';

export default function Footer() {
  const { url } = usePage();
  const flush = url === '/reels' || url.startsWith('/stories/');
  return (
    <footer className={`bg-primary text-slate-300 ${flush ? "mt-0" : "mt-16"}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 lg:col-span-4">
            <div className="flex items-center gap-2">
              <img src={markUrl} alt="BizLink" className="w-8 h-8 rounded-lg" />
              <span className="font-bold text-lg tracking-tight"><span className="text-white">Biz</span><span className="text-accent">Link</span></span>
            </div>
            <p className="text-sm text-text-secondary mt-3 max-w-md leading-relaxed">Bridging Brands and Business Owners — connecting franchisers and wholesalers with aspiring buyers through verified opportunities and direct matchmaking.</p>
            <p className="text-sm text-text-secondary mt-3">Contact: hello@bizlink.ph · +63 917 000 0000</p>
            <div className="flex gap-3 mt-4">
              <a href="#" aria-label="Facebook" className="w-8 h-8 rounded-full bg-surface/10 grid place-items-center hover:bg-surface/15 transition-colors text-white text-sm">f</a>
              <a href="#" aria-label="Instagram" className="w-8 h-8 rounded-full bg-surface/10 grid place-items-center hover:bg-surface/15 transition-colors text-[var(--color-text-primary)] text-sm">◎</a>
              <a href="#" aria-label="LinkedIn" className="w-8 h-8 rounded-full bg-surface/10 grid place-items-center hover:bg-surface/15 transition-colors text-white text-sm">in</a>
            </div>
          </div>
          <div className="md:col-span-2 lg:col-span-2 lg:col-start-7">
            <p className="text-white text-sm font-semibold">Explore</p>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">Feed</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="/reels" className="hover:text-white transition-colors">Reels</Link></li>
              <li><Link href="/search" className="hover:text-white transition-colors">Search</Link></li>
            </ul>
          </div>
          <div className="md:col-span-2 lg:col-span-2">
            <p className="text-white text-sm font-semibold">Support</p>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/settings/preferences" className="hover:text-white transition-colors">Preferences</Link></li>
              <li><Link href="/saved" className="hover:text-white transition-colors">Saved Opportunities</Link></li>
              <li><Link href="/messages" className="hover:text-white transition-colors">Consultation Inbox</Link></li>
            </ul>
          </div>
          <div className="md:col-span-3 lg:col-span-2">
            <p className="text-white text-sm font-semibold">Terms &amp; Agreements</p>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/acceptable-use" className="hover:text-white transition-colors">Acceptable Use</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-text-secondary">© {new Date().getFullYear()} BizLink. All rights reserved.</p>
          <p className="text-xs text-text-secondary">Verified Brands · Direct Matchmaking · Nationwide Reach</p>
        </div>
      </div>
    </footer>
  );
}


