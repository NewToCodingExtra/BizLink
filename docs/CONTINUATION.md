# BuseLink — Continuation Guide (for the next builder)

You are picking up the Engagement / Location / Realtime program mid-flight.
**Phase 1 is built, verified, and pushed. Phase 2 (T6 location, T7 rich chat)
and Phase 3 (T8 Meet-in-chat) are yours.** This doc tells you exactly what exists,
what to build, file-by-file, and how to verify each piece the way we verified Phase 1.

Program context: `docs/SPECIFICATION.md` (the What), `docs/IMPLEMENTATION.md`
(the How), `docs/TASKS.md` (checklist — Phase 1 boxes already ticked).

---

## 1. Running the stack

```powershell
powershell -ExecutionPolicy Bypass -File start-bizlink.ps1
```

This starts, in order: MySQL 8.0 (`C:\temp\bizlink-mysql`, port **3307**) →
Meilisearch (`:7700`) → Laravel (`http://localhost:8000`, 5 workers) →
**Reverb WebSocket (`ws://127.0.0.1:8080`)** → Vite HMR (`:5173`).
Open **http://localhost:8000** (never :5173 directly). Health: `/api/health`.
Logs: `C:\temp\bizlink-*.log` (api, reverb, vite).

Demo accounts: `demo@bizlink.ph / password123`, `brand@bizlink.ph / password123`.
PHP: always `C:\xampp\php\php.exe`. Composer: put XAMPP first in PATH or the
Herd PHP fails on openssl:
`$env:PATH = "C:\xampp\php;" + $env:PATH; composer ...`
DB: MySQL `127.0.0.1:3307`, db `bizlink`, user `bizlink`. Migrations live in
`backend/database/migrations/`. Run with `php artisan migrate` from `backend/`.
Frontend builds to `backend/public/build` (gitignored) via `npm run build`
from `frontend/` — **rebuild after every frontend change** or the served app
won't reflect it (the running app serves the last build unless Vite HMR `hot`
file is active, which it is in dev — but always rebuild before calling anything
"done").

---

## 2. What Phase 1 already built (do not rebuild)

- **T1 — comment data layer.** Migration `2026_09_24_020000` added to `comments`:
  `parent_id` (self-FK, cascade), `media_url`, `media_type`, `edited_at`,
  soft deletes, composite index `(opportunity_id, parent_id, created_at)`.
  New tables `comment_reactions` (unique triple) and `comment_reports`
  (unique pair). Models: `Comment` (replies/reactions/reports relations),
  `CommentReaction`, `CommentReport`.
- **T2 — comment API** (`Services/CommentService`, `Resources/CommentResource`,
  rewritten `CommentController`, routes in `web.php` + `api.php`).
  Rules: depth cap 2 (reply-to-reply re-parents to top-level server-side),
  cross-opportunity `parent_id` → 422, empty-text-and-no-media → 422,
  edit = owner ≤15 min, delete = owner (soft tombstone) or post-owner hide,
  reactions fixed set 👍❤️😮😂🙏 (toggle), reports fixed reasons
  (spam/harassment/scam/other, auto-hide at ≥3 → tombstone).
  Notifications: `comment_reply` + `comment_reaction` fan-out to **post owner
  AND comment owner** (dedupe, skip self), deep link `/post/{slug}#comment-{id}`.
  Throttles: store 10/min, react 60/min, send 30/min.
- **T3 — comment UI.** `Components/CommentTree.jsx` (tree, reply boxes, reaction
  pills, `⋯` menu with Reply/Copy/Edit/Delete/Report, media attach via
  `/uploads`, `#comment-{id}` deep-link scroll+highlight), `CommentThread.jsx`
  is now a thin compatibility wrapper. Wired into cards, detail, reels modal,
  profile. Shared `Components/icons.jsx` — **never use emoji glyphs** (see §4).
- **T4 — inquire redirect.** No more inquiry modal (except Contact page):
  `utils/inquire.js → POST /inquiries/resolve → router.visit('/messages/{user}?inquiry={type}:{id}')`.
  `PageController::thread` passes a `quote` prop; `QuoteCard.jsx` renders the pin
  (above composer, dismissible) and the subordinate inline card (translucent,
  indented, clickable → `/post/{slug}`, `/reels?slug=`, `/stories/{slug}`).
  First send carries the quote, then unpins. Expired stories → tombstone card.
- **T5 — realtime.** Reverb on :8080, `config/reverb.php` + `config/broadcasting.php`,
  session-authed `POST /broadcasting/auth` (wired in `AppServiceProvider`),
  `routes/channels.php` (`conversation.{id}` participant-only,
  `user.{id}` self-only — both 403-tested), events `MessageSent` +
  `NotificationCreated` (`ShouldBroadcastNow`, custom names `message.sent` /
  `notification.created`), `Services/NotificationService::push()` (row +
  broadcast choke point), `utils/echo.js` singleton, thread/inbox/bell live
  wiring, typing whispers, 15s-poll fallback with "Reconnecting" chip.

