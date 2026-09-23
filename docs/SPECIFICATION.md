# BuseLink — Engagement, Location & Realtime Program · SPECIFICATION

Version 1.0 · Status: DRAFT (awaiting approval) · Scope: phased (user-confirmed)

This is the **What**. The How lives in IMPLEMENTATION.md (next). Every behavior below is
specified against the current codebase (Laravel 12 + Inertia React + MySQL 8 + Meilisearch,
session auth, XAMPP/Windows dev) as researched Sep 2026.

Decisions already locked: realtime = **Laravel Reverb** · Meet = **full in-site scheduling**
(Calendar API + per-user OAuth) · location = **manual PH picker + Nominatim assist** (no billing)
· delivery = **phased**.

---

## 1. Program vision

Turn BuseLink from a browse-and-refresh directory into a conversational marketplace:
discussions happen **on** the content (nested comments), interest converts **into** chat
(inquire-to-thread with quoted context), chat carries rich deal-making (media, polls,
sales snapshots, scheduled Meet calls), everything arrives **live** (Reverb), and the feed
prefers what's **nearby** (location scoring). Recovered roadmap context (`next_steps.md`,
deleted in `64c7062`, retrieved from git) already ranked realtime inbox as the #1 leverage
item — this program implements it plus the requested engagement/location/Meet surface.

## 2. Phase map

| Phase | Modules | Shippable outcome |
|---|---|---|
| **1 — Discuss + Convert + Live** | M1 Comments v2, M2 Inquiry redirect, M5 Realtime core | Threads, replies, reactions, inquire lands in chat, messages arrive live |
| **2 — Locate + Enrich** | M4 Location, M3 Message upgrades (media/files/polls/insights) | Location-tagged posts, distance-scored feed, rich chat |
| **3 — Meet** | M6 Meet-in-chat | Schedule/join/end meetings without leaving chat |

Phase 1 has no dependency on 2 or 3. Phase 3 needs Phase 1 realtime. M4 is independent of
M1/M2 and can parallelize with Phase 1 if desired.

---

## 3. M1 — Comment system v2 (all surfaces: feed, reels, story, single post)

### 3.1 Nesting
- `comments.parent_id` nullable self-FK. Depth cap **2** (top-level + one reply level);
  deeper replies attach to the level-1 parent (`parent_id` = top-level id) — flat-enough to
  render, deep-enough to converse. API rejects `parent_id` belonging to another opportunity
  (422) and rejects parent-of-reply nesting beyond cap by re-parenting server-side.
- Every existing surface keeps working: `CommentThread` renders trees; reels modal,
  `OpportunityDetail`, `OpportunityCard` unchanged in wiring, new in rendering.
- Pagination: top-level paginated (20/page, `?page`), replies eager-loaded (cap 3 shown +
  "View N more replies" lazy-loads the rest). No N+1: `with(['user','replies.user'])`.

### 3.2 Hover actions (desktop hover, mobile long-press / tap `⋯`)
Row-level `⋯` menu per comment: **Reply · React · Copy link/text · Edit (owner, 15-min
window) · Delete (owner, or post owner hides) · Report**. Report opens reason picker
(spam / harassment / scam / other) → `comment_reports` row + auto-hide at ≥3 reports
pending review. Copy copies text (or link `#comment-{id}` deep-link that scrolls/highlights
like the reels `slug` pattern). Edit history: `edited_at` set, single "edited" marker
(no version table in v1). Delete is soft (`deleted_at`, "This comment was deleted"
tombstone preserving replies).

### 3.3 Reactions
- `comment_reactions(comment_id, user_id, emoji)` unique per triple. Allowed set (fixed,
  server-enforced): 👍 ❤️ 😮 😂 🙏. Toggle endpoint. Counts denormalized per comment payload
  (`reactions: {emoji: count}`, `myReaction`).
- Notification fan-out on react: **post owner AND comment owner** (skip self-notify; skip if
  reactor owns both). Type `comment_reaction`, link `/post/{slug}#comment-{id}`.

