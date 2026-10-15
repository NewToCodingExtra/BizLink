# BizLink Deployment Guide

> Railway-first runbook. `Dockerfile` + `railway.json` + `docker/` in the repo root do the heavy lifting: one service runs web (Apache), queue worker, Reverb websockets, and the scheduler under Supervisor.

## How it fits together

- **Web** — Apache serves Laravel on Railway's `$PORT` (templated at boot).
- **Realtime** — Reverb runs inside the container on `127.0.0.1:8080`; browsers reach it as `wss://<your-domain>/app/<key>` through an Apache websocket proxy. No second service needed.
- **Background** — `queue:work` (database driver) and `schedule:work` run beside the web process.
- **Boot** — every start runs `storage:link`, `migrate --force` (never fresh), roles reseed, and config/route/view caches. Healthcheck: `/up`.

## Deploy steps

1. Push to GitHub. Railway → **New → GitHub Repository** (not Docker Image) → pick the repo. It auto-detects the `Dockerfile`.
2. **Add a MySQL plugin** (New → Database → MySQL).
3. **Volumes** — mount one at `/var/www/html/backend/storage` (uploads + logs survive restarts).
4. **Networking** — Generate domain.
5. Fill **Variables** (table below), then Deploy.
6. Create your admin once: run `php artisan db:seed --class=AdminUserSeeder` via `railway run` (or the Railway shell), sign in, and change the default password immediately.

## Variables

| Variable | Value on Railway |
|----------|------------------|
| `APP_URL` | `https://<service>.up.railway.app` |
| `APP_ENV` / `APP_DEBUG` / `DEMO_LOGIN` | `production` / `false` / `false` |
| `APP_KEY` | `base64:…` — generate once, keep stable (sessions and cookies depend on it) |
| `DB_HOST` / `DB_PORT` / `DB_DATABASE` / `DB_USERNAME` / `DB_PASSWORD` | From the MySQL plugin (`MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER`, `MYSQLPASSWORD`) |
| `SESSION_DOMAIN` | empty (host-only cookie) or your custom domain |
| `SESSION_SECURE_COOKIE` | `true` |
| `LOG_CHANNEL` | `stderr` (shows in Railway logs) |
| `SCOUT_DRIVER` | `database` — or add a Meilisearch service and point `MEILISEARCH_HOST` at it |
| `REVERB_APP_KEY` / `REVERB_APP_SECRET` | any random hex (browser also needs matching `VITE_REVERB_APP_KEY`; host/port auto-derive) |
| `MAIL_*` | Real SMTP — password resets go nowhere on `log` |
| Google / Facebook `*_CLIENT_ID`, `*_CLIENT_SECRET`, `*_REDIRECT_URI` | Pointed at `https://<domain>/auth/{google,facebook}/callback` and `/meet/callback`; register the same URIs in each provider console |

## After launch

- Google/Facebook apps stay in **Testing** mode until verified — only listed test emails can use social login. Finish verification for public access.
- Backups: use **Admin → Settings → Backups** (local snapshots + external bucket) and keep an off-site copy of the volume.
- Watch: failed jobs (Admin → Settings → status), queue depth, and storage use in the first week.
- Never run `migrate:fresh` outside local dev. Never commit `.env`.

## Alternative: plain VPS or shared hosting

Any PHP 8.2 + MySQL host works if you provide what Railway automates: a web server pointing at `backend/public`, long-running `reverb:start` + `queue:work` + scheduler, persistent `storage/`, and `migrate --force` on deploy. Pure-serverless hosts (Vercel-style) do **not** fit: PHP runtime, websockets, and local disk are all required.
