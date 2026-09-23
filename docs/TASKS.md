# BuseLink — Engagement, Location & Realtime Program · TASKS

Ordered by strict dependency chain. Each task lists exact files. Check off as built +
verified (lint/build/live). Spec: SPECIFICATION.md · How: IMPLEMENTATION.md.

## Phase 1 — Discuss + Convert + Live

- [ ] **T1 · Comment data layer** — migrations: comments(+parent_id FK self-null,
  media_url, media_type, edited_at, softDeletes, composite index),
  `comment_reactions` (unique triple), `comment_reports` (unique pair);
  models: `Comment` (fillable/casts/relations/scopes), `CommentReaction`,
  `CommentReport`. Verify: `migrate`, `php -l`.
- [ ] **T2 · Comment API** — `Services/CommentService` (store/reparent/notify/report-count),
  `Resources/CommentResource` (tree shape), `CommentController` rewrite (tree index,
  store, edit, soft-delete/hide, react toggle, report, replies page), routes web+api,
  `AppNotification` types `comment_reply|comment_reaction` with deep links.
  Verify: live HTTP (reply fan-out rows, depth reparent, edit window, auto-hide ≥3).
- [ ] **T3 · Comment UI** — `icons.jsx` (+Flag, Pencil, Trash, Dots, Link2),
  `Components/CommentTree.jsx`, `CommentThread.jsx`→wrapper, wiring in
  OpportunityCard/OpportunityDetail/Reels modal. Verify: build + click-through.
- [ ] **T4 · Inquiry redirect + quotes** — `ConversationController@inquire` accepts
  quote attachment; `PageController::thread` honors `?inquiry=`; `QuoteCard.jsx`;
  `MessageResource` quote shape; all `onInquire` call-sites → `router.visit`
  (ContactForm stays for Contact page only). Verify: end-to-end from feed + reels.
- [ ] **T5 · Realtime core** — `composer require laravel/reverb`, broadcasting config,
  `routes/channels.php`, events (MessageSent, CommentReplied, Typing*, NotificationCreated),
  `utils/echo.js` + `laravel-echo/pusher-js`, thread/inbox/bell subscriptions, 15s
  fallback + chip, `start-bizlink.ps1` WS process. Verify: two-browser live test + 403
  on foreign channel.

## Phase 2 — Locate + Enrich

- [ ] **T6 · Location** — migrations (opps/stories/prefs location cols + index),
  `Services/LocationService` + `GeocodeAdapter` (Nominatim) + `GET /locations/search`
  proxy, `LocationPicker.jsx`, create-form + onboarding + Preferences wiring,
  `OpportunityService` distance signal + near/province filters, Search filter row,
  PHP location dataset (`database/data/ph_locations.php`: provinces→cities).
  Verify: tagged post scores nearer-first; NULLs neutral.
- [ ] **T7 · Rich chat** — UploadController file whitelist (+25MB), `send` media support,
  `polls`/`poll_votes` + endpoints + `PollCard.jsx`, `POST insights` +
  `InsightsCard.jsx`, composer attach menu. Verify: file guards live (php-as-pdf,
  oversize), poll lifecycle, real-count card.

## Phase 3 — Meet

- [ ] **T8 · Meet-in-chat** — `composer require google/apiclient`, `google_tokens`
  (+encrypted casts), OAuth connect/disconnect, `Services/MeetService` +
  `CalendarAdapter`, schedule/cancel endpoints, `MeetingCard.jsx`, `meet:close-ended`
  scheduler + `schedule:work` in start script. Verify: schedule→live card→Join→ended
  flip + disabled button; cancel path.

## Deferred (valid later, out of program)

Brand verification workflow · reviews · PWA · CI safety net · presence dots ·
ClamAV · email digests (old roadmap items 2,3,5,7,8).
