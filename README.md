<div align="center">

<img src="frontend/src/assets/bizlink-wordmark.svg" width="220" alt="BizLink" />

# BizLink
### Bridging Brands and Business Owners

**The Philippines' verified franchise and wholesale matchmaking platform — curated opportunities, direct inquiries, nationwide reach.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Inertia](https://img.shields.io/badge/Inertia-React-9553E9?style=flat-square)](https://inertiajs.com)
[![Laravel](https://img.shields.io/badge/Laravel-12-FF2D20?style=flat-square&logo=laravel&logoColor=white)](https://laravel.com)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com)
[![Reverb](https://img.shields.io/badge/Reverb-WebSockets-0B1F3A?style=flat-square)](https://laravel.com/docs/reverb)
[![License: MIT](https://img.shields.io/badge/License-MIT-C9A24B?style=flat-square)](#license)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-2563EB?style=flat-square)](#contributing)

</div>

## Contents

- [Why BizLink?](#why-bizlink)
- [Preview](#preview)
- [Getting the code](#getting-the-code)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Features](#features)
- [Admin console](#admin-console)
- [Design system](#design-system)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [API endpoints](#api-endpoints)
- [Auth](#auth)
- [Configuration](#configuration)
- [Build, test, and deploy](#build-test-and-deploy)
- [Troubleshooting](#troubleshooting)
- [Security notes](#security-notes)
- [Contributing](#contributing)
- [Team](#team)
- [License](#license)

---

## Why BizLink?

> Most franchise discovery in PH happens on scattered Facebook pages and untrusted posters.
> **BizLink centralizes it** — one trusted feed where brands publish opportunities and entrepreneurs discover, compare, and launch.

**Dual-role model:** brands publish verified opportunities, entrepreneurs discover them, inquire, and open private consultation threads.

```
Brand posts Franchise / Wholesale / Resell → Feed + Reels + Stories → Buyer likes, comments, inquires → Private consultation → Saved shortlist
```

**Guest landing:** visitors see the Bridging Brands hero with demo credentials and calls to action on `/`. Signing in takes you to the live `/feed`.

**Requirements:** PHP 8.2+, MySQL 8.0, Node 18+. Optional: Google/Facebook OAuth apps, Meilisearch (search falls back to the database without it).

**Platforms:** Windows (XAMPP), macOS, Linux. Developed on Windows + XAMPP.

---

## Preview

<p align="center">
  <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80&auto=format&fit=crop" width="100%" alt="BizLink marketplace preview" style="border-radius: 16px; border: 1px solid #E2E8F0;" />
</p>

| Feed | Reels | Inbox |
|------|-------|-------|
| Opportunity cards with type badges, ROI, capital, author-role pills | Vertical snap-scroll pitch videos with smart thumbnails | Private buyer–seller threads with quotes, polls, files, Meet |
| Filter chips (All / Franchise / Wholesale / Resell / Following) | Autoplay in view, tap to unmute, like/inquire overlays | Last-message preview, unread dot, live updates |

---

## Getting the code

```bash
git clone https://github.com/NewToCodingExtra/BizLink.git
cd BizLink
```

> [!IMPORTANT]
> Clone into a folder path **without spaces** if you can (for example `C:\projects\BizLink`). Paths like `C:\xampp\htdocs\3RD YEAR\BuseLink` work, but you must quote them in every PowerShell command and some tooling handles them poorly.

No submodules, no Git LFS, no monorepo tricks — a plain clone is enough.

---

## Prerequisites

| Tool | Version | Why it matters | Link |
|------|---------|----------------|------|
| [PHP](https://www.php.net/downloads) | 8.2+ | Backend runtime; older PHP cannot run Laravel 12 | [php.net](https://www.php.net/downloads) |
| [Composer](https://getcomposer.org/) | 2.x | Installs Laravel dependencies | [getcomposer.org](https://getcomposer.org/) |
| [MySQL](https://www.mysql.com/) | 8.0 | Primary database (isolated instance on `:3307` so existing installs are untouched) | [mysql.com](https://www.mysql.com/) |
| [Node.js + npm](https://nodejs.org/) | 18+ / 10+ | Builds the React frontend | [nodejs.org](https://nodejs.org/) |

Optional but recommended:

| Tool | Purpose |
|------|---------|
| [Google Cloud OAuth app](https://console.cloud.google.com/apis/credentials) | Google sign-in + Calendar/Meet connection (see [Auth](#auth)) |
| [Facebook Login app](https://developers.facebook.com/apps) | Facebook sign-in |
| [Meilisearch](https://www.meilisearch.com/) | Typo-tolerant search; the app falls back to database search when it is down |

Verify your toolchain:

```powershell
php --version      # 8.2+
composer --version # 2.x
node --version     # 18+
npm --version      # 10+
```

> [!TIP]
> On Windows, put XAMPP's PHP first in `PATH` before running Composer (`$env:PATH = "C:\xampp\php;" + $env:PATH`) so the `openssl` extension is available.

---

## Getting started

### 0) Database

A dedicated MySQL instance on `:3307` keeps existing installs untouched:

```powershell
# data dir already initialized at C:\temp\bizlink-mysql\data
# or run .\start-bizlink.ps1 from the repo root, which does steps 0–2 for you:
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --datadir=C:\temp\bizlink-mysql\data --port=3307 --mysqlx-port=33070 --bind-address=127.0.0.1 --server-id=99
```

Database `bizlink`, user `bizlink` / `Bizlink123!` must exist once (see [Configuration](#configuration)):

```sql
CREATE DATABASE bizlink CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bizlink'@'127.0.0.1' IDENTIFIED BY 'Bizlink123!';
GRANT ALL ON bizlink.* TO 'bizlink'@'127.0.0.1';
```

### 1) Backend (`http://localhost:8000`)

```powershell
cd backend
copy .env.example .env   # then set DB_* and APP_KEY below
composer install
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve --host=127.0.0.1 --port=8000
```

### 2) Frontend (assets for Laravel — open `http://localhost:8000`, not `:5173`)

```powershell
cd frontend
npm install
npm run dev      # HMR via backend/public/hot
npm run build    # production → backend/public/build
npm run lint     # oxlint
```

> [!TIP]
> One shot from the repo root: `.\start-bizlink.ps1` starts MySQL + Laravel + Reverb + Vite + Meilisearch together.

**Demo accounts (seeded):**

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@bizlink.ph` | `password123` |
| Entrepreneur | `demo@bizlink.ph` | `password123` |
| Brand owner | `brand@bizlink.ph` | `password123` |

---

## Features

| Area | What ships | Detail |
|------|------------|--------|
| **Landing / About** | `BusinessOverview`, `MissionVision`, `BusinessObjectives`, `BusinessFeatures` | Hero, dual-role explainer, verbatim mission/vision, 3 objectives, 4 benefit cards |
| **Feed** | `OpportunityFeed` + `OpportunityCard` | Infinite scroll with skeletons, type badges, ROI/capital chips, author-role pills (Brand/Entrepreneur), like/save/inquire |
| **Post overlay** | `PostModal` | Facebook-style modal: post summary + full comment thread, keeps cards compact |
| **Comments** | `CommentTree` | Threaded (depth 2), reply/react/edit/delete/report, media comments, seller badge, `#comment-{id}` deep links |
| **Video** | `FeedVideo`, `SmartMedia` | Autoplay muted in view with play overlay + mute chip; thumbnails captured from the brightest video frame, never a black intro |
| **Reels** | `/reels` | Snap-scroll pitch videos, tap to unmute, profile grids deep-link via `/reels?slug=` |
| **Stories** | `StoriesBar` → `/stories/:slug` | Public daily rail, gradient ring if unseen, auto-advance, like support |
| **Search** | `/search` | Debounced 300ms, Meilisearch typo-tolerant engine with database fallback |
| **Messenger** | `/messages`, `/messages/:id` | Quote cards, polls with live results, file attachments, sales-insight shares, Google Meet scheduling, live delivery over Reverb with poll fallback |
| **Notifications** | Bell + `/notifications` | Unread badge with live bump, mark-read + mark-all-read, deep links for replies/reactions/inquiries |
| **Saved / Profile / Preferences** | `/saved`, `/profile/:id`, `/settings/preferences` | Bookmarks, `?tab=reels` grids, follows, category/budget auto-sort + onboarding modal |
| **Uploads** | `POST /uploads` | Photos ≤20MB, video ≤100MB, docs ≤25MB — server-sniffed MIME whitelist, extension derived from MIME, GCS when configured else local |
| **Auth** | `/login`, `/register`, `/welcome/role` | Email + Google/Facebook, first-run role picker for new social accounts, password reset, show/hide passwords |

---

## Admin console

Restricted to the Admin role (`/admin`): live stats, newest accounts, top posts, and four working modules plus global settings.

| Module | Route | What it does |
|--------|-------|--------------|
| **Reports queue** | `/admin/reports` | Unified moderation for posts, reels, comments, stories, messages, chats, users. Severity-weighted priorities, filters/sort/search, reject-with-reason (reporter notified) or accept with warn / remove / timed-suspend / ban (both parties notified) |
| **Users** | `/admin/users` | Search/filter/sort, strike history, warn, suspend, ban/unban, role changes, password resets, rate-limit lockout view + unlock |
| **Verifications** | `/admin/verifications` | Brand verification requests with document review; approval issues the `✓ Verified` badge (never shown without it) |
| **Analytics** | `/admin/analytics` | Signups, posts, inquiries, report outcomes, resolve times, leaderboards (Recharts) |
| **Settings** | `/admin/settings` | Rate limits, session/demo/registration flags, storage meter, admin accounts, feature flags, local + external backups with restore |
| **Exports** | `/admin/export/*` | Styled XLSX + CSV for users, reports, verifications, audit logs, honoring current filters |

Every enforcement and settings action is written to an audit log and notifies the affected users.

---

## Design system

Locked via CSS variables + Tailwind — no hardcoded hex in components.

| Token | Value | Use |
|-------|-------|-----|
| `--color-primary` | `#0B1F3A` Navy | Navbar, headings, structure / trust |
| `--color-accent` | `#C9A24B` Gold | Verified/featured badges — rare, never on buttons |
| `--color-action` | `#2563EB` Blue | **Only** primary buttons: Inquire, Post, Send |
| `--color-bg` | `#F8FAFC` | Page background |
| `--color-surface` | `#FFFFFF` | Cards / modals |
| `--color-border` | `#E2E8F0` | Borders and dividers |
| `--color-text-primary` | `#0F172A` | Headlines |
| `--color-text-secondary` | `#64748B` | Descriptions |

**Typography:** Inter (fallback `ui-sans-serif, system-ui`). Scale: `text-4xl md:text-5xl` hero / `text-2xl md:text-3xl` section / `text-lg` card / `text-sm` meta.

**Motion:** `transition-shadow duration-150`, `shadow-sm → hover:shadow-md` only — quiet, finance-grade.

> **Rule enforced:** Navy = structure, Gold = status, Blue = click. Never compete on the same element.

---

## Tech stack

- **Frontend:** React 19 + Vite 7 + Tailwind CSS v4 + Inertia React (session auth + CSRF via `utils/http.js`), laravel-echo + pusher-js (Reverb protocol), Recharts (admin analytics)
- **Backend:** Laravel 12 + Fortify session auth (Sanctum kept for the legacy JSON API) + Socialite (Google + Facebook OAuth) + Spatie permissions + GCS uploads + Reverb WebSocket server
- **Database/Search:** MySQL 8.0 (`bizlink` on `127.0.0.1:3307`), seeded demo data. Meilisearch on `127.0.0.1:7700` for typo-tolerant search with database fallback
- **State:** Inertia page props + local component state (props re-sync via `useEffect` on paginated pages); Echo subscriptions for live threads/bell
- **Quality:** Oxlint, PHPUnit (`AdminAccessTest`, `AdminConsoleModulesTest`, `OrphanProtectionTest`)
- **Icons:** Shared SVG set (`Components/icons.jsx`, feather-style strokes) — no emoji glyphs anywhere in the UI

---

## Project structure

```
BizLink/
├── backend/                       Laravel: routes, controllers, Inertia props, Blade shell
│   ├── app/Http/Controllers/      PageController, SessionAuth, Comment/Conversation/Upload,
│   │                              Meet, Poll, Location, Report, RoleSetup…
│   ├── app/Http/Controllers/Admin/  Dashboard data, Reports, Users, Verifications,
│   │                              Analytics, Settings, Exports
│   ├── app/Services/              OpportunityService (feed scoring), CommentService,
│   │                              ReportService, EnforcementService, MeetService,
│   │                              GoogleCalendarAdapter, NotificationService…
│   ├── app/Models/                Opportunity, Story, Comment, Conversation, Message,
│   │                              Report(+Category), VerificationRequest, GoogleToken…
│   ├── app/Events/                MessageSent, NotificationCreated (ShouldBroadcastNow)
│   ├── app/Policies/              OpportunityPolicy (ownership + permission gates)
│   ├── routes/web.php             Inertia pages + session auth + JSON mutations
│   ├── routes/api.php             JSON API (still available)
│   ├── routes/admin.php           Admin console + exports
│   ├── routes/channels.php        Broadcast channel auth (participant/self only)
│   ├── config/reverb.php          WebSocket server config (:8080)
│   ├── resources/views/app.blade.php  Inertia root (@vite src/app.jsx)
│   ├── tests/Feature/             AdminAccessTest, AdminConsoleModulesTest, …
│   └── public/build|hot           Written by frontend Vite (gitignored)
├── frontend/                      React + Inertia + Vite (UI only)
│   ├── src/
│   │   ├── app.jsx                Inertia entry + AppLayout
│   │   ├── Pages/                 Landing, HomeFeed, Reels, MessageThread, PostModal
│   │   │                          flows, Admin/*, Welcome/Role, Legal/*
│   │   ├── Components/            Navbar, Footer, feeds, CommentTree, QuoteCard,
│   │   │                          SmartMedia, FeedVideo, DropdownMenu, icons.jsx, …
│   │   ├── Layouts/               AppLayout
│   │   ├── context/               Theme + Toast
│   │   ├── utils/                 http.js (session + CSRF), echo.js, inquire.js,
│   │   │                          profilePath, videoThumb.js
│   │   └── css/app.css            Design tokens + Tailwind
│   └── vite.config.js             laravel-vite-plugin → ../backend/public
├── docs/                          SPECIFICATION / IMPLEMENTATION / TASKS + CONTINUATION
└── start-bizlink.ps1              MySQL:3307 + Laravel:8000 + Reverb:8080 + Vite + Meilisearch:7700
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

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | – | Liveness probe |
| POST | `/api/auth/register` | – | Create account + token |
| POST | `/api/auth/login` | – | Login + token |
| POST | `/api/auth/logout` | token | Revoke current token |
| GET | `/api/auth/me` | token | Current user |
| GET | `/api/auth/{provider}/status` | – | Social setup check the frontend calls before redirecting |
| GET | `/api/auth/{provider}/redirect` | – | Social OAuth (503 if unconfigured) |
| GET | `/api/auth/{provider}/callback` | – | Social callback → frontend token (`&new_account=1` for new users) |
| POST | `/api/auth/forgot-password` | – | Email a 60-minute reset link (email accounts only) |
| POST | `/api/auth/reset-password` | – | Set new password with token |
| POST | `/api/auth/uploads` | token | Photo/video upload → GCS when configured, else local |
| GET | `/api/users/:id` | – | Public profile (numeric id, `brand-N` or `me`) with posts + stories |
| GET | `/api/opportunities` | – | Paginated list with `?type=&q=&category=&user_id=&brand_id=&following=&page=&per_page=` |
| POST | `/api/opportunities` | token | Publish opportunity |
| GET | `/api/opportunities/:id` | – | Detail with comments |
| POST | `/api/opportunities/:id/like` | token | Toggle like |
| POST | `/api/opportunities/:id/save` | token | Toggle save |
| POST | `/api/opportunities/:id/report` | token | Report post/reel (9-category catalog, feeds admin priority queue) |
| GET | `/api/saved` | token | Saved list |
| GET/POST | `/api/opportunities/:id/comments` | GET –, POST token | Threaded list / add comment (reply via `parent_id`, media via `media_url`) |
| PATCH/DELETE | `/api/comments/:id` | token | Edit (owner ≤15 min) / soft-delete (owner or post owner) |
| POST | `/api/comments/:id/react` | token | Toggle reaction (👍❤️😮😂🙏) |
| POST | `/api/comments/:id/report` | token | Report comment into the unified moderation queue |
| GET | `/api/comments/:id/replies` | token | Lazy-load replies |
| GET | `/api/stories`, `/api/stories/:id/seen` | GET –, POST token | Public daily rail / mark seen |
| POST | `/api/stories/:id/report`, `/api/messages/:id/report`, `/api/conversations/:id/report`, `/api/users/:id/report` | token | Report any surface into the unified queue |
| GET | `/report-categories` | token | The 9 report categories with severity weights |
| GET | `/api/conversations`, `/api/conversations/:id` | token | Inbox + thread |
| POST | `/api/inquiries` | token | Inquire → conversation + notification (legacy modal flow) |
| POST | `/api/inquiries/resolve` | session | Find-or-create thread for a post/reel/story → `{url}` with `?inquiry=` quote (used by all Inquire buttons) |
| POST | `/api/conversations/:id/messages` | token | Send message (optional `attachment{type,id}` quote) — broadcasts live |
| POST | `/api/conversations/:id/polls` | token | Create a poll (5/day) |
| POST | `/api/polls/:id/vote`, `/api/polls/:id/close` | token | Vote / close poll |
| GET/POST | `/api/notifications`, `/api/notifications/:id/read`, `/api/notifications/read-all` | token | List / mark read |
| GET/PUT | `/api/preferences` | token | Get / save categories + budget |
| GET/POST | `/api/follows`, `/api/follows/toggle` | token | List / follow brand |
| GET | `/api/locations/regions`, `/api/locations/search` | – | Location lookup for tagging |
| POST | `/api/contact` | – | Contact form (logged, notification if authed) |

Web (Inertia) additions: `/auth/{provider}/redirect|callback` (primary social flow), `/welcome/role` (new-account role picker), `/meet/connect|callback|status` (Calendar/Meet OAuth), `/meet/disconnect`, `POST /logout` (Fortify). Admin: `/admin`, `/admin/reports*`, `/admin/users*`, `/admin/verifications*`, `/admin/analytics`, `/admin/settings*`, `/admin/export/*` (xlsx/csv).

---

## Auth

- **Session auth** via [Laravel Fortify](https://laravel.com/docs/fortify): `POST /login`, `POST /register` (role picker: entrepreneur/brand), `POST /logout`. Brands land on `/feed` after login; admins land on `/admin`.
- **Social sign-in** (primary flow): `/auth/{provider}/redirect` → provider → `/auth/{provider}/callback`. Brand-new accounts go through **`/welcome/role`** to pick Entrepreneur vs Brand before entering the app; returning users keep their existing role. Google sign-in also requests Calendar scope once, auto-connecting Google Calendar + Meet. Legacy token flow (`/api/auth/...` + `/auth/social/callback?token=`) is kept for API clients.
- **Authorization** via [Spatie Laravel Permission](https://spatie.be/docs/laravel-permission): `Admin` (everything) / `Manager` (brands) / `User` (entrepreneurs). Posting, messaging, and admin routes are permission-gated; ownership rules live in `OpportunityPolicy`.
- **Password reset** (email accounts only; social accounts are directed to their provider button): forgot-password emails a 60-minute link (log mailer in dev) → `/reset-password?email=...&token=...`.
- **Guards:** `/create`, `/messages*`, `/notifications`, `/saved`, `/settings/preferences` require auth; feed/search/reels stay readable for guests with login prompts on actions.
- **Google setup:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback` in `backend/.env` (Cloud Console → APIs & Services → Credentials; whitelist the exact redirect URI; add testers under Audience while in Testing mode). **Facebook:** `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `FACEBOOK_REDIRECT_URI=...` (developers.facebook.com → your app → Facebook Login → Valid OAuth Redirect URIs; add testers under App Roles while in Development mode).
- Callback failures redirect with specific codes (`*_not_configured`, `*_denied`, `*_failed`) explained on the callback page.

Demo accounts: `admin@bizlink.ph`, `brand@bizlink.ph`, `demo@bizlink.ph` (all `password123`).

---

## Configuration

The only config file that matters locally is `backend/.env` (copied from `.env.example`). Vite reads it too (no separate frontend env file).

| Variable | Default (dev) | Purpose |
|----------|---------------|---------|
| `APP_URL` | `http://localhost:8000` | Canonical URL (OAuth, links, Vite) |
| `DB_HOST` / `DB_PORT` / `DB_DATABASE` / `DB_USERNAME` / `DB_PASSWORD` | `127.0.0.1` / `3307` / `bizlink` / `bizlink` / `Bizlink123!` | Isolated MySQL instance |
| `SESSION_DRIVER`, `CACHE_STORE`, `QUEUE_CONNECTION` | `database` | Shared, persistent stores — no Redis needed locally |
| `REVERB_APP_KEY` / `REVERB_APP_SECRET` | (any random hex locally) | WebSocket auth; `REVERB_HOST=127.0.0.1`, `REVERB_PORT=8080` |
| `MAIL_MAILER` | `log` | Password resets print to the log in dev; use `smtp` in production |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` | empty | Google sign-in + Meet (leave empty to disable cleanly with a 503 message) |
| `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET` / `FACEBOOK_REDIRECT_URI` | empty | Facebook sign-in |
| `GOOGLE_CLOUD_STORAGE_BUCKET` (+ project/key) | empty | Uploads target; empty = local `public` disk |
| `DEMO_LOGIN` | `true` | One-click demo sign-in — **set `false` in any real deployment** |
| `APP_DEBUG` | `true` locally | **Must be `false` in production** |

---

## Build, test, and deploy

```powershell
cd frontend
npm run build   # production → backend/public/build
npm run lint    # oxlint
```

```powershell
cd backend
php artisan test            # PHPUnit: AdminAccessTest, AdminConsoleModulesTest, …
php artisan migrate --force # production-safe migrations (never :fresh outside dev)
```

Deployment is Railway-first: `Dockerfile` + `railway.json` + `docker/` (Apache, Supervisor running web + queue + Reverb + scheduler, entrypoint migrates and caches config). Steps: push, add the MySQL plugin, attach a volume at `backend/storage`, fill the variables below, deploy. Vercel-style serverless hosting does **not** fit (PHP runtime, websockets, local disk).

| Variable | Value on Railway |
|----------|------------------|
| `APP_URL` | `https://<service>.up.railway.app` |
| `APP_ENV` / `APP_DEBUG` / `DEMO_LOGIN` | `production` / `false` / `false` |
| `APP_KEY` | `base64:…` (generate once, keep stable — sessions/cookies depend on it) |
| `DB_*` | From the MySQL plugin (`MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER`, `MYSQLPASSWORD`) |
| `SESSION_DOMAIN` | empty (host-only cookie) or your custom domain |
| `SESSION_SECURE_COOKIE` | `true` |
| `LOG_CHANNEL` | `stderr` (shows in Railway logs) |
| `SCOUT_DRIVER` | `database` (or add a Meilisearch service and point `MEILISEARCH_HOST` at it) |
| `REVERB_APP_KEY` / `REVERB_APP_SECRET` | any random hex (must also reach the browser — set matching `VITE_REVERB_APP_KEY`); host/port auto-derive, websockets share the web domain via `/app` proxy |
| `MAIL_*` | Real SMTP (password resets go nowhere on `log`) |
| Google/Facebook `*_CLIENT_ID/SECRET` + `*_REDIRECT_URI` | Pointed at `https://<domain>/auth/{google,facebook}/callback` and `/meet/callback`; add them as authorized URIs in each provider console |

Then create your admin once: `railway run php artisan db:seed --class=AdminUserSeeder` (change the default password after first login).

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `419` on like/comment/post | Stale CSRF token (tab open across logout/login) | The app retries once automatically; otherwise refresh the page |
| Chat sends fail / bell never bumps | Reverb not running | Start it (`start-bizlink.ps1` does) and check `REVERB_APP_KEY/SECRET` match `.env` |
| Search feels basic | Meilisearch down | Expected — the app falls back to database search; restart Meilisearch on `:7700` |
| Google `403 access_denied` | App in Testing mode / email not a tester | Add the Gmail under Audience → Test users; rename the consent-screen **App name** (not the project or client name) to BizLink |
| New build not showing on phone | Mobile browser cache | Hard-refresh or open an incognito tab to compare |
| Locked out after bad logins | IP rate limit (`login_rate_limit`, default 5) | Wait a minute, or ask an admin to unlock you in `/admin/users` |
| `composer install` SSL/openssl errors | Wrong PHP first in PATH | `$env:PATH = "C:\xampp\php;" + $env:PATH`, then retry |
| Port already in use (`8000`/`5173`/`8080`) | Leftover dev processes | Stop old terminals, or change the port and matching `.env` URLs together |

---

## Security notes

- Uploads are **MIME-sniffed server-side** with an extension-from-MIME whitelist (SVG, executables, and office macros rejected); client-side size checks are UX only.
- Authenticated mutations are CSRF-protected (Inertia) or Sanctum-token authed (API); broadcast channels authorize participant-or-self only.
- Login is IP rate-limited and failure-counted per account; admins can lock/unlock in `/admin/users`. Suspended/banned accounts cannot log in or mutate.
- Social sign-in never accepts an admin role — new accounts get Entrepreneur or Brand only.
- Never commit `.env`, OAuth secrets, or service-account JSON. The repo ships `.env.example` with safe placeholders only.

---

## Contributing

- **Bugs and features:** [open an issue](https://github.com/NewToCodingExtra/BizLink/issues).
- Keep design tokens in `frontend/src/css/app.css` — never hardcode hex. Follow existing component patterns (flat cards, `border-border` + `shadow-sm`).
- Run `npm run lint` (frontend) and `php artisan test` (backend) before opening a PR.
- Branch naming: `feat/your-feature`, `fix/what-broke`. One concern per PR.

```powershell
git clone https://github.com/NewToCodingExtra/BizLink.git
cd BizLink
# backend in one terminal, frontend in another (see Getting started)
git checkout -b feat/your-feature
# ... work, then PR
```

---

## Team

Built for **CLSU — 3rd Year (Information Organization and Visual Presentation)**.
Collaborators: [@JP16D](https://github.com/JP16D) · [@Daion88](https://github.com/Daion88) · [@NewToCodingExtra](https://github.com/NewToCodingExtra)

---

## License

[MIT](LICENSE) — free to fork, learn, and extend.

<div align="center">

**If this helped you, give it a ⭐ — it helps reviewers find it.**

*Made with navy, gold, and restraint.*

</div>
