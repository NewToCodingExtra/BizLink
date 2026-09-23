/**
 * Canonical profile URL for any author-like object.
 * Prefers the username slug, falls back to numeric id, then legacy brand slug.
 */
export function profilePath(u) {
  if (u === null || u === undefined) return "/profile/me";
  if (typeof u === "string" || typeof u === "number") return `/profile/${u}`;
  const slug =
    u.username ||
    u.authorUsername ||
    u.withUsername ||
    u.authorId ||
    u.userId ||
    u.id ||
    u.brandId;
  return `/profile/${slug ?? "me"}`;
}
