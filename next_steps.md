# BizLink — Next Steps

Prioritized roadmap. Items are ordered by user-visible impact per unit of effort for a matchmaking product.

## 1. Realtime consultation inbox (highest leverage)
Messages only appear after refresh. Add Laravel Reverb + private-channel broadcasting on `Message` creation, with Echo on `MessageThread` and an unread-badge bump in `Navbar`.
Files: `backend/` broadcasting config + `MessageSent` event, `frontend/src/pages/MessageThread.jsx`, `Navbar.jsx`.
Effort: medium. Unblocks the core "talk to the brand now" promise.

## 2. Brand verification workflow
`verified` is currently just a seed flag. Add `verification_status` (`pending`/`verified`/`rejected`) on opportunities, a brand-facing "request verification" action, and an admin review queue (simplest: an admin role + `/admin/verifications` page).
Effort: medium. This is the platform's trust promise — fake it and the badge means nothing.

## 3. Tests + CI safety net
Two bug classes already escaped (Bearer ignored on public routes; `following` returning everything): Pest feature tests for auth/feed/follow edge cases, Vitest for feed interactions, and a GitHub Action running backend migrate + test and frontend build + lint on every push.
Effort: medium. Pays for itself before the next feature.

## 4. Search that scales
Move to Meilisearch/Scout for typo tolerance, and push category/budget preference filters server-side (scoring is still client-side over loaded pages, so deep pages ignore preferences).
Files: `OpportunityController@index`, `Preferences`, scout config.
Effort: medium.

## 5. Media pipeline + PWA
GCS signed URLs expire in 7 days — add a refresh/artisan command or switch to public objects with variants. Generate thumbnails and video posters on upload. Then PWA installability + push notifications for inquiries and replies.
Effort: medium-large. Do after 1–3.

## 6. Notification polish
Pre-`link` rows have no deep link; add a backfill or retire them. Add per-user notification preferences (replies, inquiries, new posts from followed brands) and email digests via the existing mailer.
Effort: small-medium.

## 7. Social product loops
Ratings/reviews on opportunities, shareable post links with Open Graph tags, saved collections, brand analytics (views, inquiries, conversion) to give posters a reason to return.
Effort: large. Pick one (reviews) before the rest.

## 8. Production readiness (before any public deploy)
HTTPS + `SESSION_SECURE_COOKIE`, rate limiting on auth/upload endpoints, MySQL backups for the isolated instance, error tracking (Sentry/Flare), and removing debug token exposure in `PasswordResetController` (`config('app.debug')` gate).
Effort: small-medium. Non-negotiable for launch.

## Suggested order
1 → 3 → 2 → 4 → 6 → 5 → 7 → 8 (8 moves to front if deploying publicly sooner).