---

## 3. Conventions you MUST follow (we enforced these all through Phase 1)

1. **Session auth + CSRF on everything browser-side.** `frontend/src/utils/http.js`
   (`httpApi.get/post/put/del`) sends cookies + `X-CSRF-TOKEN`. Never invent a
   token scheme. API routes under `auth:sanctum` mirror the web routes.
2. **Every 422 carries a human `message`.** The XHR/fetch toast paths surface
   `json.message` — a silent or generic failure is a bug. Validate at the
   boundary, never trust downstream.
3. **No emoji/glyph icons, ever.** All icons live in `Components/icons.jsx`
   (feather-style strokes, `currentColor`). Extend it; don't inline emoji.
4. **Theme tokens, not hex.** Colors via `text-text-primary`, `bg-surface`,
   `border-border`, `text-action`, etc. (defined in `frontend/src/css/app.css`).
   Never hardcode hex in JSX.
5. **Optimistic UI + rollback.** Like the like/save toggles: update instantly,
   revert + toast on 422/429.
6. **Small commits per function, then push.** Our convention (global
   `github-staging` skill): `feat(comments): ...`, `fix(auth): ...`,
   `style(icons): ...`, `chore(sync): ...`. Inspect `git status` + diff before
   every commit, never commit `.env`/keys/dumps/binaries, push only when asked.
   Commit history so far is the template — read `git log --oneline -12`.
7. **Verify like we did:** `php -l` on touched backend files, `vite build`,
   then a **live test against the running stack** (real HTTP, real DB), then
   **delete every test row/file you created** (test comments, messages,
   conversations, uploads). Past test markers: texts starting `T2`/`T4`/`T5`.
8. **Broadcast payloads stay PII-minimal** (ids, display names, links — no tokens).
   Private channels only; channel auth closures must re-check participation.

---

## 4. T6 — Location (Phase 2, part 1)

**Goal:** posts/stories carry a location; preferences carry a home location; the
feed scores nearby content higher; users can filter by place.

### 4.1 Migration (one file)
Nullable columns on `opportunities`, `stories`, `preferences`:
`city VARCHAR(255) NULL, province VARCHAR(255) NULL,
latitude DECIMAL(10,7) NULL, longitude DECIMAL(10,7) NULL`.
Plain composite index `(latitude, longitude)` on the two content tables
(bounding-box prefilter; no spatial index in v1). Everything nullable —
old rows behave neutrally (never penalized).

### 4.2 PH dataset + Nominatim assist (no billing, no keys — decided)
- Bundle a static dataset at `backend/database/data/ph_locations.php`
  returning `province => [cities/municipalities]` (cover all 82 provinces;
  capitals + major cities are enough for v1 — be pragmatic, it doesn't need
  every barangay).
- Assist search: `GET /locations/search?q=` **server-side proxy** to Nominatim
  (`https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=ph`),
  because browsers calling Nominatim directly violate its usage policy.
  Proxy enforces: `User-Agent: BuseLink/1.0 (school project)` header
  (Nominatim **requires** this), ≤1 req/sec per IP (add a tiny
  `Cache::remember` 30-day cache keyed by normalized query — doubles as our
  quota shield), `.env` flag to disable. Picker footer must credit
  "© OpenStreetMap contributors".
- New `Services/LocationService` + `GeocodeAdapter` interface (Nominatim impl
  now; Google Places later without touching callers).

### 4.3 Capture UI — `Components/LocationPicker.jsx` (new, reusable)
Props: `{ value: {province, city, latitude, longitude} | null, onChange }`.
Province dropdown → city dropdown (from a `GET /locations/regions` endpoint
serving the bundled dataset, or import a generated JSON — endpoint preferred so
web + future mobile share it) + assist search box (debounced 400ms) that fills
all four fields + coords. Manual dropdowns always work when Nominatim fails.
Wire into: `Pages/CreateOpportunity.jsx` (new section), `Components/CreateStoryModal.jsx`,
`Pages/Preferences.jsx`, and `Components/PreferenceOnboardingModal.jsx` (new step
or folded into step 3 — your call, keep 3 steps max).
Backend validation: `city/province nullable|string|max:255`,
`latitude numeric|between:-90,90`, `longitude numeric|between:-180,180`
(all-or-nothing: coords required iff city present — `required_with`).
Serialize `location: {city, province, lat, lng} | null` on `OpportunityResource`,
profile/detail/reels payloads, `UserController`.

