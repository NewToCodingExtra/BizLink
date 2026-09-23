# BuseLink — Engagement, Location & Realtime Program · IMPLEMENTATION

Version 1.0 · Status: DRAFT (awaiting approval) · Companion: SPECIFICATION.md (the What)

How to build it: patterns, dependencies, migrations, endpoints, channels, and
file-by-file changes against the current tree. Phase order: P1 (M1+M2+M5) → P2 (M4+M3)
→ P3 (M6).

---

## 1. Pattern recommendations (why + sketch, BuseLink-specific)

### P1 · Event-Driven fan-out (Observer) — chat/notification delivery
Writes (message, reply, reaction, poll vote, meet event) stay synchronous and thin; all
fan-out (sockets, notification rows, bell bumps) happens in broadcast events + listeners.
Without this, ConversationController becomes a god-object.
```php
// app/Events/MessageSent.php
class MessageSent implements ShouldBroadcast {
    public function __construct(public Message $message) {}
    public function broadcastOn(): array {
        return [new PrivateChannel("conversation.{$this->message->conversation_id}")];
    }
    public function broadcastWith(): array {
        return ['message' => new MessageResource($this->message)];
    }
}
// Controller stays dumb: $msg = ...->create(...); broadcast(new MessageSent($msg));
```

### P2 · Service Layer — CommentService, MeetService, LocationService, PollService
Orchestration spanning tables (reparent + notify + report-count; OAuth + Calendar +
message card; geocode + scoring input) does NOT belong in controllers.
```php
// app/Services/CommentService.php
class CommentService {
    public function store(User $user, Opportunity $opp, array $data): Comment {
        return DB::transaction(function () use (...) {
            $parent = isset($data['parent_id']) ? Comment::findOrFail($data['parent_id']) : null;
            abort_if($parent && $parent->opportunity_id !== $opp->id, 422);
            // depth cap 2: replies attach to the top-level ancestor
            $parentId = $parent?->parent_id ?? $parent?->id;
            $comment = Comment::create([...$data, 'parent_id' => $parentId]);
            $this->notifyThread($comment); // post owner + parent owner, dedupe, skip self
            return $comment;
        });
    }
}
```

### P3 · Adapter — GoogleCalendarAdapter + GeocodeAdapter
External APIs change and need fakes in tests. Controllers/services talk to our interface.
```php
interface CalendarAdapter { public function createMeet(User $u, string $t, Carbon $s, int $mins): array{eventId, link}; public function cancel(User $u, string $eventId): void; public function ended(string $eventId): bool; }
interface GeocodeAdapter { public function search(string $q): array; } // Nominatim now, Places later
```

### P4 · Strategy (feed signal) — DistanceSignal inside OpportunityService
The scorer is already weight-parts (`scoreExpression`); distance slots in as one more
signal in `collectSignals` + one `IF()` part — no rewrite.
```php
// +20 ≤25km → 0 at 200km, NULL-neutral (never penalizes untagged rows)
$parts[] = "CASE WHEN {$viewerLat} IS NULL OR latitude IS NULL THEN 0 "
  . "WHEN (6371*ACOS(...)) <= 25 THEN 20 "
  . "WHEN (6371*ACOS(...)) >= 200 THEN 0 "
  . "ELSE 20*(1-(dist-25)/175) END";
```

### P5 · State Machine — poll + meeting-card lifecycles
Explicit transitions with guards, enforced server-side, mirrored in UI:
`poll: open → closed` (creator closes or `closes_at` passes; votes rejected when closed).
`meeting card: scheduled → ended | cancelled` (`messages.meet_status`; Join enabled only
when `scheduled`). Scheduler is the only writer of `ended`.

### P6 · Optimistic Updates — reactions, votes, appends, typing
Like the existing like/save toggles: update UI instantly, revert on error. Applies to
reaction toggles, poll votes, sent messages, read marks. Server remains authoritative;
429/422 toasts + rollback on failure.

### P7 · Middleware/Pipeline + Least Privilege — thread safety
`throttle` on write endpoints (spec §9 quotas) + a `ConversationParticipant` check
(controller-level, reusing `ConversationController@show` ownership logic) + broadcast
channel auth closures. Default-deny: every new endpoint proves membership.

