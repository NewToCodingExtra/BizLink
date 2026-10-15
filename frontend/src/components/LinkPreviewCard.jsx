import { useEffect, useState } from "react";
import { LinkIcon } from "./icons";
import { http } from "../utils/http";

const URL_REGEX = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/i;

export function extractUrl(text) {
  if (!text) return null;
  const match = text.match(URL_REGEX);
  return match ? match[1] : null;
}

export function renderWithLinks(text, isMe = false) {
  if (!text) return null;
  const parts = text.split(/(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/gi);
  return parts.map((part, i) => {
    if (URL_REGEX.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`underline underline-offset-2 break-all ${
            isMe ? "text-white font-medium hover:text-white/90" : "text-action hover:underline"
          }`}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export default function LinkPreviewCard({ url, dark = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [imgSrc, setImgSrc] = useState(null);
  const [imgFailed, setImgFailed] = useState(false);
  const [triedProxy, setTriedProxy] = useState(false);

  useEffect(() => {
    if (!url) return;
    let active = true;

    http("/link-preview", {
      method: "POST",
      body: { url },
    })
      .then((res) => {
        if (!active) return;
        const preview = res?.data ?? res;
        if (preview && (preview.title || preview.description)) {
          setData(preview);
          if (preview.image) {
            setImgSrc(preview.image);
            setImgFailed(false);
            setTriedProxy(false);
          } else {
            setImgFailed(true);
          }
        } else {
          setFailed(true);
        }
      })
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [url]);

  const handleImageError = () => {
    // If direct load failed (e.g. Brave shields or CDN Referer block), try server proxy
    if (!triedProxy && data?.image) {
      setTriedProxy(true);
      setImgSrc(`/link-preview/image?url=${encodeURIComponent(data.image)}`);
    } else {
      setImgFailed(true);
    }
  };

  if (loading || failed || !data) return null;

  let domain = "";
  try {
    domain = new URL(url).hostname.replace(/^www\./, "");
  } catch {}

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block mt-2 rounded-xl overflow-hidden border transition-all hover:opacity-95 ${
        dark
          ? "bg-black/20 border-white/20 text-white"
          : "bg-bg border-border text-text-primary hover:border-action/40"
      }`}
    >
      {imgSrc && !imgFailed && (
        <div className="w-full h-32 sm:h-36 overflow-hidden bg-black/10">
          <img
            src={imgSrc}
            alt={data.title || "Link preview"}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        </div>
      )}
      <div className="p-2.5">
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-semibold tracking-wider text-text-secondary mb-1">
          <LinkIcon className="w-3 h-3 text-action shrink-0" />
          <span className="truncate">{data.siteName || domain}</span>
        </div>
        {data.title && (
          <h4 className="text-xs font-semibold line-clamp-1 leading-snug">
            {data.title}
          </h4>
        )}
        {data.description && (
          <p className="text-[11px] text-text-secondary line-clamp-2 mt-0.5 leading-normal">
            {data.description}
          </p>
        )}
      </div>
    </a>
  );
}
