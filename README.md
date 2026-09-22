<div align="center">

<img src="frontend/src/assets/bizlink-wordmark.svg" width="220" alt="BizLink" />

# BizLink
### Bridging Brands and Business Owners

**Philippines' verified franchise & wholesale matchmaking platform — curated, transparent, nationwide.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![React Router](https://img.shields.io/badge/Router-7-CA4245?style=flat-square&logo=reactrouter&logoColor=white)](https://reactrouter.com)
[![Laravel](https://img.shields.io/badge/Laravel-12-FF2D20?style=flat-square&logo=laravel&logoColor=white)](https://laravel.com)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com)
[![Sanctum](https://img.shields.io/badge/Sanctum-Token_Auth-0B1F3A?style=flat-square)](#auth)
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
| Opportunity cards with type badges, ROI, capital | Vertical snap-scroll pitch videos | Private buyer↔seller threads separate from comments |
| FilterBar (All / Franchise / Wholesale / Resell / Following) | Tap to unmute, like/inquire overlays | Last-message preview + unread dot |

---

## Features

| Area | What ships | Detail |
|------|------------|--------|
| **Business Profile** | `BusinessOverview.jsx` on `/` landing | Tagline, dual-role explainer, search, “Explore Franchises” CTA, stats |
| **Mission & Vision** | `MissionVision.jsx` `/about` | Verbatim statements, clearly labeled |
| **Objectives** | `BusinessObjectives.jsx` `/about` | 3 numbered objectives, bento grid |
| **Products/Services** | `OpportunityFeed.jsx` + `OpportunityCard.jsx` | Live from `GET /api/opportunities`, `.map()` with `key`, type badges: Franchise amber / Wholesale slate / Resell blue |
| **Why Choose Us** | `BusinessFeatures.jsx` `/` + `/about` | 4 cards: Verified Brands, Direct Matchmaking, Transparent ROI, Nationwide Reach |
| **Contact** | `ContactForm.jsx` `/contact` + modal | Standalone `POST /api/contact` + pre-filled **Inquire** modal → `POST /api/inquiries` opens a consultation thread |
| **Feed Interactions** | Like, comment (Seller badge), save, inquire | `POST /opportunities/:id/like|save`, `POST /opportunities/:id/comments` — persisted in MySQL |
| **Stories** | `StoriesBar.jsx` → `/stories/:id` | `GET /api/stories`, gradient ring if unseen, auto-advances, `POST /stories/:id/seen` |
| **Search** | `/search` | Debounced 300ms, server-side `?q=` on brand/headline/desc/category |
| **Reels** | `/reels` | `snap-y` vertical, video opportunities from the same API source |
| **Messenger** | `/messages` & `/messages/:id` | `GET /api/conversations`, `POST /api/conversations/:id/messages` |
| **Notifications** | Bell + `/notifications` | `GET /api/notifications` with unread badge, mark-read + mark-all-read |
| **Saved** | `/saved` | `GET /api/saved` bookmarks |
| **Profile / Preferences** | `/profile/:id`, `/settings/preferences` | `POST /api/follows/toggle`, `GET+PUT /api/preferences` with category/budget auto-sort |
| **Auth** | `/login`, `/register`, `/auth/google/callback` | Sanctum tokens, session-aware navbar, protected `/create`, `/messages`, `/saved` |

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

- **Frontend:** React 19 + Vite 8 + Tailwind CSS v4 + React Router 7 (20 routes)
- **Backend:** Laravel 12 + Sanctum (token auth) + Socialite (Google OAuth)
- **Database:** MySQL 8.0 (`bizlink` on `127.0.0.1:3307`), seeded from the old frontend mocks
- **State:** Per-page API fetching via `src/api/client.js` + `AuthContext` — no more lifted mock seeds
- **Lint:** Oxlint
- **Icons:** Inline SVG + Unsplash/Pravatar placeholders

---

## Project Structure

```
BizLink/
├── backend/
│   ├── app/
│   │   ├── Http/Controllers/  Auth, GoogleAuth, Opportunity, Comment, Story,
│   │   │                       Conversation, Notification, Preference, Follow, Contact
│   │   └── Models/            User, Opportunity, Comment, Story, Conversation,
│   │                           Message, AppNotification, Preference
│   ├── database/
│   │   ├── migrations/        users, opportunities, comments, stories,
│   │   │                       conversations, messages, notifications, likes/saves/follows/preferences
│   │   └── seeders/           DatabaseSeeder (8 opps, 5 comments, 5 stories, inbox + notes)
│   ├── routes/api.php         auth, opportunities, stories, inbox, notifications, preferences, follows, contact
│   ├── config/cors.php        allows http://localhost:5173 with credentials
│   └── .env.example           MySQL 3307 + Google OAuth placeholders
├── frontend/
│   ├── src/
│   │   ├── api/           client.js (Bearer tokens, VITE_API_URL)
│   │   ├── context/       AuthContext.jsx (login/register/logout/Google)
│   │   ├── components/    Navbar, Footer, BusinessOverview, MissionVision,
│   │   │                  BusinessObjectives, BusinessFeatures, ContactForm,
│   │   │                  OpportunityFeed, OpportunityCard, FilterBar,
│   │   │                  CommentThread, StoriesBar, ReelCard, NotificationBell,
│   │   │                  SearchBar, RequireAuth
│   │   ├── pages/         Landing, Login, Register, GoogleCallback, HomeFeed, About,
│   │   │                  Reels, StoryViewer, Search, OpportunityDetail, CreateOpportunity,
│   │   │                  MessagesInbox, MessageThread, Notifications, Saved,
│   │   │                  Profile, Preferences, Contact
│   │   ├── App.jsx        AuthProvider + routing (guest landing vs feed)
│   │   ├── main.jsx
│   │   └── index.css      Design tokens + Tailwind import + Inter
│   ├── .env.example       VITE_API_URL=http://localhost:8000/api
│   └── vite.config.js     /api proxy to :8000
└── start-bizlink.ps1     starts MySQL:3307 + API:8000
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
copy .env.example .env   # set DB_* and APP_KEY
C:\xampp\php\php.exe C:\Users\Joshua\.config\herd\bin\composer.phar install
C:\xampp\php\php.exe artisan key:generate
C:\xampp\php\php.exe artisan migrate:fresh --seed
C:\xampp\php\php.exe artisan serve --host=127.0.0.1 --port=8000
```

Or one shot: `.\start-bizlink.ps1` from the repo root.

**2) Frontend (`http://localhost:5173`):**

```powershell
cd frontend
copy .env.example .env   # VITE_API_URL=http://localhost:8000/api
npm install
npm run dev      # http://localhost:5173
npm run build    # production → frontend/dist
npm run lint     # oxlint
```

**Demo accounts (seeded):**

| Role | Email | Password |
|------|-------|----------|
| Entrepreneur | `demo@bizlink.ph` | `password123` |
| Brand owner | `brand@bizlink.ph` | `password123` |

---

## Auth

- Email: `POST /api/auth/register`, `POST /api/auth/login` → Sanctum Bearer token stored in `localStorage`, `GET /api/auth/me`, `POST /api/auth/logout` revokes the current token.
- Google: `GET /api/auth/google/redirect` → `GET /api/auth/google/callback` → redirects to `/auth/google/callback?token=...` which the frontend exchanges via `/auth/me`. Requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback` in `backend/.env` (get credentials at Google Cloud Console → APIs & Services → Credentials).
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
| GET | `/api/auth/google/redirect` | – | Google OAuth (503 if unconfigured) |
| GET | `/api/auth/google/callback` | – | Google callback → frontend token |
| GET | `/api/opportunities` | – | List with `?type=&q=&category=&page=&per_page=` |
| POST | `/api/opportunities` | token | Publish opportunity |
| GET | `/api/opportunities/:id` | – | Detail with comments |
| POST | `/api/opportunities/:id/like` | token | Toggle like |
| POST | `/api/opportunities/:id/save` | token | Toggle save |
| GET | `/api/saved` | token | Saved list |
| GET/POST | `/api/opportunities/:id/comments` | GET –, POST token | List / add comment |
| GET/POST | `/api/stories`, `/api/stories/:id/seen` | GET –, POST token | List / mark seen |
| GET | `/api/conversations`, `/api/conversations/:id` | token | Inbox + thread |
| POST | `/api/inquiries` | token | Inquire → conversation + notification |
| POST | `/api/conversations/:id/messages` | token | Send message |
| GET/POST | `/api/notifications`, `/api/notifications/:id/read`, `/api/notifications/read-all` | token | List / mark read |
| GET/PUT | `/api/preferences` | token | Get / save categories + budget |
| GET/POST | `/api/follows`, `/api/follows/toggle` | token | List / follow brand |
| POST | `/api/contact` | – | Contact form (logged, notification if authed) |

---

## How It Works (With Backend)

- **Posting:** `/create` → `POST /api/opportunities` (type, headline, capital, ROI, category, description, image/video) → row in MySQL with `is_new: true`, plus a `new_post` notification.
- **Filtering:** `FilterBar` chips filter client-side; `preferences.categories` fetched from `GET /api/preferences` layers an auto-sort bonus on top.
- **Inquiry:** Any `Inquire` → modal → `POST /api/inquiries { opportunity_id, message }` → creates/finds the brand conversation, appends a `me` message and an `inquiry` notification.
- **Seeding:** `backend/database/seeders/DatabaseSeeder.php` ports the old `src/data/*.js` mocks (BrewCraft, Glow Skin, FitForge, ParcelGo, TastyBox, EduSpark, UrbanThread, AquaPure + comments/stories/inbox) into MySQL.

---

## Roadmap

- [x] Laravel backend + MySQL + Sanctum + Google OAuth
- [x] Guest landing vs authenticated feed split
- [ ] `vitest` + Testing Library for feed interactions
- [ ] GitHub Actions: backend `php artisan test` + frontend build
- [ ] Light/dark theme token
- [ ] Image uploads (S3/local disk) replacing URL-only media

---

## Contributing

PRs welcome — keep design tokens in `index.css`, never hardcode hex. Follow existing component patterns (flat cards, `border-slate-100` + `shadow-sm`). Use XAMPP PHP first in `PATH` when running Composer (`$env:PATH = "C:\xampp\php;" + $env:PATH`) so `openssl` is available.

```powershell
git clone https://github.com/NewToCodingExtra/BuseLink.git
cd BuseLink
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