### 3.4 Reply notifications
On reply: notify **post owner AND parent-comment owner** (skip self, dedupe when same
person). Type `comment_reply`, same deep link. Top-level comments keep today's behavior
(notify post owner only).

### 3.5 Comment media ("comment a photo or video", "attach comment on image/video")
- Comment may attach **one** photo/video via existing `POST /uploads` (same 100MB video /
  20MB image caps, same MIME whitelist — no new upload path).
- `comments.media_url (2048, nullable)`, `comments.media_type (image|video, nullable)`.
- Text is optional when media present ("additional comment on the image or video" = the
  text body rides with the media, rendered as captioned thumbnail/player). Validation:
  reject empty text AND no media (422). Media comments appear in trees identically.
- Seller-reply flag (`is_seller_reply`) auto-set as today when commenter owns the post.

### 3.6 Acceptance (M1)
Post → comment → reply → react → edit (in window) → report → media comment, each with
correct notifications to post+comment owners; depth cap enforced; tombstones preserve
threads; all four surfaces render identically.

---

## 4. M2 — Inquire becomes "go to chat with context" (feed, reels, story, single, saved, search, profile)

### 4.1 Redirect, not modal
Every `onInquire` today opens `ContactForm` modal — **replaced** (keep `ContactForm` only
for the generic Contact page) with:
`router.visit('/messages/{withUsername|brandId}?inquiry={type}:{id}')`
where `type ∈ {opportunity, story}`. The thread page resolves-or-creates the 1:1
conversation (existing `ConversationController@inquire` collapse logic reused, extended
with the quoted attachment) and focuses the composer with the quote attached.

### 4.2 Quoted context card (above the composer AND on sent messages)
- Composer quote: card pinned above the input showing thumbnail + headline/caption +
  price/ROI or duration + source label (Post / Reel / Story). Dismissible (×) before send.
- Sent message with quote renders the card **above the bubble**: `bg-white/5`
  (translucent), indented (`ml-6` + left accent border), smaller type — visually subordinate
  to the message. **Clickable**: post → `/post/{slug}`, reel → `/reels?slug={slug}`
  (existing deep-link), story → `/stories/{slug}`.
- Data: reuse the existing `Message.attachment_id/type` morph (Opportunity|Story; reels
  are opportunities with `media_type=video`, no new type). `ConversationController@send`
  accepts optional `attachment:{type,id}` validated to exist + visible to sender.
- Stories expire: quoting an expired story renders "Story expired" tombstone card (still
  listed, not clickable).

### 4.3 Acceptance (M2)
From every surface, Inquire lands in the right thread with quote pinned; send → quoted
message renders subordinate + clickable; no surface still opens the old modal (except
Contact page); expired-story quote degrades gracefully.

---

## 5. M3 — Message upgrades (inside the thread)

### 5.1 Photo / file attachments
- Composer attach button → `POST /uploads` (hardened path) → `send` accepts
  `media_url + media_type`. New whitelist for **files**: `pdf, doc, docx, xls, xlsx, txt,
  zip` (server-sniffed MIME map, extension-from-MIME, 25MB cap) — images/video keep
  existing caps. Render: image/video inline, files as download cards (name, size, type
  icon). Guards: same as UploadController doctrine (MIME whitelist, no SVG/HTML/exe,
  UUID names, size caps, 422 messages surfaced as toasts). No ClamAV locally — declared
  non-goal, compensated by whitelist + no-execution storage.

### 5.2 Polls
- `polls(conversation_id, question, options JSON[2–5], closes_at nullable, closed bool)` +
  `poll_votes(poll_id, user_id, option_index)` unique per pair. Any participant creates
  (composer ⋯ → Poll), votes once (tap to change until close), creator or auto-expiry
  closes. Render: option bars with % + counts, voters hidden (v1), closed state +
  `poll_closed` system note. One open poll per conversation (422 otherwise).

