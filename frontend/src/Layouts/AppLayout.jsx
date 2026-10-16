import { useEffect, useRef } from "react";
import { usePage } from "@inertiajs/react";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import Footer from "../components/Footer";
import GlobalModals from "../components/GlobalModals";
import { useToast } from "../context/ToastContext";

export default function AppLayout({ children }) {
  const page = usePage();
  const { flash } = page.props;
  const toast = useToast();
  // Full-bleed canvases: no footer under the reels snap feed or the admin
  // console (both read stray footers as whitespace; admin stays desktop-first).
  const pathname = page.url.split("?")[0];
  const isDirectMessageThread = pathname.startsWith("/messages/") && pathname !== "/messages";
  const isReels = pathname.startsWith("/reels");
  const hideFooter = isReels || pathname.startsWith("/admin") || pathname.startsWith("/messages");
  const hideBottomNav = isDirectMessageThread || pathname.startsWith("/admin");
  const mainPadding = (isDirectMessageThread || isReels)
    ? "pb-0"
    : "pb-24 md:pb-[max(1rem,env(safe-area-inset-bottom))]";
  // Toast-once guard: flash props persist across client-side visits and the
  // toast object is referentially unstable, so neither seen-state nor the
  // effect deps alone prevent repeats. Ref records the last toasted key.
  const lastToasted = useRef(null);
  const toastRef = useRef(null);

  // Back/forward cache guard: Safari restores the previous DOM without a
  // request, showing whoever was logged in before. Reload forces fresh auth.
  useEffect(() => {
    const onPageShow = (e) => {
      if (e.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  // Server flash messages (redirects) surface as toasts, once each.
  useEffect(() => {
    toastRef.current = toast;
    const key = `${flash?.success || ""}|${flash?.error || ""}`;
    if (!key || key === "|" || lastToasted.current === key) return;
    lastToasted.current = key;
    if (flash?.success) toastRef.current.success(flash.success);
    if (flash?.error) toastRef.current.error(flash.error);
  }, [toast, flash]);

  return (
    <div className="min-h-dvh bg-[var(--color-bg)] text-[var(--color-text-primary)] flex flex-col overflow-x-clip">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:bg-surface focus:text-text-primary focus:px-4 focus:py-2 focus:rounded-lg focus:border focus:border-border"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" className={`flex-1 min-w-0 ${mainPadding}`}>{children}</main>
      {!hideBottomNav && <BottomNav />}
      {!hideFooter && <Footer />}
      <GlobalModals />
    </div>
  );
}
