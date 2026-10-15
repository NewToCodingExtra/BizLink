import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useToast } from "./ToastContext";

const ShareContext = createContext(null);

export function ShareProvider({ children }) {
  const [shareData, setShareData] = useState(null);
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const copyTimeoutRef = useRef(null);

  const share = useCallback((data) => {
    if (!data) return;
    const url = data.url || (typeof window !== "undefined" ? window.location.pathname + window.location.search : "");
    const title = data.title || "BizLink";
    const text = data.text || "";

    // Resolve relative URL dynamically against active origin so it works in any deployment
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const resolvedUrl = url.startsWith("http://") || url.startsWith("https://")
      ? url
      : `${origin}${url.startsWith("/") ? "" : "/"}${url}`;

    setShareData({
      title,
      text,
      url: resolvedUrl,
      relativeUrl: url.startsWith("http") ? url.replace(origin, "") : (url.startsWith("/") ? url : `/${url}`),
    });
    setCopied(false);
  }, []);

  const closeShare = useCallback(() => {
    setShareData(null);
    setCopied(false);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!shareData?.url) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareData.url);
      } else {
        // Fallback for older browsers
        const el = document.createElement("textarea");
        el.value = shareData.url;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      toast.success("Link copied to clipboard!");
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Could not copy link.");
    }
  }, [shareData, toast]);

  const handleNativeShare = useCallback(async () => {
    if (!shareData) return;
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          url: shareData.url,
        });
        closeShare();
      } catch (err) {
        // User cancelled or aborted native share sheet - do not treat as error
        if (err.name !== "AbortError") {
          toast.error("Share failed");
        }
      }
    } else {
      handleCopy();
    }
  }, [shareData, closeShare, handleCopy, toast]);

  // Social share URLs
  const getSocialLinks = () => {
    if (!shareData) return [];
    const encodedUrl = encodeURIComponent(shareData.url);
    const encodedTitle = encodeURIComponent(shareData.title || "");
    const encodedText = encodeURIComponent(shareData.text || shareData.title || "");

    return [
      {
        id: "facebook",
        name: "Facebook",
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        color: "bg-[#1877F2] text-white hover:bg-[#166fe5]",
        icon: (
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        ),
      },
      {
        id: "twitter",
        name: "X (Twitter)",
        href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
        color: "bg-black text-white hover:bg-neutral-800 dark:border dark:border-white/20",
        icon: (
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        ),
      },
      {
        id: "whatsapp",
        name: "WhatsApp",
        href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
        color: "bg-[#25D366] text-white hover:bg-[#20ba5a]",
        icon: (
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
        ),
      },
      {
        id: "telegram",
        name: "Telegram",
        href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
        color: "bg-[#229ED9] text-white hover:bg-[#1e8ec3]",
        icon: (
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.197 1.006.128.832.942z" />
          </svg>
        ),
      },
      {
        id: "linkedin",
        name: "LinkedIn",
        href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        color: "bg-[#0A66C2] text-white hover:bg-[#095196]",
        icon: (
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
          </svg>
        ),
      },
      {
        id: "email",
        name: "Email",
        href: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`,
        color: "bg-neutral-600 text-white hover:bg-neutral-700",
        icon: (
          <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        ),
      },
    ];
  };

  const hasNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <ShareContext.Provider value={{ share }}>
      {children}
      {shareData && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[125] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={closeShare}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-modal-title"
            className="w-full sm:max-w-md bg-[var(--color-surface)] border-t sm:border border-[var(--color-border)] rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col gap-4 animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 max-h-[92dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Sheet Pull indicator */}
            <div className="sm:hidden -mt-1 pb-1 flex justify-center shrink-0">
              <div className="w-12 h-1.5 bg-[var(--color-border)] rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-action/15 text-action flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <div>
                  <h3 id="share-modal-title" className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] leading-tight">
                    Share
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] truncate max-w-[220px] sm:max-w-xs mt-0.5">
                    {shareData.title}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeShare}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Native device share quick action on mobile */}
            {hasNativeShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-action text-white font-semibold text-sm shadow-sm hover:bg-action-hover active:scale-[0.98] transition-all cursor-pointer min-h-[44px]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span>Share via Device Apps...</span>
              </button>
            )}

            {/* Platform Buttons Grid */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2.5 px-0.5">
                Share to platforms
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-2.5">
                {getSocialLinks().map((platform) => (
                  <a
                    key={platform.id}
                    href={platform.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => closeShare()}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl ${platform.color} transition-all active:scale-[0.97] min-h-[68px] gap-1.5 shadow-sm text-center`}
                  >
                    {platform.icon}
                    <span className="text-[11px] font-semibold tracking-tight">{platform.name}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Link Copy Box (relative / deployment-ready) */}
            <div className="pt-2 border-t border-[var(--color-border)]/70">
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                Page link
              </label>
              <div className="flex items-center gap-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-1.5 pl-3">
                <span className="text-xs text-[var(--color-text-primary)] truncate font-mono select-all flex-1 min-w-0">
                  {shareData.url}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`px-3.5 py-2 min-h-[38px] rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    copied
                      ? "bg-success text-white"
                      : "bg-action hover:bg-action-hover text-white active:scale-95"
                  }`}
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </ShareContext.Provider>
  );
}

export function useShare() {
  const ctx = useContext(ShareContext);
  if (!ctx) {
    // Fallback if rendered outside provider
    return (data) => {
      const url = data?.url || (typeof window !== "undefined" ? window.location.href : "");
      if (typeof navigator !== "undefined" && navigator.share) {
        navigator.share({ title: data?.title, text: data?.text, url }).catch(() => {});
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => alert("Link copied to clipboard!")).catch(() => {});
      }
    };
  }
  return ctx.share;
}
