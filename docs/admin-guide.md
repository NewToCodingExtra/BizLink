# BizLink Admin Guide

> For Admin-role accounts. Open `/admin` (or the console link) after signing in as `admin@bizlink.ph`.

## Console overview

The dashboard shows live counts (accounts, content, engagement), newest sign-ups, top posts by likes, a **Needs attention** strip (pending reports, pending verifications, locked accounts, failed jobs), and recent admin activity. Tabs: **Overview · Reports · Users · Verifications · Analytics · Settings**, each with its pending count.

## Reports queue (`/admin/reports`)

Every user report — on posts, reels, comments, stories, messages, chats, or users — lands here, ranked by a priority score (category severity + repeat reports + offender history). No content is ever auto-hidden; the queue only prioritizes.

- **Filter** by status, content type, category, minimum severity; **search** details/reporters/notes; **sort** by priority, newest, or severity. Pages of 15, filters shareable via URL.
- Open a report for the content preview, every sibling report on the same target, and the offender's strike history (totals, accepted/rejected, warnings, status).
- **Reject** — reason required (min 10 chars), sent to the reporter.
- **Accept** — pick warn / remove content / timed suspend (1–90 days) / ban, reason required, optional content removal. Both reporter and offender are notified. Sibling reports on the same target resolve together.

## Users (`/admin/users`)

Search, status tabs (Active / Suspended / Banned), role and verification filters, sorting by newest, reports, warnings, or posts. Each row opens a drawer with strike history, content list (hide/unhide), and related reports.

| Action | Effect |
|--------|--------|
| Warn | `warning_count++`, user notified |
| Suspend | Timed login + posting block, auto-expires, tokens revoked |
| Ban | Permanent block, tokens revoked |
| Unban / Unsuspend | Back to active immediately |
| Role change | Entrepreneur ↔ Brand (Admin grants need confirmation, always logged) |
| Unlock | Clears rate-limit lockout (failed-login tracking) |
| Reset password / Delete | Delete is refused while the user still owns posts/stories |

## Verifications (`/admin/verifications`)

Brands submit a business name + document. Approve → the account is brand-verified and its posts earn the gold **BRAND** pill plus eligibility for the green **✓ Verified** badge (never shown without approval). Reject with a reason (requester notified) or revoke later for violations.

## Analytics (`/admin/analytics`)

Signups, posts, inquiries, report outcomes, average resolve time, active users, and storage — with 7/30/90-day ranges, trend charts, category breakdowns, and leaderboards (top posts, most-reported users, reporter-abuse signals, per-admin resolve times). Numbers cache for 5 minutes.

## Settings (`/admin/settings`)

- **Server** — login and posting rate limits, session lifetime, demo-login kill switch, open/closed registration, story retention, plus a read-only status panel (versions, queue depth, search engine, last backup).
- **Admins** — admin accounts (never demote yourself or the last admin), the roles × permissions matrix, feature flags, maintenance mode.
- **Backups** — one-click local snapshots (database + uploads zip, keep-N retention, download) and external bucket backups; restore requires typed confirmation and takes a safety snapshot first.

## Exports (`/admin/export/*`)

Styled XLSX + CSV for users, reports, verifications, and audit logs — always honoring the current table filters. Large exports queue in the background with a download notification.

## Accountability

Every enforcement, verification, settings, backup, and export action is written to the **audit log** with admin, target, reason, and timestamp — visible on the dashboard strip and exportable.
