import { Link } from "@inertiajs/react";
import { CheckIcon } from "./icons";
import AuthorRoleBadge from "./AuthorRoleBadge";
import { profilePath } from "../utils/profilePath";

/**
 * Verified + role pills. Rendered twice per surface on purpose: inline with
 * the name on sm+ (classic row), merged into the meta line on phones (one
 * clean wrapping zone instead of an orphaned badge row). Pure CSS split —
 * zero desktop change.
 */
export function AuthorBadges({ opp, className = "inline-flex" }) {
  if (!opp) return null;
  return (
    <span className={`${className} items-center gap-1.5 shrink-0`}>
      {opp.verified && (
        <span
          title="Verified Brand"
          className="inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-bold text-success bg-success/10 border border-success/20 rounded-full px-1.5 sm:px-2 py-0.5 whitespace-nowrap"
        >
          <CheckIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Verified
        </span>
      )}
      <AuthorRoleBadge opp={opp} />
    </span>
  );
}

/**
 * Shared author identity cluster: name + badges. Phones get the name on its
 * own full line with pills merged into the meta row (see AuthorBadges);
 * sm+ keeps the classic single inline row. Used by feed cards, the detail
 * page, and the post modal so every surface breaks identically.
 */
export default function AuthorIdentity({ opp, nameClassName = "text-sm font-semibold" }) {
  if (!opp) return null;
  const href = profilePath({
    username: opp.user?.username || opp.authorUsername,
    authorId: opp.authorId,
    brandId: opp.brandId,
  });
  return (
    <div className="flex items-center gap-x-1.5 gap-y-1 flex-wrap min-w-0">
      <Link
        href={href}
        title={opp.brandName}
        className={`${nameClassName} text-text-primary hover:text-action truncate min-w-0 basis-full sm:basis-auto sm:flex-1`}
      >
        {opp.brandName}
      </Link>
      <AuthorBadges opp={opp} className="hidden sm:inline-flex" />
    </div>
  );
}