### 4.4 Scoring + filters (the money part)
In `OpportunityService::collectSignals`, read viewer prefs lat/lng. In
`scoreExpression`, add the distance part (Haversine, km):
**+20 at ≤25 km, linear decay to 0 at 200 km, 0 beyond — and 0 when either side
is NULL (neutral, never a penalty).** Weight sits deliberately below follows
(+60) and category (+35). Add reason string `"Nearby"` in `matchReasons`.
New filters in `applyFilters`: `?near={lat,lng}&radius_km=` (default 100) +
`?province=` exact match. `Search.jsx` gains a location filter row.
Client helper `utils/location.js` for "x km away" labels ONLY — scoring stays
server-side.

### 4.5 Verify T6
Post two items at far-apart coords (e.g. Manila 14.5995,120.9842 vs Davao
7.1907,125.4553) as different brands, set prefs location to Manila, assert feed
order puts the near one first and both still appear; NULL-location post appears
(no penalty); `?province=` filters; Nominatim down (block the host) → manual
dropdowns still save fine.

---

## 5. T7 — Rich chat (Phase 2, part 2)

All inside the thread (`Pages/MessageThread.jsx` + `ConversationController@send`).

### 5.1 Photo / file attachments
- Composer attach button → existing hardened `POST /uploads` → `send` accepts
  `media_url + media_type`. Extend the server MIME map for **files only**:
  pdf, doc, docx, xls, xlsx, txt, zip — **server-sniffed MIME, extension derived
  from MIME (never the client filename), 25 MB cap**. Images/video keep existing
  caps (20 MB / 100 MB). Reject SVG/HTML/exe/octet-stream with toast-friendly
  422s. No ClamAV locally — declared non-goal, compensated by whitelist +
  no-execution storage (document this in the commit message).
- New `messages.media_url (2048 NULL)`, `messages.media_type (varchar 32 NULL)`
  migration. Render: image/video inline, files as download cards (name, size,
  type icon from `icons.jsx` — add `FileIcon`).

### 5.2 Polls
Tables: `polls(conversation_id FK cascade, question 255, options JSON 2–5 items,
closes_at NULL, closed bool default false)` +
`poll_votes(poll_id, user_id, option_index)` unique `(poll_id,user_id)`.
Endpoints: `POST /conversations/{c}/polls` (one open poll per conversation max,
else 422), `POST /polls/{id}/vote {option}` (changeable until close),
`POST /polls/{id}/close` (creator only; auto-close past `closes_at` on read).
`Components/PollCard.jsx`: option bars with % + counts, closed state, system
note on close. Broadcast `PollUpdated/PollClosed` on the conversation channel
(events already pattern-established — follow `MessageSent`).

### 5.3 Sales-insights share
`POST /conversations/{c}/insights` (brand-side participant only) drops a
**server-computed, non-editable snapshot card**: own posts count · inquiries
received · likes total · top post (headline + likes) · "as of" timestamp.
`Components/InsightsCard.jsx`. Own-stats only — no cross-brand analytics, counts
only (no fake precision).

### 5.4 Verify T7
Photo + pdf + zip send/render/persist; `shell.php`-as-`.pdf`, oversize file, and
`.svg` all rejected with toasts (mirror the T5-era upload test: 6 cases, all must
pass); poll create→vote→change→close lifecycle correct for both participants;
insights card shows real counts; `php -l` + `vite build` green.

---

## 6. T8 — Meet-in-chat (Phase 3)

**Read this whole section before writing code — it has an external dependency
(Google Cloud) no other task has.**

### 6.1 Google Cloud prerequisite (do this FIRST, it has lead time)
Meet links can ONLY be minted via the **Google Calendar API** (`events.insert`
with `conferenceData.createRequest`) — there is no other way. You need:
(1) a Google Cloud project, (2) **OAuth consent screen** (test mode caps at
100 users — surface this limit in the UI; production needs verification),
(3) Calendar API enabled, (4) OAuth client (web) whose redirect URI is ours.
`composer require google/apiclient`. Login stays Socialite-only; Meet uses a
**separate per-feature OAuth flow requesting ONLY the `calendar.events` scope**
— never widen login scopes.

### 6.2 Connect + tokens
"Connect Google" entry in thread ⋯ menu (and a settings row): OAuth →
`google_tokens(user_id UNIQUE FK cascade, access_token TEXT encrypted-cast,
refresh_token TEXT encrypted-cast, expires_at)` + silent refresh on use.
Disconnect revokes + deletes the row. Every Meet action for a non-connected user
shows the connect prompt — no dead buttons.

