/**
 * Smart video thumbnails, Facebook-style.
 *
 * Facebook pre-renders several candidate frames per video (never blindly the
 * first — intros are often black) and serves the most representative one.
 * We do the client-side equivalent: seek to several fractions of the video,
 * score each frame by average luminance, and keep the brightest non-blank
 * frame. Results are cached per URL for the session.
 *
 * CORS: canvas capture needs CORS-enabled video hosts (same-origin uploads
 * and Pexels file CDN both qualify). On any failure we resolve null and the
 * caller falls back to the post image.
 */

const cache = new Map();

function lumaOf(frame, w, h) {
  let sum = 0;
  const n = frame.length / 4;
  const step = Math.max(1, Math.floor(n / 2000));
  let count = 0;
  for (let i = 0; i < n; i += step) {
    const o = i * 4;
    sum += 0.2126 * frame[o] + 0.7152 * frame[o + 1] + 0.0722 * frame[o + 2];
    count++;
  }
  void w; void h;
  return count ? sum / count : 0;
}

function loadVideo(url, timeoutMs = 9000) {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.preload = "metadata";
    v.crossOrigin = "anonymous";
    const timer = setTimeout(() => {
      v.src = "";
      reject(new Error("thumbnail timeout"));
    }, timeoutMs);
    v.onloadedmetadata = () => {
      clearTimeout(timer);
      resolve(v);
    };
    v.onerror = () => {
      clearTimeout(timer);
      reject(new Error("thumbnail load failed"));
    };
    v.src = url;
  });
}

function seekTo(video, time) {
  return new Promise((resolve, reject) => {
    const done = () => {
      video.removeEventListener("seeked", done);
      resolve();
    };
    const onErr = () => {
      video.removeEventListener("seeked", done);
      reject(new Error("seek failed"));
    };
    video.addEventListener("seeked", done, { once: true });
    try {
      video.currentTime = time;
    } catch {
      onErr();
    }
    setTimeout(onErr, 4000);
  });
}

export async function captureVideoThumbnail(url, { width = 480, fractions = [0.12, 0.25, 0.4, 0.55, 0.7], minLuma = 22 } = {}) {
  if (!url || typeof document === "undefined") return null;
  if (cache.has(url)) return cache.get(url);

  const pending = (async () => {
    let video = null;
    try {
      video = await loadVideo(url);
      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
      if (!duration) return null;
      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 360;
      const scale = Math.min(1, width / vw);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(2, Math.round(vw * scale));
      canvas.height = Math.max(2, Math.round(vh * scale));
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;

      let best = null;
      let bestLuma = -1;
      for (const f of fractions) {
        try {
          await seekTo(video, Math.min(duration - 0.2, Math.max(0.1, duration * f)));
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          const luma = lumaOf(data, canvas.width, canvas.height);
          const shot = canvas.toDataURL("image/jpeg", 0.72);
          if (luma > bestLuma) {
            bestLuma = luma;
            best = shot;
          }
          // Bright, detailed frame — good enough, stop early.
          if (luma >= minLuma) break;
        } catch {
          continue;
        }
      }
      // Reject near-black results (blank intros / fades): caller falls back.
      if (bestLuma < 8) return null;
      return best;
    } catch {
      return null;
    } finally {
      if (video) video.src = "";
    }
  })();

  cache.set(url, pending);
  try {
    const result = await pending;
    cache.set(url, result);
    return result;
  } catch {
    cache.delete(url);
    return null;
  }
}

export function clearThumbnailCache() {
  cache.clear();
}
