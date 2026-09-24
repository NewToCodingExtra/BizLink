<div align="center">

<img src="frontend/src/assets/bizlink-wordmark.svg" width="220" alt="BizLink" />

# BizLink
### Bridging Brands and Business Owners

**Philippines' verified franchise & wholesale matchmaking platform — curated, transparent, nationwide.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Inertia](https://img.shields.io/badge/Inertia-React-9553E9?style=flat-square)](https://inertiajs.com)
[![Laravel](https://img.shields.io/badge/Laravel-12-FF2D20?style=flat-square&logo=laravel&logoColor=white)](https://laravel.com)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com)
[![Sanctum](https://img.shields.io/badge/Sanctum-Session_+_Token-0B1F3A?style=flat-square)](#auth)
[![License: MIT](https://img.shields.io/badge/License-MIT-C9A24B?style=flat-square)](#license)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-2563EB?style=flat-square)](#contributing)

[Quick Start](#quick-start) · [Features](#features) · [API](#api-endpoints) · [Auth](#auth) · [Design System](#design-system) · [Activity 4 Rubric](#activity-4--rubric-mapping)

</div>

---

## Why BizLink?

> Most franchise discovery in PH happens on scattered Facebook pages and untrusted posters.  
> **BizLink centralizes it** — a single trusted feed where brands publish opportunities and entrepreneurs discover, compare, and launch.

**Dual-role model:** Brands publish verified opportunities → Entrepreneurs discover, inquire, and open private consultation threads — now backed by Laravel + MySQL instead of static mocks.

```
Brand posts Franchise/Wholesale/Resell → Feed + Reels + Stories → Buyer likes/comments/inquires → Private consultation → Saved
```

**Guest landing:** the Bridging Brands hero (`BusinessOverview`) lives on `/` for logged-out visitors, with demo credentials and calls to action. Logged-in users land on the live `/feed`.

---

## Preview

<p align="center">
  <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80&auto=format&fit=crop" width="100%" alt="BizLink Hero" style="border-radius: 16px; border: 1px solid #E2E8F0;" />
</p>

| Feed | Reels | Inbox |
|------|-------|-------|
| Opportunity cards with type badges, ROI, capital | Vertical snap-scroll pitch videos | Private buyer–seller threads separate from comments |
| FilterBar (All / Franchise / Wholesale / Resell / Following) | Tap to unmute, like/inquire overlays | Last-message preview + unread dot, live updates |

---

## Features

| Area | What ships | Detail |
|------|------------|--------|
| **Business Profile** | `BusinessOverview.jsx` on `/` landing | Tagline, dual-role explainer, search, “Explore Franchises” CTA, stats |
| **Mission & Vision** | `MissionVision.jsx` `/about` | Verbatim statements, clearly labeled |
| **Objectives** | `BusinessObjectives.jsx` `/about` | 3 numbered objectives, bento grid |
| **Products/Services** | `OpportunityFeed.jsx` + `OpportunityCard.jsx` | Live from `GET /api/opportunities`, `.map()` with `key`, type badges: Franchise amber / Wholesale slate / Resell blue |
| **Why Choose Us** | `BusinessFeatures.jsx` `/` + `/about` | 4 cards: Verified Brands, Direct Matchmaking, Transparent ROI, Nationwide Reach |
| **Contact** | `ContactForm.jsx` `/contact` | Standalone `POST /api/contact` (the only place the form modal remains) |
| **Feed Interactions** | Like, threaded comments (Seller badge), save, inquire-to-chat | `POST /opportunities/:id/like|save`, nested comments with reply/react/edit/delete/report (`CommentTree.jsx`), media comments — persisted in MySQL |
| **Stories** | `StoriesBar.jsx` → `/stories/:slug` | `GET /api/stories`, gradient ring if unseen, auto-advances, `POST /stories/:id/seen` |
| **Search** | `/search` | Debounced 300ms, Meilisearch typo-tolerant engine + DB fallback |
| **Reels** | `/reels` | `snap-y` vertical, video opportunities from the same API source; profile grids deep-link via `/reels?slug=` (scrolls + highlights the reel) |
| **Messenger** | `/messages` & `/messages/:id` | `GET /api/conversations`, `POST /api/conversations/:id/messages`; **Inquire on any surface redirects to the thread** with the post/reel/story pinned as a clickable quote card (`QuoteCard.jsx`); messages arrive live over Reverb |
| **Realtime** | Reverb WebSocket `:8080` + Echo | `MessageSent` / `NotificationCreated` on private channels (session-authed), typing whispers, 15s-poll fallback with reconnecting chip |
| **Notifications** | Bell + `/notifications` | `GET /api/notifications` with unread badge (live bump), mark-read + mark-all-read; comment replies/reactions and inquiries notify post + comment owners with deep links |
| **Saved** | `/saved` | `GET /api/saved` bookmarks |
| **Profile / Preferences** | `/profile/:id` (`?tab=reels` opens the Reels tab), `/settings/preferences` | `POST /api/follows/toggle`, `GET+PUT /api/preferences` with category/budget auto-sort + one-time onboarding modal |
| **Uploads** | `POST /uploads` (also `/api/auth/uploads`) | Photos ≤20MB, video ≤100MB, docs (chat) ≤25MB — server-sniffed MIME whitelist, extension derived from MIME, GCS when configured else local |
| **Auth** | `/login`, `/register`, `/auth/social/callback`, `/forgot-password`, `/reset-password` | Session auth for the Inertia app (Sanctum tokens kept for the legacy JSON API), Google/Facebook buttons, show/hide passwords, session-aware navbar, protected `/create`, `/messages`, `/saved` |

---

## Brand

The **BizLink** mark is a "linked B": two chain-link bowls sharing a single stem — partnership (the link) forming the initial (the B). Navy `#0B1F3A` = structure/trust, gold `#C9A24B` = status/verified, matching the design tokens below.

| File | Use |
|------|-----|
| `frontend/src/assets/bizlink-mark.svg` | Pictorial mark — Navbar, Footer, tab icon |
| `frontend/src/assets/bizlink-wordmark.svg` | Full lockup (mark + two-tone wordmark) — light backgrounds, docs |
| `frontend/public/favicon.svg` | Browser tab icon (same as pictorial mark) |

On dark surfaces the wordmark splits `Biz` (white) / `Link` (gold); on light surfaces `Biz` (navy) / `Link` (gold).

---

## Design System

Locked via CSS variables + Tailwind — no hardcoded hex in components.

| Token | Value | Use |
|-------|-------|-----|
| `--color-primary` | `#0B1F3A` Navy | Navbar, headings, structure / trust |
| `--color-accent` | `#C9A24B` Gold | Verified/featured badges — rare, never on buttons |
| `--color-action` | `#2563EB` Blue | **Only** primary buttons: Inquire, Post, Send |
| `--color-bg` | `#F8FAFC` | Page background |
| `--color-surface` | `#FFFFFF` | Cards / modals |
| `--color-border` | `#E2E8F0` | Borders & dividers |
| `--color-text-primary` | `#0F172A` | Headlines |
| `--color-text-secondary` | `#64748B` | Descriptions |

**Typography:** Inter (fallback `ui-sans-serif, system-ui`). Scale: `text-4xl md:text-5xl` hero / `text-2xl md:text-3xl` section / `text-lg` card / `text-sm` meta.

**Motion:** `transition-shadow duration-150`, `shadow-sm → hover:shadow-md` only — quiet, finance-grade.

> **Rule enforced:** Navy = structure, Gold = status, Blue = click. Never compete on the same element.

---

## Tech Stack

- **Frontend:** React 19 + Vite 7 + Tailwind CSS v4 + Inertia React (session auth + CSRF via `utils/http.js`), laravel-echo + pusher-js (Reverb protocol)
- **Backend:** Laravel 12 + session auth (Sanctum kept for the legacy JSON API) + Socialite (Google + Facebook OAuth) + GCS uploads + **Reverb WebSocket server**
- **Database/Search:** MySQL 8.0 (`bizlink` on `127.0.0.1:3307`), seeded from the old frontend mocks. Meilisearch on `127.0.0.1:7700` for typo-tolerant search.
- **State:** Inertia page props + local component state (props re-sync via `useEffect` on paginated pages); Echo subscriptions for live threads/bell
- **Lint:** Oxlint
- **Icons:** Shared SVG set (`Components/icons.jsx`, feather-style strokes) — no emoji glyphs anywhere in the UI

---

## Project Structure

```
BizLink/
├── backend/                 Laravel: routes, controllers, Inertia props, Blade shell
│   ├── app/Http/Controllers/  PageController, SessionAuth, Comment/Conversation/Upload…
│   ├── app/Services/          OpportunityService (feed scoring), CommentService, NotificationService
│   ├── app/Events/            MessageSent, NotificationCreated (ShouldBroadcastNow)
│   ├── routes/web.php         Inertia pages + session auth + JSON mutations
│   ├── routes/api.php         JSON API (still available)
│   ├── routes/channels.php    Broadcast channel auth (participant/self only)
│   ├── config/reverb.php      WebSocket server config (:8080)
│   ├── resources/views/app.blade.php   Inertia root (@vite src/app.jsx)
│   └── public/build|hot       Written by frontend Vite (gitignored)
├── frontend/                React + Inertia + Vite (UI only)
│   ├── src/
│   │   ├── app.jsx          Inertia entry + AppLayout
│   │   ├── Pages/           Landing, HomeFeed, Reels, MessageThread, …, Legal/*
│   │   ├── Components/      Navbar, Footer, feeds, CommentTree, QuoteCard, icons.jsx, …
│   │   ├── Layouts/         AppLayout
│   │   ├── context/         Theme + Toast
│   │   ├── utils/           http.js (session + CSRF), echo.js, inquire.js, profilePath
│   │   └── css/app.css      Design tokens + Tailwind
│   └── vite.config.js       laravel-vite-plugin → ../backend/public
├── docs/                    SPECIFICATION / IMPLEMENTATION / TASKS (program blueprints) + CONTINUATION (handoff guide)
└── start-bizlink.ps1        MySQL:3307 + Laravel:8000 + Reverb:8080 + Vite + Meilisearch:7700
```

**Activity 4 → Rubric Mapping**

| Rubric line | Component | Route | Verifiable? |
|-------------|-----------|-------|-------------|
| Company/Business Name | `Navbar.jsx` + `<title>` | Every page | Logo + browser tab |
| Business Profile | `BusinessOverview.jsx` | `/` landing | Tagline + dual-role + search |
| Mission & Vision | `MissionVision.jsx` | `/about` | Labeled verbatim |
| Business Objectives | `BusinessObjectives.jsx` | `/about` | 3 numbered cards |
| Products/Services | `OpportunityFeed` `.map()` | `/feed` | Live cards with keys |
| Features / Why Choose Us | `BusinessFeatures.jsx` | `/` + `/about` | 4 benefit cards |
| Contact | `ContactForm.jsx` | `/contact` + modal | Standalone + pre-filled |
| Footer | `Footer.jsx` | Every page | Links + social + email |

---

## Quick Start

**Prereqs:** Node 18+ / npm 10+, PHP 8.2+ (XAMPP PHP works), Composer, MySQL 8.0

**0) Database (isolated instance on :3307 so existing MySQL installs are untouched):**

```powershell
# data dir already initialized at C:\temp\bizlink-mysql\data
# start it (or run .\start-bizlink.ps1 which does steps 0-2):
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --datadir=C:\temp\bizlink-mysql\data --port=3307 --mysqlx-port=33070 --bind-address=127.0.0.1 --server-id=99
```

Database `bizlink`, user `bizlink` / `Bizlink123!` must exist (created once via `CREATE DATABASE bizlink ...; CREATE USER ...; GRANT ALL ...`).

**1) Backend (`http://localhost:8000`):**

```powershell
cd backend
copy .env.example .env   # set DB_*, APP_KEY, and REVERB_APP_KEY/SECRET (any random hex for local dev)
C:\xampp\php\php.exe C:\Users\Joshua\.config\herd\bin\composer.phar install
C:\xampp\php\php.exe artisan key:generate
C:\xampp\php\php.exe artisan migrate:fresh --seed
C:\xampp\php\php.exe artisan serve --host=127.0.0.1 --port=8000
```

Or one shot: `.\start-bizlink.ps1` from the repo root (MySQL + Laravel + Reverb WS + Vite + Meilisearch).

**2) Frontend Vite (assets for Laravel — open `http://localhost:8000`, not :5173):**

```powershell
cd frontend
npm install
npm run dev      # writes backend/public/hot for HMR
npm run build    # production → backend/public/build
npm run lint     # oxlint
```

Or one shot from repo root: `.\start-bizlink.ps1` (MySQL + Laravel + Reverb + Vite + Meilisearch).

**Demo accounts (seeded):**

| Role | Email | Password |
|------|-------|----------|
| Entrepreneur | `demo@bizlink.ph` | `password123` |
| Brand owner | `brand@bizlink.ph` | `password123` |

---

## Auth

- Browser app: session auth (`POST /login`, `POST /register`) — Sanctum Bearer tokens are kept only for the legacy JSON API. Password fields have show/hide toggles.
- Google + Facebook: buttons on both `/login` and `/register`. `GET /api/auth/{google|facebook}/redirect` → `GET /api/auth/{google|facebook}/callback` → redirects to `/auth/social/callback?provider=...&token=...` which the frontend exchanges via `/auth/me`. Check `GET /api/auth/{provider}/status` first — the frontend does this so a missing setup shows a message instead of a failed fetch. Callback failures redirect with specific codes (`*_not_configured`, `*_denied`, `*_failed`) explained on the callback page.
  - Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback` in `backend/.env` (Cloud Console → APIs & Services → Credentials; whitelist the exact redirect URI; add testers under Audience while in Testing mode).
  - Facebook: `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `FACEBOOK_REDIRECT_URI=http://localhost:8000/api/auth/facebook/callback` (developers.facebook.com → your app → Facebook Login → Valid OAuth Redirect URIs; add testers under App Roles while in Development mode).
- Forgot password (email accounts only; social accounts are told to use their provider button): `POST /api/auth/forgot-password` emails a 60-minute link (log mailer in dev) → `/reset-password?email=...&token=...` → `POST /api/auth/reset-password`.
- Guards: `/create`, `/messages*`, `/notifications`, `/saved`, `/settings/preferences` require auth (`RequireAuth` → `/login`); feed/search/reels stay readable for guests with login prompts on actions.

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | – | Liveness probe |
| POST | `/api/auth/register` | – | Create account + token |
| POST | `/api/auth/login` | – | Login + token |
| POST | `/api/auth/logout` | token | Revoke current token |
| GET | `/api/auth/me` | token | Current user |
| GET | `/api/auth/{provider}/status` | – | Social setup check the frontend calls before redirecting |
| GET | `/api/auth/{provider}/redirect` | – | Social OAuth (503 if unconfigured) |
| GET | `/api/auth/{provider}/callback` | – | Social callback → frontend token |
| POST | `/api/auth/forgot-password` | – | Email a 60-minute reset link (email accounts only) |
| POST | `/api/auth/reset-password` | – | Set new password with token |
| POST | `/api/auth/uploads` | token | Photo/video upload → GCS when configured, else local |
| GET | `/api/users/:id` | – | Public profile (numeric id, `brand-N` or `me`) with posts + stories |
| GET | `/api/opportunities` | – | Paginated list with `?type=&q=&category=&user_id=&brand_id=&following=&page=&per_page=` |
| POST | `/api/opportunities` | token | Publish opportunity |
| GET | `/api/opportunities/:id` | – | Detail with comments |
| POST | `/api/opportunities/:id/like` | token | Toggle like |
| POST | `/api/opportunities/:id/save` | token | Toggle save |
| GET | `/api/saved` | token | Saved list |
| GET/POST | `/api/opportunities/:id/comments` | GET –, POST token | Threaded list / add comment (reply via `parent_id`, media via `media_url`) |
| PATCH/DELETE | `/api/comments/:id` | token | Edit (owner ≤15 min) / soft-delete (owner or post owner) |
| POST | `/api/comments/:id/react` | token | Toggle reaction (👍❤️😮😂🙏) |
| POST | `/api/comments/:id/report` | token | Report (spam/harassment/scam/other, auto-hide ≥3) |
| GET | `/api/comments/:id/replies` | token | Lazy-load replies |
| GET/POST | `/api/stories`, `/api/stories/:id/seen` | GET –, POST token | List / mark seen |
| GET | `/api/conversations`, `/api/conversations/:id` | token | Inbox + thread |
| POST | `/api/inquiries` | token | Inquire → conversation + notification (legacy modal flow) |
| POST | `/api/inquiries/resolve` | session | Find-or-create thread for a post/reel/story → `{url}` with `?inquiry=` quote (used by all Inquire buttons) |
| POST | `/api/conversations/:id/messages` | token | Send message (optional `attachment{type,id}` quote) — broadcasts live |
| GET/POST | `/api/notifications`, `/api/notifications/:id/read`, `/api/notifications/read-all` | token | List / mark read |
| GET/PUT | `/api/preferences` | token | Get / save categories + budget |
| GET/POST | `/api/follows`, `/api/follows/toggle` | token | List / follow brand |
| POST | `/api/contact` | – | Contact form (logged, notification if authed) |

---

## How It Works (With Backend)

- **Posting:** `/create` → upload photo (≤20MB) / video (≤100MB) via hardened `POST /uploads` (server-sniffed MIME whitelist, extension derived from MIME, GCS bucket when configured otherwise local `storage`) → `POST /opportunities` → row in MySQL with `is_new: true`, plus a `new_post` notification.
- **Feed loading:** feed and search paginate with an IntersectionObserver sentinel 600px before the end — more cards stream in with skeleton placeholders, Facebook-style. Server-side personalized scoring (follows +60, category +35, budget fit +25, implicit signals, recency decay, engagement velocity) with diversity re-ranking.
- **Filtering:** `FilterBar` chips + server-side `type` filter; `preferences.categories` layers the auto-sort bonus on top.
- **Comments:** threaded (depth 2) with reply/react/edit/delete/report from the `⋯` menu, media comments, `comment_reply`/`comment_reaction` notifications with `#comment-{id}` deep links.
- **Inquiry:** any `Inquire` → `POST /inquiries/resolve` → thread opens with the item pinned as a clickable quote card; first send carries the quote.
- **Realtime:** `send` broadcasts `MessageSent` to `private-conversation.{id}`; notifications broadcast to `private-user.{id}` (bell bump); typing whispers; 15s-poll fallback if the socket drops. **Reverb must be running or chat sends fail.**
- **Seeding:** `backend/database/seeders/DatabaseSeeder.php` ports the old `src/data/*.js` mocks (16 brands from BrewCraft to PrintFast + comments/stories/inbox) into MySQL. Each brand gets its own user account bound to its posts.

---

## Roadmap

- [x] Laravel backend + MySQL + Sanctum + Google/Facebook OAuth + password reset
- [x] Guest landing vs authenticated feed split
- [x] Infinite-scroll feed/search with skeletons + hardened uploads with local fallback
- [x] Threaded comments (nest, react, edit, report, media) with owner notifications
- [x] Inquire-to-chat redirect with quoted post/reel/story cards
- [x] Realtime consultation inbox (Reverb + live bell) with typing + fallback
- [ ] Location tagging + distance-scored feed (see `docs/CONTINUATION.md` T6)
- [ ] Rich chat: file attachments, polls, sales-insight shares (T7)
- [ ] Google Meet scheduling inside consultation threads (T8)
- [ ] `vitest` + Testing Library for feed interactions
- [ ] GitHub Actions: backend `php artisan test` + frontend build
- [ ] Light/dark theme token

---

## Contributing

PRs welcome — keep design tokens in `index.css`, never hardcode hex. Follow existing component patterns (flat cards, `border-slate-100` + `shadow-sm`). Use XAMPP PHP first in `PATH` when running Composer (`$env:PATH = "C:\xampp\php;" + $env:PATH`) so `openssl` is available.

```powershell
git clone https://github.com/NewToCodingExtra/BizLink.git
cd BizLink
# backend in one terminal, frontend in another (see Quick Start)
git checkout -b feat/your-feature
# ... work, then PR
```

---

## Team

Built for **CLSU — 3rd Year Activity 4 (Information Organization & Visual Presentation)**.  
Collaborators: [@JP16D](https://github.com/JP16D) · [@Daion88](https://github.com/Daion88) · [@NewToCodingExtra](https://github.com/NewToCodingExtra)

---

## License

[MIT](LICENSE) — free to fork, learn, and extend.

<div align="center">

**If this helped you, give it a ⭐ — it helps reviewers find it.**

*Made with navy, gold, and restraint.*

</div>
