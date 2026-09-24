# BuseLink — Engagement, Location & Realtime Program · TASKS

Ordered by strict dependency chain. Each task lists exact files. Check off as built +
verified (lint/build/live). Spec: SPECIFICATION.md · How: IMPLEMENTATION.md.

## Phase 1 — Discuss + Convert + Live

- [x] **T1 · Comment data layer** — DONE + pushed (migration
  `2026_09_24_020000`, `Comment`/`CommentReaction`/`CommentReport`).
- [x] **T2 · Comment API** — DONE + pushed (`Services/CommentService`,
  `Resources/CommentResource`, rewritten `CommentController`, routes,
  `comment_reply|comment_reaction` fan-out). Verified live 10/11 HTTP.
- [x] **T3 · Comment UI** — DONE + pushed (`Components/CommentTree.jsx`,
  `CommentThread.jsx` wrapper, 4 surfaces rewired). Build green.
- [x] **T4 · Inquiry redirect + quotes** — DONE + pushed
  (`POST /inquiries/resolve`, quoted `send`, `?inquiry=` thread prop,
  `QuoteCard.jsx`, all 7 surfaces redirect). 6/6 live checks green.
- [x] **T5 · Realtime core** — DONE + pushed (Reverb :8080, session-authed
  channels, `MessageSent` + `NotificationCreated`, Echo + typing + fallback,
  bell/inbox bumps). Socket loop proven end-to-end.

## Phase 2 — Locate + Enrich (TODO — see CONTINUATION.md for the full build guide)

- [ ] **T6 · Location** — migrations (opps/stories/prefs location cols + index),
  `Services/LocationService` + `GeocodeAdapter` (Nominatim) + `GET /locations/search`
  proxy, `LocationPicker.jsx`, create-form + onboarding + Preferences wiring,
  `OpportunityService` distance signal + near/province filters, Search filter row,
  PHP location dataset (`database/data/ph_locations.php`: provinces→cities).
  Verify: tagged post scores nearer-first; NULLs neutral.
- [x] **T7 · Rich chat** — UploadController file whitelist (+25MB), `send` media support,
  `polls`/`poll_votes` + endpoints + `PollCard.jsx`, `POST insights` +
  `InsightsCard.jsx`, composer attach menu. Verify: file guards live (php-as-pdf,
  oversize), poll lifecycle, real-count card.

## Phase 3 — Meet (TODO — see CONTINUATION.md for the full build guide)

- [ ] **T8 · Meet-in-chat** — `composer require google/apiclient`, `google_tokens`
  (+encrypted casts), OAuth connect/disconnect, `Services/MeetService` +
  `CalendarAdapter`, schedule/cancel endpoints, `MeetingCard.jsx`, `meet:close-ended`
  scheduler + `schedule:work` in start script. Verify: schedule→live card→Join→ended
  flip + disabled button; cancel path.

## Deferred (valid later, out of program)

Brand verification workflow · reviews · PWA · CI safety net · presence dots ·
ClamAV · email digests (old roadmap items 2,3,5,7,8).
