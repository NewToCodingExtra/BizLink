<div align="center">

<img src="frontend/src/assets/hero.png" width="72" alt="BuseLink" />

# BuseLink
### Bridging Brands and Business Owners

**Philippines' verified franchise & wholesale matchmaking platform — curated, transparent, nationwide.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![React Router](https://img.shields.io/badge/Router-7-CA4245?style=flat-square&logo=reactrouter&logoColor=white)](https://reactrouter.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-C9A24B?style=flat-square)](#license)
[![Frontend Only](https://img.shields.io/badge/Frontend_Only-Static_Mock-0B1F3A?style=flat-square)](#)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-2563EB?style=flat-square)](#contributing)

[Live Demo](#quick-start) · [Features](#features) · [Design System](#design-system) · [Activity 4 Rubric](#activity-4--rubric-mapping)

</div>

---

## Why BuseLink?

> Most franchise discovery in PH happens on scattered Facebook pages and untrusted posters.  
> **BuseLink centralizes it** — a single trusted feed where brands publish opportunities and entrepreneurs discover, compare, and launch.

**Dual-role model:** Brands publish verified opportunities → Entrepreneurs discover, inquire, and open private consultation threads — all without a backend, fully static-mock but production-feeling.

```
Brand posts Franchise/Wholesale/Resell → Feed + Reels + Stories → Buyer likes/comments/inquires → Private consultation → Saved
```

---

## Preview

<p align="center">
  <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80&auto=format&fit=crop" width="100%" alt="BuseLink Hero" style="border-radius: 16px; border: 1px solid #E2E8F0;" />
</p>

| Feed | Reels | Inbox |
|------|-------|-------|
| Opportunity cards with type badges, ROI, capital | Vertical snap-scroll pitch videos | Private buyer↔seller threads separate from comments |
| FilterBar (All / Franchise / Wholesale / Resell / Following) | Tap to unmute, like/inquire overlays | Last-message preview + unread dot |

---

## Features

| Area | What ships | Detail |
|------|------------|--------|
| **Business Profile** | `BusinessOverview.jsx` on `/` hero | Tagline, dual-role explainer, search, “Explore Franchises” CTA, stats |
| **Mission & Vision** | `MissionVision.jsx` `/about` | Verbatim statements, clearly labeled |
| **Objectives** | `BusinessObjectives.jsx` `/about` | 3 numbered objectives, bento grid |
| **Products/Services** | `OpportunityFeed.jsx` + `OpportunityCard.jsx` | 8 mock opportunities, `.map()` with `key`, type badges: Franchise amber / Wholesale slate / Resell blue |
| **Why Choose Us** | `BusinessFeatures.jsx` `/about` | 4 cards: Verified Brands, Direct Matchmaking, Transparent ROI, Nationwide Reach |
| **Contact** | `ContactForm.jsx` `/contact` + modal | Also pre-filled from any **Inquire** button → creates consultation thread (simulated email toast) |
| **Feed Interactions** | Like, comment (Quora-style, Seller badge), save, inquire | All state in `App.jsx`, instant UI updates |
| **Stories** | `StoriesBar.jsx` → `/stories/:id` | Gradient ring if unseen, auto-advances 5s, filters expired |
| **Search** | `/search` | Debounced 300ms, filters brand/headline/desc/category |
| **Reels** | `/reels` | `snap-y` vertical, same `opportunities` source, video vs image |
| **Messenger** | `/messages` & `/messages/:id` | Inbox + thread, distinct from public comments |
| **Notifications** | Bell + `/notifications` | Simulated triggers, unread badge, mark-read |
| **Saved** | `/saved` | Bookmarks |
| **Profile / Preferences** | `/profile/:id`, `/settings/preferences` | Follow, category/budget auto-sort layer |

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

- **Framework:** React 19 + Vite 8
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`, no `tailwind.config.js`)
- **Routing:** React Router 7 (SPA, 13 routes)
- **State:** Top-level `useState` in `App.jsx` — no backend, all mock (`src/data/`)
- **Lint:** Oxlint
- **Icons:** Inline SVG + Unsplash/Pravatar placeholders

---

## Project Structure

```
BuseLink/
└── frontend/
    ├── src/
    │   ├── components/  Navbar, Footer, BusinessOverview, MissionVision,
    │   │                BusinessObjectives, BusinessFeatures, ContactForm,
    │   │                OpportunityFeed, OpportunityCard, FilterBar,
    │   │                CommentThread, StoriesBar, ReelCard, NotificationBell, SearchBar
    │   ├── pages/       HomeFeed, About, Reels, StoryViewer, Search,
    │   │                OpportunityDetail, CreateOpportunity, MessagesInbox,
    │   │                MessageThread, Notifications, Saved, Profile, Preferences, Contact
    │   ├── data/        opportunities.js, comments.js, stories.js, conversations.js
    │   ├── App.jsx      All state + routing + inquiry modal
    │   ├── main.jsx
    │   └── index.css    Design tokens + Tailwind import + Inter
    └── vite.config.js
```

**Activity 4 → Rubric Mapping**

| Rubric line | Component | Route | Verifiable? |
|-------------|-----------|-------|-------------|
| Company/Business Name | `Navbar.jsx` + `<title>` | Every page | Logo + browser tab |
| Business Profile | `BusinessOverview.jsx` | `/` hero | Tagline + dual-role + search |
| Mission & Vision | `MissionVision.jsx` | `/about` | Labeled verbatim |
| Business Objectives | `BusinessObjectives.jsx` | `/about` | 3 numbered cards |
| Products/Services | `OpportunityFeed` `.map()` | `/` feed | 8 cards with keys |
| Features / Why Choose Us | `BusinessFeatures.jsx` | `/about` | 4 benefit cards |
| Contact | `ContactForm.jsx` | `/contact` + modal | Standalone + pre-filled |
| Footer | `Footer.jsx` | Every page | Links + social + email |

---

## Quick Start

**Prereqs:** Node 18+ / npm 10+ (tested Node 24)

```powershell
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # production → frontend/dist
npm run preview  # preview build
npm run lint     # oxlint
```

No `.env`, no backend, no database. Fully static.

**Deploy to GitHub Pages / Vercel:** `npm run build` → upload `frontend/dist` (Vite SPA, `history` fallback needed for nested routes).

---

## How It Works (No Backend)

- **Posting:** `/create` type (Franchise/Wholesale/Resell) + headline + capital + ROI + description (280 char) + media URL (object URL mocked) → `setOpportunities(prev => [newPost, ...prev])` prepends, flagged `isNew: true` (<24h).
- **Filtering:** `FilterBar` chips (`activeFilter` useState) is the guaranteed visible interaction; `userPreferences` scoring is layered as bonus auto-sort.
- **Inquiry:** Any `Inquire` opens modal → on submit creates/updates `conversations` + `messages` + simulated `notifications` toast.

---

## Roadmap

- [ ] Persist to `localStorage`
- [ ] GitHub Pages auto-deploy workflow
- [ ] Light/dark theme token
- [ ] `vitest` + Testing Library for feed interactions

---

## Contributing

PRs welcome — keep design tokens in `index.css`, never hardcode hex. Follow existing component patterns (flat cards, `border-slate-100` + `shadow-sm`).

```powershell
git clone https://github.com/NewToCodingExtra/BuseLink.git
cd BuseLink/frontend
npm install
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