### P8 · DTO — broadcast + tree payloads
`CommentResource` (tree: children, reactions, myReaction, edited/deleted flags),
`MessageResource` (quote card, attachments, meet_status), `PollResource`. Broadcast
payloads reuse the same resources as HTTP — one shape everywhere, no token/PII leakage.

Skipped deliberately: Repository (Eloquent already abstracts), CQRS/event-sourcing
(overkill), microservices (solo dev, monolith wins).

---

## 2. Dependencies

```bash
composer require laravel/reverb google/apiclient
npm install laravel-echo pusher-js   # Echo speaks the Reverb (Pusher-protocol) socket
```
No new dev deps. Queue stays `database`; scheduler runs via `php artisan schedule:work`
in dev (Windows has no cron — document Task Scheduler for prod).

## 3. Environment & runtime changes

`.env` additions: `BROADCAST_CONNECTION=reverb`, `REVERB_APP_ID/KEY/SECRET`,
`REVERB_HOST=127.0.0.1 REVERB_PORT=8080 REVERB_SCHEME=http`,
`VITE_REVERB_APP_KEY/HOST/PORT/SCHEME` (read by `echo.js`),
`GOOGLE_CALENDAR_SCOPES` (code constant instead — prefer constant),
`NOMINATIM_UA="BuseLink/1.0 (school project)"` (Nominatim policy: ≤1 req/s, UA required,
attribution "© OpenStreetMap" in picker footer).
`start-bizlink.ps1`: add `php artisan reverb:start --port=8080` + `php artisan
schedule:work` processes, extend pre-kill/health-check port list.

## 4. Migrations (all new tables/columns + indexes)

1. `comments`: `parent_id FK→comments nullable, media_url 2048 nullable,
   media_type enum(image,video) nullable, edited_at nullable, deleted_at softDeletes`;
   index `(opportunity_id, parent_id, created_at)`.
2. `comment_reactions`: `comment_id FK cascade, user_id FK cascade, emoji string(16)`,
   unique `(comment_id,user_id,emoji)`.
3. `comment_reports`: `comment_id, user_id, reason enum(spam,harassment,scam,other),
   created_at`; unique `(comment_id,user_id)`.
4. `polls`: `conversation_id FK cascade, question 255, options JSON, closes_at nullable,
   closed bool default false`; `poll_votes`: `poll_id, user_id, option_index`,
   unique `(poll_id,user_id)`.
5. `opportunities` + `stories`: `city 255 null, province 255 null,
   latitude decimal(10,7) null, longitude decimal(10,7) null`; plain composite index
   `(latitude,longitude)` for bounding-box prefilter.
6. `preferences`: `province, city 255 null, latitude/longitude decimal(10,7) null`.
7. `messages`: `media_url 2048 null, media_type string(32) null, meet_status
   enum(scheduled,ended,cancelled) null, meet_event_id 255 null, poll_id FK null`.
8. `google_tokens`: `user_id unique FK cascade, access_token text (encrypted cast),
   refresh_token text (encrypted cast), expires_at`.
9. `conversations`: `last_message_at nullable` (for inbox sort without loading messages).

Backfill: none (all nullable; old rows behave neutrally per spec).

## 5. Backend endpoints (all `auth`, session web + sanctum api where the twin exists)

| Method | Path | Purpose |
|---|---|---|
| GET | `/opportunities/{id}/comments?parent=top&page=` | tree page (existing route, new shape) |
| POST | `/opportunities/{id}/comments` | create (+`parent_id`, +media) |
| PATCH | `/comments/{id}` | edit (owner ≤15 min) |
| DELETE | `/comments/{id}` | soft-delete (owner) / hide (post owner) |
| POST | `/comments/{id}/react` `{emoji}` | toggle reaction (fixed set) |
| POST | `/comments/{id}/report` `{reason}` | report (auto-hide ≥3) |
| GET | `/comments/{id}/replies?page=` | lazy replies |
| POST | `/conversations/{c}/messages` | extended: `+attachment{type,id}, +media_url/type, +poll_id` |
| POST | `/conversations/{c}/polls` | create (one open max) |
| POST | `/polls/{id}/vote` `{option}` | vote/change |
| POST | `/polls/{id}/close` | creator close |
| POST | `/conversations/{c}/insights` | brand stat snapshot card |
| GET | `/locations/search?q=` | Nominatim assist (server proxy: enforces UA, rate, attribution) |
| GET | `/meet/connect` → callback | OAuth (calendar.events scope) |
| POST | `/conversations/{c}/meet` | schedule (adapter → card message) |
| DELETE | `/conversations/{c}/meet/{eventId}` | cancel |
| — | scheduler `meet:close-ended` q5min | post MeetEnded + flip status |

