/**
 * Account-type badge distinguishing brand posts from entrepreneur posts.
 * Resolves from the resource `authorRole`, falling back to the author's
 * `role` column (Manager/Admin post as brands).
 */
export function resolveAuthorRole(opp) {
  if (opp?.authorRole === "brand" || opp?.authorRole === "entrepreneur") return opp.authorRole;
  const r = opp?.user?.role ?? opp?.authorRole;
  return r === "brand" || r === "admin" ? "brand" : "entrepreneur";
}

export default function AuthorRoleBadge({ opp, role, dark = false, className = "" }) {
  const kind = role ?? resolveAuthorRole(opp);
  if (kind === "brand") {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold tracking-widest bg-accent text-[#0B1F3A] px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${className}`}>
        BRAND
      </span>
    );
  }
  if (dark) {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold tracking-widest bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${className}`}>
        ENTREPRENEUR
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold tracking-widest bg-action/10 text-action border border-action/20 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${className}`}>
        ENTREPRENEUR
      </span>
  );
}