### 5.3 Sales-insights share ("easily sharing data")
- One-tap **stat snapshot card** the brand can drop into chat: computed server-side from
  own data — `posts count · total inquiries received · total likes · top post (headline +
  likes)`. Rendered as a compact card (not editable, timestamped "as of"). Endpoint
  `POST /conversations/{id}/insights` (brand-side participant only). v1 = own-stats only
  (no cross-brand analytics, no fake precision — counts only).

### 5.4 Acceptance (M3)
Photo/file/poll/insight all send, render, and persist; malicious files (php-as-jpg,
oversize, svg) rejected with toast; poll lifecycle (vote/change/close) correct; insights
reflect real counts.

---

## 6. M4 — Location (post it, prefer it, score it)

### 6.1 Capture
- New nullable columns on `opportunities` + `stories`: `city (string 255), province
  (string 255), latitude (decimal 10,7), longitude (decimal 10,7)`.
- Create forms (opportunity + story modal) gain a location step/section: **PH
  province → city/municipality dropdowns** (bundled static dataset, no key) + **assist
  search box** (Nominatim, debounced, `limit=5`, attribution "© OpenStreetMap") that
  fills the same fields + coords. Manual pin-adjust: not in v1 (dropdown + search only).
- Serialization: `location: {city, province, lat, lng} | null` on resources, profile,
  detail, reels payloads.

### 6.2 Preferences + scoring
- Preferences gain `province, city, latitude, longitude` (same picker, on onboarding step
  and Preferences page). Migration backfills nothing — NULL = no location signal.
- `OpportunityService` adds distance signal: Haversine over courrier lat/lng vs viewer
  prefs (SQL, km): **+20 within 25 km, linear decay to 0 at 200 km, 0 beyond / NULL
  either side** (neutral — never penalizes untagged content). New reason string
  `"Nearby"`. Weight intentionally below follows (+60) and category (+35), above trust.
- Filters: `?near={lat,lng}&radius_km=` (default radius 100) + `?province=` exact match.
  Search page gains location filter row. MySQL 8: plain decimal math (no spatial index
  v1; index `(latitude, longitude)` plain composite for bounding-box prefilter).

### 6.3 Acceptance (M4)
Post with location → stored + shown; prefs location saves; feed reorders nearer first
(verified with two seeded distances); NULL-location content still appears (no penalty);
Nominatim failures degrade to manual dropdowns silently.

---

## 7. M5 — Realtime consultation (Reverb)

### 7.1 Transport
- Install `laravel/reverb`, `BROADCAST_CONNECTION=reverb`, WS on **:8080** (free port,
  documented), `start-bizlink.ps1` gains the WS process + health check. Private channels
  via `/broadcasting/auth` (session auth — same cookie the app already uses).
- Channels: `private-conversation.{id}` (messages, typing, poll/meet events),
  `private-user.{id}` (notification + unread-badge bump for Navbar bell).

### 7.2 Events (all `ShouldBroadcast`, private channels, no payload secrets)
- `MessageSent` (message + sender + quoted card + attachments), `CommentReplied`
  (optional live prepend in open threads — Phase 1 stretch, default ON for detail page),
  `TypingStarted/Stopped` (whisper, 3s timeout), `PollUpdated/PollClosed`,
  `MeetScheduled/MeetEnded`, `NotificationCreated` (bell bump + toast).
- Auth: channel auth closures verify **participant** (conversation) or **self** (user).
  Leaver/revoked access → 403 on auth, no history leak (history still comes from
  controller with existing checks).

### 7.3 Client
- `laravel-echo` + `pusher-js` (Reverb protocol) bootstrapped once (`echo.js`), subscribed
  in `MessageThread` (append/offer-scroll, mark-read on view), `Navbar` bell (unread bump),
  `MessageInbox` (last-message preview update). Graceful fallback: if WS unreachable after
  5s, 15s polling in open thread + "reconnecting" chip (no silent staleness).
- Presence for "online" dots: deferred (non-goal v1; typing whispers only).

