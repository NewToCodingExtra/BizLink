<div align="center">

<img src="frontend/src/assets/bizlink-wordmark.svg" width="220" alt="BizLink" />

# BizLink
### Bridging Brands and Business Owners

**The Philippines' verified franchise and wholesale matchmaking platform — curated opportunities, direct inquiries, nationwide reach.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-bizlink--production--e3ee.up.railway.app-0B1F3A?style=for-the-badge&logo=railway&logoColor=white)](https://bizlink-production-e3ee.up.railway.app/)

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Inertia](https://img.shields.io/badge/Inertia-React-9553E9?style=flat-square)](https://inertiajs.com)
[![Laravel](https://img.shields.io/badge/Laravel-12-FF2D20?style=flat-square&logo=laravel&logoColor=white)](https://laravel.com)
[![Fortify](https://img.shields.io/badge/Auth-Laravel%20Fortify-FF2D20?style=flat-square)](https://laravel.com/docs/fortify)
[![Spatie Permission](https://img.shields.io/badge/RBAC-Spatie%20Permission-18B69B?style=flat-square)](https://spatie.be/docs/laravel-permission)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com)
[![Reverb](https://img.shields.io/badge/Reverb-WebSockets-0B1F3A?style=flat-square)](https://laravel.com/docs/reverb)
[![License: MIT](https://img.shields.io/badge/License-MIT-C9A24B?style=flat-square)](#license)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-2563EB?style=flat-square)](#contributing)

---

### 🌐 Live Production Deployment
**Experience the live application:** [https://bizlink-production-e3ee.up.railway.app/](https://bizlink-production-e3ee.up.railway.app/)

*Hosted on Railway with automated container builds, MySQL persistence, and Laravel Reverb WebSockets.*

---

</div>

## Contents

- [Why BizLink?](#why-bizlink)
- [Preview](#preview)
- [Getting the code](#getting-the-code)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Authentication & RBAC Architecture](#authentication--rbac-architecture)
  - [Laravel Fortify (Authentication)](#1-laravel-fortify-headless-authentication)
  - [Spatie Laravel-Permission (RBAC)](#2-spatie-laravel-permission-role-based-access-control)
  - [Permissions Matrix](#3-permissions-matrix)
  - [Policy-Level Ownership Checks](#4-policy-level-ownership-checks)
  - [Security & Moderation Enforcement](#5-security--moderation-enforcement)
- [Features](#features)
- [Admin console](#admin-console)
- [Design system](#design-system)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [API endpoints](#api-endpoints)
- [Configuration](#configuration)
- [Build, test, and deploy](#build-test-and-deploy)
- [Troubleshooting](#troubleshooting)
- [Security notes](#security-notes)
- [Contributing](#contributing)
- [Team](#team)
- [License](#license)

---

## Why BizLink?

> Most franchise and wholesale discovery in the Philippines happens across fragmented Facebook groups, unverified chat threads, and untrusted flyers.
> **BizLink centralizes it** — one verified, curated feed where brands publish business opportunities and entrepreneurs discover, evaluate, and connect directly.

**Dual-Role Model:**
- **Brands** publish verified opportunities (Franchise, Wholesale, Distribution, Resell), showcase pitch reels, answer inquiries, and schedule Google Meet consultations.
- **Entrepreneurs** discover tailored opportunities via custom budget/category preferences, save shortlists, participate in community discussions, and chat directly with brand representatives.

```
Brand publishes Opportunity / Reel / Story → Discovery Feed → Entrepreneur reviews ROI & Capital → Private Inquiry & Thread → Google Meet Consultation
```

- **Guest Landing:** Visitors arriving at `/` see the full business overview, mission/vision, objectives, and feature highlights with demo login shortcuts. Authenticated users are directed straight to the active `/feed` or `/admin` console.
- **Supported Platforms:** Windows (XAMPP / native), macOS, Linux, and Docker/Railway containers.

---

## Preview

<p align="center">
  <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80&auto=format&fit=crop" width="100%" alt="BizLink marketplace preview" style="border-radius: 16px; border: 1px solid #E2E8F0;" />
</p>

| Opportunity Feed | Pitch Reels | Real-Time Messenger |
|---|---|---|
| Rich cards with business type badges, verified checkmarks, ROI & capital chips, bookmarking, and inquiry triggers. | Vertical snap-scroll pitch videos with smart brightest-frame thumbnails, autoplay, and audio toggles. | Live WebSocket chat with quote cards, interactive polls, attachments, and Google Meet scheduling. |

---

## Getting the code

Clone the official repository:

```bash
git clone https://github.com/NewToCodingExtra/BizLink.git
cd BizLink
```

> [!IMPORTANT]
> **Path Gotcha:** Clone into a directory path **without spaces** (e.g., `C:\projects\BizLink` or `~/projects/BizLink`). Spaces in parent directory paths (such as `...\3RD YEAR\...`) can cause path-quoting issues in PowerShell, npm script runners, and native binary builds.

### Repository Branches
- `main` / `master`: Stable production releases deployed to Railway.
- `untested`: Active integration and staging branch.

---

## Prerequisites

Ensure all runtime tools are installed and verified before starting:

| Tool | Minimum Version | Why it Matters | Link |
|------|-----------------|----------------|------|
| [PHP](https://www.php.net/downloads) | **8.2+** | Backend runtime required by Laravel 11/12; includes typed properties and performance improvements. | [php.net](https://www.php.net/downloads) |
| [Composer](https://getcomposer.org/) | **2.x** | PHP dependency manager for Laravel, Fortify, and Spatie packages. | [getcomposer.org](https://getcomposer.org/) |
| [Node.js](https://nodejs.org/) | **18+** (20+ recommended) | JavaScript runtime required for Vite 7 and React 19 builds. | [nodejs.org](https://nodejs.org/) |
| [npm](https://docs.npmjs.com/) | **10+** | Package manager for frontend dependencies. | [nodejs.org](https://nodejs.org/) |
| [MySQL](https://www.mysql.com/) | **8.0+** | Relational database for relational data, full-text indexing, and audit logging. | [mysql.com](https://www.mysql.com/) |

### Optional Integrations
- **Google Cloud OAuth 2.0:** Enables Google Sign-In and automated Google Calendar / Meet link generation.
- **Facebook Login:** Enables Facebook OAuth authentication.
- **Meilisearch:** High-performance typo-tolerant search engine (app gracefully falls back to SQL `LIKE` queries if unavailable).

Verify your local environment:

```bash
php --version      # Must report 8.2 or higher
composer --version # Must report 2.x
node --version     # Must report v18.0.0 or higher
npm --version      # Must report 10.x or higher
```

> [!TIP]
> On Windows with XAMPP, ensure XAMPP's PHP is prioritized in your system PATH so that the `openssl`, `pdo_mysql`, and `mbstring` extensions are active:
> ```powershell
> $env:PATH = "C:\xampp\php;" + $env:PATH
> ```

---

## Getting started

### 1) Database Setup

Ensure a MySQL instance is running. Create the dedicated database and user:

```sql
CREATE DATABASE bizlink CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bizlink'@'127.0.0.1' IDENTIFIED BY 'Bizlink123!';
GRANT ALL ON bizlink.* TO 'bizlink'@'127.0.0.1';
FLUSH PRIVILEGES;
```

### 2) Backend Setup (`http://localhost:8000`)

```powershell
cd backend
copy .env.example .env

# Install backend dependencies
composer install

# Generate application encryption key
php artisan key:generate

# Run database migrations and seed default roles, permissions, and demo content
php artisan migrate:fresh --seed

# Start the Laravel development server
php artisan serve --host=127.0.0.1 --port=8000
```

### 3) Frontend Setup (Vite HMR)

Open a second terminal:

```powershell
cd frontend
npm install

# Start Vite in development mode (hot reloading through Laravel)
npm run dev
```

> [!NOTE]
> Always access the application through the Laravel server URL (**`http://localhost:8000`**), not Vite's `:5173`. Vite serves the compiled assets directly to the Inertia Blade root view.

### 4) Real-Time WebSockets (Laravel Reverb)

Open a third terminal to run the WebSocket server for real-time messages and notifications:

```powershell
cd backend
php artisan reverb:start --port=8080
```

*(Alternatively, run `.\start-bizlink.ps1` from the repo root on Windows to initialize MySQL, Laravel, Reverb, Vite, and Meilisearch in unified background processes).*

---

### Demo Accounts

The database seeder (`DatabaseSeeder` + `RolesAndPermissionsSeeder`) creates three ready-to-test accounts:

| Role | Email | Password | Primary Capabilities |
|------|-------|----------|----------------------|
| **Admin** | `admin@bizlink.ph` | `password123` | Full access to `/admin`, moderation queues, user bans, brand verification reviews, and system settings. |
| **Brand Owner** (`Manager`) | `brand@bizlink.ph` | `password123` | Publish business opportunities, post pitch reels/stories, answer buyer inquiries, schedule consultations. |
| **Entrepreneur** (`User`) | `demo@bizlink.ph` | `password123` | Browse feeds, submit inquiries, chat in real-time, save opportunities, configure personalized feed preferences. |

---

## Authentication & RBAC Architecture

BizLink utilizes an enterprise-grade security and access control architecture pairing **Laravel Fortify** (headless authentication) with **Spatie Laravel-Permission** (granular Role-Based Access Control).

```
                      ┌────────────────────────────────────────┐
                      │            User Requests               │
                      └──────────────────┬─────────────────────┘
                                         │
                         [CheckSuspension Middleware]
                                         │ (Passes if active)
                                         ▼
                   ┌─────────────────────────────────────────────┐
                   │        Laravel Fortify / Session Auth       │
                   │  - Registration & Login                     │
                   │  - IP Rate Limiting (5 req/min)             │
                   │  - FortifyLoginResponse (Role Redirect)     │
                   └─────────────────────┬───────────────────────┘
                                         │
                                         ▼
            ┌────────────────────────────────────────────────────────┐
            │         Spatie Laravel-Permission (RBAC)               │
            │   Roles: Admin  |  Manager (Brand)  |  User (Client)   │
            └──────────────┬──────────────────────────┬──────────────┘
                           │                          │
        Admin Routes (role:Admin)             Content Routes (can:...)
                           │                          │
                           ▼                          ▼
               ┌──────────────────────┐   ┌──────────────────────┐
               │    /admin Console    │   │  OpportunityPolicy   │
               │  - User discipline   │   │  - Spatie permission │
               │  - Report queue      │   │  - Ownership check   │
               │  - Verifications     │   │    (user_id === post)│
               └──────────────────────┘   └──────────────────────┘
```

---

### 1. Laravel Fortify (Headless Authentication)

[Laravel Fortify](https://laravel.com/docs/fortify) handles all authentication logic without tying the backend to Blade templates:
- **Service Provider:** Configured in [`FortifyServiceProvider.php`](file:///backend/app/Providers/FortifyServiceProvider.php).
- **Inertia View Binding:** Fortify's authentication views (`loginView`, `registerView`, `requestPasswordResetLinkView`, `resetPasswordView`) render customized React components via Inertia (`Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`).
- **Registration Flow ([`CreateNewUser.php`](file:///backend/app/Actions/Fortify/CreateNewUser.php)):**
  - Accepts `name`, `email`, `password`, and optional `role` (`brand` or `entrepreneur`).
  - Creates the `User` record with hashed credentials.
  - Automatically assigns the corresponding Spatie role:
    ```php
    $user->assignRole(($input['role'] ?? 'entrepreneur') === 'brand' ? 'Manager' : 'User');
    ```
- **Contextual Post-Login Redirect ([`FortifyLoginResponse.php`](file:///backend/app/Http/Responses/FortifyLoginResponse.php)):**
  - Admins are redirected directly to the administrative dashboard (`/admin`).
  - Brand managers and regular entrepreneurs are routed to the main feed (`/feed`).
- **Brute Force Defense:** Rate-limited to **5 attempts per minute** keyed by lowercase username and client IP.
- **Social OAuth Integration:** Google and Facebook logins (via Laravel Socialite) integrate with the [`EnsureRoleSelected.php`](file:///backend/app/Http/Middleware/EnsureRoleSelected.php) middleware. First-time social sign-ups are routed to `/welcome/role` to select their platform role before accessing the feed.

---

### 2. Spatie Laravel-Permission (Role-Based Access Control)

Granular authorization is implemented with [`spatie/laravel-permission`](https://spatie.be/docs/laravel-permission).
The [`User`](file:///backend/app/Models/User.php) model implements the `HasRoles` trait:

```php
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, HasRoles;
    // ...
}
```

The system defines three core roles seeded by [`RolesAndPermissionsSeeder.php`](file:///backend/database/seeders/RolesAndPermissionsSeeder.php):

1. **`Admin`**: Platform operator possessing global moderation and administrative authority.
2. **`Manager` (Brand Owner)**: Merchant or franchisor listing opportunities and answering buyer inquiries.
3. **`User` (Entrepreneur / Client)**: Investor or buyer discovering ventures and negotiating deals.

---

### 3. Permissions Matrix

| Permission String | Description | `Admin` | `Manager` (Brand) | `User` (Entrepreneur) |
|-------------------|-------------|:-------:|:-----------------:|:--------------------:|
| `opportunities.create` | Publish new opportunity listings, reels, and stories | ✅ | ✅ | ✅ |
| `opportunities.update` | Edit opportunity details and media | ✅ | ✅ (Own items) | ✅ (Own items) |
| `opportunities.delete` | Delete opportunity listings | ✅ | ✅ (Own items) | ✅ (Own items) |
| `opportunities.verify` | Approve/revoke official brand verification status | ✅ | ❌ | ❌ |
| `comments.moderate` | Remove abusive comments across any post | ✅ | ❌ | ❌ |
| `users.manage` | Warn, suspend, ban, unlock, or reassign user roles | ✅ | ❌ | ❌ |
| `inquiries.respond` | Access consultation inboxes and reply to direct messages | ✅ | ✅ | ✅ |

---

### 4. Policy-Level Ownership Checks

While Spatie permissions define what a role is capable of doing globally, resource ownership is strictly enforced by Laravel Policies.

In [`OpportunityPolicy.php`](file:///backend/app/Policies/OpportunityPolicy.php):
```php
public function update(User $user, Opportunity $opportunity): bool
{
    // Admins can update any opportunity; creators can only update their own
    return $user->hasRole('Admin') || 
           ($user->can('opportunities.update') && $user->id === $opportunity->user_id);
}

public function delete(User $user, Opportunity $opportunity): bool
{
    // Admins can delete any opportunity; creators can only delete their own
    return $user->hasRole('Admin') || 
           ($user->can('opportunities.delete') && $user->id === $opportunity->user_id);
}
```

This prevents IDOR (Insecure Direct Object Reference) vulnerabilities while allowing admins to perform moderation without duplicating controllers.

---

### 5. Security & Moderation Enforcement

- **Route Guarding:** Administrative routes in [`routes/admin.php`](file:///backend/routes/admin.php) are strictly encapsulated:
  ```php
  Route::middleware(['auth', 'role:Admin', 'suspension'])->prefix('admin')->group(...);
  ```
- **Suspension Middleware ([`CheckSuspension.php`](file:///backend/app/Http/Middleware/CheckSuspension.php)):**
  - Intercepts mutating HTTP verbs (`POST`, `PUT`, `PATCH`, `DELETE`).
  - If a user has an active ban or timed suspension, the request is terminated with a `403 Forbidden` response (or redirect with warning message).
  - Filing reports (`/report`) remains accessible so suspended accounts can appeal.
- **Anti-Orphan Data Integrity:** The `User` model's `deleting` lifecycle hook prevents deleting accounts that still own active opportunities or stories without prior moderation or content transfer.

---

## Features

| Feature | Description | Technical Implementation |
|---------|-------------|--------------------------|
| **Curated Opportunity Feed** | Infinite-scroll feed with type filters (Franchise, Wholesale, Distribution, Resell), investment ranges, and ROI metrics. | `OpportunityFeed.jsx`, `OpportunityController.php`, scored feed ranking. |
| **Pitch Reels** | Vertical snap-scroll reel player for quick video pitches with auto-extracted video thumbnail posters. | `Reels.jsx`, `SmartMedia.jsx`, HTML5 canvas frame extraction. |
| **Daily Stories Rail** | 24-hour visual opportunity highlights with seen-state tracking and gradient indicator rings. | `StoriesBar.jsx`, `StoryViewer.jsx`, `Story.php`. |
| **Real-Time Messenger** | Buyer-seller conversation threads featuring quote cards, live polls, file sharing, and Google Meet scheduling. | `ConversationController.php`, `MessageSent.php` broadcast, Laravel Reverb. |
| **Google Meet Scheduling** | Schedule consultations directly in the chat with automatic OAuth token refresh and meeting link generation. | `MeetController.php`, `MeetService.php`, Google Calendar API v3. |
| **Unified Moderation Queue** | 9-category reporting system with severity weights, audit logs, reporter alerts, and automated user strikes. | `ReportAdminController.php`, `EnforcementService.php`. |
| **Brand Verification** | Document review workflow granting the prestigious `✓ Verified` badge to authenticated brand representatives. | `VerificationAdminController.php`, `VerificationRequest.php`. |
| **Export Engine** | Download filtered audit logs, user lists, and moderation reports in styled Excel (`.xlsx`) or CSV formats. | `ExportController.php`, FastExcel / OpenSpout. |

---

## Admin console

Accessible exclusively to users with the **`Admin`** role at `/admin`:

- **Dashboard Overview:** High-level metrics on active users, listed opportunities, monthly inquiries, and pending moderation tickets.
- **Moderation Queue (`/admin/reports`):** Review user-flagged posts, reels, comments, and direct messages. Actions include dismiss, issue formal warning, temporary suspension, or permanent ban.
- **User Directory (`/admin/users`):** Inspect account details, strike counts, manage role promotions, manual password resets, and lockout overrides.
- **Brand Verifications (`/admin/verifications`):** Review government registrations and business permits to issue or revoke brand trust badges.
- **Platform Analytics (`/admin/analytics`):** Interactive Recharts visualizing user acquisition, engagement velocity, and report resolution turnaround.
- **System Settings (`/admin/settings`):** Configure login throttle thresholds, demo login toggles, registration flags, and storage quota meters.

---

## Design system

BizLink enforces a clean, corporate financial aesthetic using strict CSS design tokens:

| Token | Hex / Value | Semantic Purpose |
|-------|-------------|------------------|
| `--color-primary` | `#0B1F3A` Deep Navy | Structural elements, navbars, major headings, trust. |
| `--color-accent` | `#C9A24B` Gold | Verification checkmarks, featured badges. Never used on action buttons. |
| `--color-action` | `#2563EB` Royal Blue | High-intent interaction targets: Inquire, Post, Submit. |
| `--color-bg` | `#F8FAFC` Off-White | Canvas and backdrop. |
| `--color-surface` | `#FFFFFF` Pure White | Elevated card containers, modals, and drop-downs. |
| `--color-border` | `#E2E8F0` Border Gray | Hairline dividers and bounding boxes. |

---

## Tech stack

- **Frontend:** React 19, Vite 7, Tailwind CSS v4, Inertia.js (React adapter), Lucide Icons, Recharts.
- **Backend:** Laravel 12, Laravel Fortify (authentication), Spatie Laravel-Permission (RBAC), Laravel Socialite (OAuth), Laravel Reverb (WebSockets).
- **Database & Storage:** MySQL 8.0, Google Cloud Storage (or local disk fallback).
- **Tooling & Quality:** PHPUnit, Oxlint.

---

## Project structure

```
BizLink/
├── backend/                           # Laravel Application
│   ├── app/
│   │   ├── Actions/Fortify/           # Fortify user creation & password reset actions
│   │   ├── Http/Controllers/          # Web, API, and Admin Controllers
│   │   ├── Http/Middleware/           # Role verification, suspension checks, Inertia
│   │   ├── Http/Responses/            # Custom Fortify login & registration responses
│   │   ├── Models/                    # Eloquent models (User, Opportunity, Story...)
│   │   ├── Policies/                  # Authorization policies (OpportunityPolicy...)
│   │   └── Services/                  # Business logic (Enforcement, Meet, Reports...)
│   ├── config/                        # Laravel configuration (fortify.php, reverb.php...)
│   ├── database/                      # Migrations, factories, and seeders
│   ├── routes/                        # web.php, api.php, admin.php, channels.php
│   └── tests/                         # PHPUnit feature and unit tests
├── frontend/                          # React + Vite Application
│   ├── src/
│   │   ├── Components/                # Modular UI elements (Feed, Navbar, Modals...)
│   │   ├── Pages/                     # Inertia page views (Feed, Reels, Admin...)
│   │   ├── utils/                     # HTTP client (CSRF + Session), WebSocket echo
│   │   └── css/                       # Design tokens and Tailwind stylesheet
│   └── vite.config.js                 # Vite asset compiler configuration
├── docker/                            # Docker & Supervisor configuration for Railway
├── Dockerfile                         # Production container build
└── railway.json                       # Railway platform deployment configuration
```

---

## API endpoints

| Method | Endpoint | Protection | Description |
|--------|----------|------------|-------------|
| `GET` | `/api/health` | Public | Platform health and liveness probe |
| `POST` | `/api/auth/login` | Fortify Rate-Limit | Authenticate user session |
| `POST` | `/api/auth/register` | Public | Create new account with role assignment |
| `POST` | `/api/auth/logout` | `auth` | Terminate session and revoke tokens |
| `GET` | `/api/opportunities` | Public | Browse opportunity feed with filters |
| `POST` | `/api/opportunities` | `auth`, `can:opportunities.create` | Publish a new opportunity |
| `GET` | `/api/opportunities/{id}` | Public | Detailed opportunity view |
| `POST` | `/api/opportunities/{id}/like` | `auth` | Toggle opportunity favorite/like |
| `POST` | `/api/opportunities/{id}/save` | `auth` | Bookmark opportunity to saved list |
| `POST` | `/api/inquiries/resolve` | `auth` | Start or retrieve conversation thread for an opportunity |
| `POST` | `/api/conversations/{id}/messages` | `auth` | Send chat message with real-time broadcast |
| `POST` | `/api/conversations/{id}/meet` | `auth` | Generate and schedule Google Meet consultation |
| `POST` | `/api/reports` | `auth` | File a moderation ticket for any post, reel, or user |
| `GET` | `/admin/users` | `auth`, `role:Admin` | User management directory |
| `POST` | `/admin/users/{id}/suspend` | `auth`, `role:Admin` | Issue timed account suspension |
| `POST` | `/admin/verifications/{id}/approve` | `auth`, `role:Admin` | Grant brand verification badge |

---

## Configuration

All primary local variables reside in `backend/.env`:

| Key | Development Default | Production / Railway | Purpose |
|-----|---------------------|----------------------|---------|
| `APP_URL` | `http://localhost:8000` | `https://bizlink-production-e3ee.up.railway.app` | Canonical app URL |
| `APP_ENV` | `local` | `production` | Environment mode |
| `APP_DEBUG` | `true` | `false` | Disable stack traces in production |
| `DB_CONNECTION` | `mysql` | `mysql` | Primary database driver |
| `DB_HOST` | `127.0.0.1` | Assigned by Railway | MySQL hostname |
| `DB_PORT` | `3306` (or `3307`) | `3306` | MySQL port |
| `SESSION_DRIVER` | `database` | `database` | Distributed session persistence |
| `REVERB_APP_KEY` | *(Local string)* | *(Secure key)* | Reverb WebSocket authentication |
| `GOOGLE_CLIENT_ID` | Optional | OAuth Client ID | Google Sign-In & Meet API |
| `DEMO_LOGIN` | `true` | `false` | Disable instant demo credentials on public apps |

---

## Build, test, and deploy

### Running Tests & Linters
```powershell
# Frontend linting
cd frontend
npm run lint

# Backend test suite
cd ../backend
php artisan test
```

### Production Build
```powershell
cd frontend
npm run build   # Compiles frontend assets into backend/public/build
```

### Production Deployment (Railway)
BizLink is packaged with an optimized multi-stage `Dockerfile` and `railway.json`:
1. Connect your GitHub repository to [Railway](https://railway.app/).
2. Attach a Railway **MySQL** database service.
3. Configure environment variables (`APP_KEY`, `APP_URL`, `DB_*`, `REVERB_*`).
4. Railway automatically builds the container, executes production optimizations (`php artisan config:cache`, `php artisan route:cache`, `php artisan view:cache`), runs non-destructive migrations (`php artisan migrate --force`), and boots Supervisor to run Apache, the queue worker, and the Reverb WebSocket daemon.

---

## Troubleshooting

| Issue | Root Cause | Solution |
|-------|------------|----------|
| **`419 Page Expired`** | Stale CSRF token after idle session or server restart. | Refresh the page; the Axios client will automatically fetch a fresh CSRF cookie. |
| **WebSocket connection failed** | Laravel Reverb daemon is not running or port `:8080` is blocked. | Run `php artisan reverb:start` locally or check Railway web proxy settings for `/app`. |
| **`403 Forbidden` on update** | Attempting to edit another user's post without `Admin` role. | Verify logged-in account ownership. Only the creator or an Admin can modify posts. |
| **Google Meet 422 Error** | OAuth tokens expired or invalid time format. | Disconnect and reconnect Google Calendar via `/meet/connect` to renew tokens. |
| **Images not loading** | Storage symlink missing in local environment. | Run `php artisan storage:link` inside the `backend` folder. |

---

## Security notes

- **Authentication Integrity:** Passwords hashed with `bcrypt` (work factor 12).
- **CSRF Defense:** All state-changing web mutations require valid CSRF tokens verified via Laravel middleware.
- **Upload Hardening:** Uploaded files undergo server-side MIME sniffing. Executable scripts, SVGs, and unsafe extensions are rejected.
- **Rate Limiting:** Protects login endpoints from brute-force attempts and limits conversational polling.

---

## Contributing

1. Fork or clone the repository:
   ```bash
   git clone https://github.com/NewToCodingExtra/BizLink.git
   ```
2. Create a feature branch:
   ```bash
   git checkout -b feat/your-feature
   ```
3. Commit your changes with concise, descriptive messages.
4. Run `npm run lint` and `php artisan test` before opening a pull request against `untested`.

---

## Team

Developed for **Central Luzon State University (CLSU)** — 3rd Year Information Organization and Visual Presentation.

- **Collaborators:** [@JP16D](https://github.com/JP16D) · [@Daion88](https://github.com/Daion88) · [@NewToCodingExtra](https://github.com/NewToCodingExtra)

---

## License

This project is licensed under the **[MIT License](LICENSE)**.