Upload whitelist extension (message files): server MIME map add
`pdf→application/pdf, doc/docx→msword/officedocument, xls/xlsx, txt→text/plain,
zip→application/zip`, 25MB cap, extension-from-MIME (existing doctrine).

## 6. Broadcast design

Channels: `private-conversation.{id}` (MessageSent, Typing*, PollUpdated/Closed,
MeetScheduled/Ended), `private-user.{id}` (NotificationCreated → bell bump + toast).
Auth (`routes/channels.php`): conversation → participant (reuse show-ownership logic);
user → `id === auth()->id`. No secrets in payloads (resources only).
Client (`frontend/src/utils/echo.js` singleton; lazy-subscribe in MessageThread,
MessagesInbox preview, Navbar bell, OpportunityDetail live replies): append/merge state,
15s-poll fallback + "reconnecting" chip when `disconnected > 5s`.

## 7. Frontend file plan

- NEW `Components/CommentTree.jsx` (tree + `⋯` menu + reaction row + reply box + media
  attach), `Components/QuoteCard.jsx` (composer pin + in-message subordinate card),
  `Components/PollCard.jsx` (vote bars/close), `Components/MeetingCard.jsx`
  (Join/disabled states), `Components/LocationPicker.jsx` (province→city + assist
  search), `Components/InsightsCard.jsx`, `utils/echo.js`, `utils/location.js`
  (Haversine client helper for "x km away" labels only — scoring stays server-side).
- MODIFY `CommentThread.jsx` → thin wrapper over CommentTree (keep prop contract so
  card/detail/reels don't churn); `MessageThread.jsx` (quote pin, attach menu, poll/meet
  entry, Echo sub, tombstones); `MessagesInbox.jsx` (live preview); `Navbar.jsx`
  (Echo bell bump); `CreateOpportunity.jsx` + `CreateStoryModal.jsx` (location section);
  `Preferences.jsx` + `PreferenceOnboardingModal.jsx` (location step); `Search.jsx`
  (location filter row); `icons.jsx` (Plus, Paperclip, BarChart, VideoCam, MapPin,
  X already exists); every `onInquire` call-site → `router.visit` deep link (spec §4).
- `OpportunityService`: `collectSignals` += viewer lat/lng + `scoreExpression` +=
  distance part + `applyFilters` += `near/radius_km/province`; `matchReasons` += Nearby.

## 8. Meet flow (concrete)

Connect (`GET /meet/connect` → Google → callback stores encrypted tokens) → schedule
modal → `MeetService::schedule` (refresh token if needed → `CalendarAdapter::createMeet`
→ create `messages` row `{text: title+time, meet_status: scheduled, meet_event_id}` →
`broadcast MeetScheduled`) → card renders Join (link, new tab) → scheduler flips to
`ended` + posts system note → button disables. Cancel: creator → adapter cancel →
status `cancelled` + note. All failures (no tokens, API down with backoff×3, past time)
→ 422 toast, no partial rows (DB transaction).

## 9. Test hooks (for later TASKS/C I)

Pest: nesting cap/reparent, reaction toggle + fan-out (assert notification rows, not
sockets), poll lifecycle, distance ordering with two seeded coords, upload rejections
(php-as-jpg, oversize, svg), channel auth 403/200, meet scheduler flip (time-travel).
Vitest: tree render, optimistic reaction rollback, quote-card render states.

## 10. Risks & mitigations

Reverb-on-Windows (run as foreground process in start script; documented port),
Nominatim 1 req/s (server proxy + cache `locations_cache` 30d — add simple table or
cache store; use Cache::remember, no new table), consent-screen test-mode cap (note in
Meet settings UI: "≤100 test users"), scheduler on Windows (`schedule:work` process),
GCS signed-URL expiry on message media (reuse public objects like uploads today).