### 7.4 Acceptance (M5)
Two browsers (buyer + brand): send → appears <1s, typing shows, poll vote updates live,
bell bumps, WS-kill falls back to polling with visible chip; private channel of a third
user's conversation 403s.

---

## 8. M6 — Google Meet inside consultation

### 8.1 Connect (prerequisite UX)
- "Connect Google" button in thread ⋯ menu / profile settings → OAuth with
  `calendar.events` scope (new Socialite scopes **only on this flow**, not login) →
  `google_tokens(user_id unique, access_token encrypted, refresh_token encrypted,
  expires_at)` + auto-refresh on use. Disconnect revokes + deletes row. Non-connected
  users hitting Meet actions get the connect prompt (no dead buttons).

### 8.2 Schedule in chat
- Composer ⋯ → Meet → modal (title prefilled `Consultation: {post headline}`,
  datetime picker ≥ now+15min, duration 15/30/60) → server `Calendar.events.insert`
  with `conferenceData (createRequest)` → Meet link returned → auto-posted as a
  **meeting card message** (title, time, Join button, "scheduled by X"). Both sides see
  it instantly (M5 `MeetScheduled`).
- Cancel from card (creator only) → Calendar delete + `MeetEnded(reason=cancelled)`.

### 8.3 End detection + link disable
- Scheduler (Laravel scheduler + DB queue, every 5 min): events past `end.dateTime` →
  post `MeetEnded(reason=ended)` system message + set `messages.meet_status=ended`
  → Join button renders **disabled** ("Meeting ended"). No polling by clients; state
  arrives over the socket (or next thread load).
- Timezone: stored UTC, rendered in browser locale. All-day/multi-day rejected (422).

### 8.4 Caveats (declared, not solved in v1)
Google Cloud consent screen (test mode = 100 users, needs verification for production),
per-user OAuth only (no service-account impersonation), Meet links require the Calendar
API (no link-minting without it), recording/transcript out of scope.

### 8.5 Acceptance (M6)
Connect → schedule → both see card live → Join opens Meet URL in new tab → after end,
"meeting ended" message posts and button disables; cancel path identical; disconnected
user flow prompts connect; expired-token refresh silent.

---

## 9. Cross-cutting rules

- **Notifications**: new types `comment_reply, comment_reaction, meet_scheduled,
  meet_ended, poll_closed` (all with deep `link`); existing types untouched; bell +
  Notifications page render new types with icons (reuse `icons.jsx`, extend, no emoji).
- **Authorization**: comment edit = owner ≤15 min; delete = owner (soft) / post-owner
  hide; poll close = creator; insights share = brand-side participant; meet cancel =
  scheduler; story/post visibility checks reused for quotes.
- **Rate limits**: comments 10/min/user, reactions 60/min, messages 30/min, polls 5/day/
  conversation, meet create 10/day/user (Laravel `throttle` middleware, 429 → toast).
- **Validation/messages**: every 422 carries a human `message` (toast path already
  surfaces `json.message`); no silent failures.
- **Performance**: pagination everywhere new (replies, reactions, votes); indexes on all
  new FKs + `(latitude,longitude)`; keep N+1 out via eager loads (enforced in review).
- **Security**: upload doctrine from the 100MB hardening (MIME whitelist,
  extension-from-MIME, UUID names, caps) extended to message files; OAuth tokens
  encrypted at rest; broadcast payloads contain no tokens/PII beyond display names.

## 10. Explicit non-goals (v1)

 comment version history · threaded DMs (1:1 + brand contexts only) · video/voice chat
 in-app (Meet covers it) · service-account Meet (no impersonation) · ClamAV scanning ·
 presence/online dots · email digests · brand verification workflow, reviews, PWA, CI
 (old roadmap items 2,3,5,7,8 — untouched, still valid later).

## 11. Acceptance of the program

Phase gates: P1 (discuss+convert+live against §3/§4/§7.4) → P2 (§6 + §5.4) → P3 (§8.5),
each demoed with two accounts (buyer + brand) on the running XAMPP stack.
