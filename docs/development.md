# BizLink Development Guide

> Local setup, commands, and the conventions every contributor follows. Production path: [Deployment](deployment.md).

## Setup

Prerequisites: PHP 8.2+ (XAMPP works), Composer, MySQL 8.0, Node 18+ / npm 10+. Optional: Meilisearch `:7700` (search falls back to the database without it), Google/Facebook OAuth apps.

```powershell
# 0) Isolated MySQL on :3307 (or run .\start-bizlink.ps1 from the repo root)
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --datadir=C:\temp\bizlink-mysql\data --port=3307 --mysqlx-port=33070 --bind-address=127.0.0.1 --server-id=99

# 1) Backend → http://localhost:8000
cd backend
copy .env.example .env
composer install
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve --host=127.0.0.1 --port=8000

# 2) Frontend (open :8000 in the browser, never :5173 directly)
cd frontend
npm install
npm run dev     # HMR via backend/public/hot
```

> [!TIP]
> One shot: `.\start-bizlink.ps1` from the repo root starts MySQL + Laravel + Reverb + Vite + Meilisearch together.

> [!IMPORTANT]
> Clone into a path **without spaces** when possible (e.g. `C:\projects\BizLink`). Spaced paths work but must be quoted in every PowerShell command.

Demo accounts (password `password123`): `demo@bizlink.ph` · `brand@bizlink.ph` · `admin@bizlink.ph`.

## Everyday commands

| Where | Command | Purpose |
|-------|---------|---------|
| `frontend/` | `npm run dev` | Vite HMR (Laravel serves the app) |
| `frontend/` | `npm run build` | Production assets → `backend/public/build` |
| `frontend/` | `npm run lint` | Oxlint |
| `backend/` | `php artisan test` | PHPUnit suite |
| `backend/` | `php artisan migrate` | Safe migrations (never `:fresh` outside dev) |
| `backend/` | `php artisan reverb:start` | Websocket server for live chat + bell |

## Conventions (enforced in review)

- **Design tokens only** — `frontend/src/css/app.css` variables; never hardcode hex. Navy = structure, Gold = status, Blue = click.
- **Dropdowns** render through the portal `DropdownMenu` (never bare `absolute` inside `overflow-hidden` cards) with 44px targets and outside-click/Escape close.
- **Author headers** use the shared `AuthorIdentity` cluster so every surface breaks identically on phones.
- **Comments** filter by post before render (`forPost`) — pooled props must never leak across posts.
- **Notifications** go through `NotificationService::push` (persist + broadcast in one call).
- **Enforcement** (warn/suspend/ban) lives in `EnforcementService`; admin actions notify both parties and write to the audit log.
- **Uploads** validate server-side (MIME-sniffed whitelist, per-type caps); client checks are UX only.

## Tests

`backend/tests/Feature`: `AdminAccessTest` (role gates), `AdminConsoleModulesTest` (reports/users/verifications/analytics/settings/exports), `OrphanProtectionTest` (no orphaned posts). Run `php artisan test` before every PR; add a case with every new gate or enforcement path.

## Branching & PRs

`feat/...`, `fix/...`, one concern per PR. Keep PRs small enough to review against the conventions above — see [README](https://github.com/NewToCodingExtra/BizLink/blob/main/README.md#contributing).