### 6.3 Schedule + card
Composer ⋯ → Meet → modal (title prefilled `Consultation: {post headline}`,
datetime ≥ now+15 min, duration 15/30/60) → `Services/MeetService::schedule`
(refresh token if needed → `CalendarAdapter::createMeet` → create `messages`
row `{text: title+time, meet_status: scheduled, meet_event_id}` →
broadcast `MeetScheduled`). Needs `messages.meet_status ENUM(scheduled,ended,
cancelled) NULL` + `meet_event_id VARCHAR(255) NULL` migration.
`Components/MeetingCard.jsx`: title, time (browser locale; store UTC), Join
button (Meet URL, new tab). Creator-only cancel → Calendar delete +
`MeetEnded(reason=cancelled)`. All failures (no tokens, API down with backoff×3,
past time) → 422 toast, no partial rows (DB transaction).

### 6.4 End detection (no client polling)
Laravel scheduler job `meet:close-ended` every 5 min (dev: add
`schedule:work` to `start-bizlink.ps1`; prod: Task Scheduler/cron):
events past `end.dateTime` → post `MeetEnded(reason=ended)` system message +
flip `meet_status=ended` → Join renders **disabled** ("Meeting ended").
State arrives over the socket (or next thread load).

### 6.5 Verify T8
Connect → schedule → both sides see the card live → Join opens the Meet URL →
after end, "meeting ended" posts and the button disables; cancel mirrors it;
disconnected-user flow prompts connect; expired-token refresh is silent.

---

## 7. Deferred backlog (valid later, explicitly out of this program)

Brand verification workflow · ratings/reviews · PWA + push notifications ·
CI safety net (Pest + Vitest + Actions) · presence/online dots · email digests ·
service-account Meet (no impersonation) · ClamAV scanning · edit history ·
threaded DMs beyond 1:1+brand · in-app voice/video. (From SPECIFICATION.md §10
plus old-roadmap items 2,3,5,7,8.)

---

## 8. Verification playbook (copy our method)

- Backend: `C:\xampp\php\php.exe -l <file>` for every touched file;
  `php artisan route:list --path=<x>` after route edits.
- Frontend: `npm run build` from `frontend/` (must pass; chunk-size warnings
  are pre-existing noise).
- Live HTTP: login via `POST /login` (form fields, `CURLOPT_POST`, **no**
  `X-Requested-With` on the login call), then re-fetch `/feed` for a **fresh
  CSRF** (login regenerates the session — stale tokens 419). API calls need
  `X-CSRF-TOKEN` + `X-Requested-With: XMLHttpRequest` + cookies CURLFile-style
  jar. PHP curl cookie jars have bitten us before (domain matching) — if you get
  mystery 401s with a fresh login, redo the harness in PowerShell
  (`Invoke-WebRequest -SessionVariable`), which has never failed us.
- Watch out for: login rate limit (5/min/IP — space out test logins),
  write-throttles (comments 10/min, react 60/min, messages 30/min — tests that
  hammer endpoints will 429; that's the guard working, wait 60s and re-run),
  reseed drift (another session reseeds the DB sometimes — user IDs shift;
  always resolve IDs dynamically, never hardcode `user 4`).
- CLEAN UP after every test: delete created comments/messages/conversations/
  notifications/uploads. Leave the DB exactly as you found it.

## 9. Git workflow

Small per-function commits (`feat|fix|style|chore(scope): ...`), inspect
`status` + diff before each commit, never commit `.env`/keys/dumps/binaries,
push only when asked, never force-push (global `github-staging` skill has the
full rules). Current history (`git log --oneline -12`) is the template.
Never touch `backend/meilisearch.exe`, `cline-*.tgz`, `dumps/` (untracked junk).

## 10. Gotchas we already paid for (don't repay)

- `ConvertEmptyStringsToNull` turns `''` into `null` — optional string rules
  need `nullable`, or empty posts fail with "must be a string".
- Inertia `useState(initialProps)` does NOT re-sync on prop change — pages that
  reload data (feed, reels) use the `useEffect`-on-props sync pattern; copy it.
- `router.get` with `preserveState: true` keeps component state — comment/thread
  pages rely on remount-by-default for fresh props.
- `Request::merge()` on GET lands in the query bag (verified in vendor source).
- Soft deletes: Eloquent hides trashed automatically, but **raw SQL doesn't** —
  every hand-written `comments` count needs `AND deleted_at IS NULL`.
- PowerShell mangles `$` and `head`/`awk` don't exist — put `$`-heavy logic in
  `.ps1`/`.php` files and run those; never fight inline quoting.
- Windows paths are case-insensitive but the git index isn't (`Components/` on
  disk vs `components/` in index) — always use the index spelling in git
  commands, and never "fix" the casing.
- `git apply` patches must be byte-exact incl. non-ASCII (`·×₱👍`) and end with
  a trailing newline; PowerShell-decoded `git diff` output corrupts non-ASCII
  unless the script forces UTF-8 (`[Console]::OutputEncoding = UTF8`, write
  with `UTF8Encoding($false)`).
- Reverb must be running or `send` 500s (broadcast is synchronous by design —
  `ShouldBroadcastNow`); if chat breaks, check `:8080` first.
