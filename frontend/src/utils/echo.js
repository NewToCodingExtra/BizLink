import Echo from "laravel-echo";
import Pusher from "pusher-js";

// laravel-echo speaks the Pusher protocol that Reverb implements.
if (!window.Pusher) window.Pusher = Pusher;

function csrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

let echo = null;

/** Singleton Echo client (null when Reverb is unreachable/unconfigured). */
export function getEcho() {
  if (echo !== undefined && echo !== null) return echo;
  try {
    const key =
      import.meta.env.VITE_REVERB_APP_KEY ||
      (typeof document !== "undefined" ? document.querySelector('meta[name="reverb-key"]')?.getAttribute("content") : null) ||
      "bizlink-reverb-key-2026";
    // No VITE_* values are baked in on hosted builds — derive sane defaults
    // from the page itself so wss://domain (443) just works in production
    // while local dev keeps 127.0.0.1:8080 over plain ws.
    const pageHttps = typeof window !== "undefined" && window.location.protocol === "https:";
    const host = import.meta.env.VITE_REVERB_HOST || window.location.hostname;
    const port = import.meta.env.VITE_REVERB_PORT || (pageHttps ? 443 : 8080);
    const scheme = import.meta.env.VITE_REVERB_SCHEME || (pageHttps ? "https" : "http");
    echo = new Echo({
      broadcaster: "reverb",
      key,
      wsHost: host,
      wsPort: Number(port),
      wssPort: Number(port),
      forceTLS: scheme === "https",
      enabledTransports: ["ws", "wss"],
      authEndpoint: "/broadcasting/auth",
      auth: {
        headers: {
          "X-CSRF-TOKEN": csrfToken(),
          "X-Requested-With": "XMLHttpRequest",
          Accept: "application/json",
        },
      },
    });
  } catch {
    echo = null;
  }
  return echo;
}

/**
 * Calls onDown() if the socket is not connected within `graceMs`.
 * Returns an unsubscribe function.
 */
export function watchEchoHealth(onDown, graceMs = 5000) {
  const client = getEcho();
  if (!client) {
    const t = setTimeout(onDown, 0);
    return () => clearTimeout(t);
  }
  let fired = false;
  let timer = null;
  const conn = client.connector?.pusher?.connection;
  const down = () => {
    if (!fired) {
      fired = true;
      onDown();
    }
  };
  const check = () => {
    const state = conn?.state;
    if (state === "connected") {
      if (timer) clearTimeout(timer);
      timer = null;
      return;
    }
    if (!timer) timer = setTimeout(down, graceMs);
  };
  check();
  const iv = setInterval(check, 2000);
  conn?.bind?.("connected", () => {
    if (timer) clearTimeout(timer);
    timer = null;
  });
  conn?.bind?.("failed", down);
  return () => {
    clearInterval(iv);
    if (timer) clearTimeout(timer);
  };
}
