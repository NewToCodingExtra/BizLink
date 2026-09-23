import { router } from "@inertiajs/react";
import { httpApi } from "./http";

/**
 * Inquire redirect: resolve (or create) the 1:1 thread for a post/reel/story
 * and navigate there with the quote pinned (?inquiry=type:id).
 * type: "opportunity" | "story"  (reels are video opportunities)
 */
export async function goInquire(toast, type, id) {
  try {
    const res = await httpApi.post("/inquiries/resolve", { type, id });
    const url = res?.url ?? null;
    if (!url) throw new Error("Could not open conversation.");
    router.visit(url);
  } catch (err) {
    toast?.error(err.message || "Could not open conversation.");
  }
}
