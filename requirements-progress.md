# BizLink — Requirements Progress Tracker

> Source of truth: [`bizlink-requirements.md`](./bizlink-requirements.md)
> Plan / instructions: [`requirements-plan.md`](./requirements-plan.md)
> Status values: **done** · **in progress** · **not started** · **partial** (exists but does not match the assignment wording)
>
> Last assessed: 2026-09-28 against the live Laravel 12 + React 19 + Inertia codebase.

---

## Summary

| Area | Status | Notes |
|---|---|---|
| Activity 3 — Backend infrastructure | **partial** | Schema, models, validation exist. Missing resource CRUD (edit/update/destroy), modular route files, named routes. |
| Activity 4 — React + Inertia | **partial** | Stack works. Missing `@inertiaHead` and `resolvePageComponent`. |
| Activity 5 — Fortify + Spatie | **not started** | Custom session auth + a string `users.role` column. No Fortify, no Spatie. |
| Final project — product + security | **partial** | Domain app is far along. Assignment auth/RBAC and full resource CRUD are the blockers. |

**Do not redo** working product surfaces (feed, reels, stories, messenger, notifications, search). Close assignment gaps around them.

**Hard constraints** (also in `requirements-plan.md` §3): keep `frontend/` out of `resources/js`; keep Sanctum + Socialite; one URL per action (`/create` is the only create page — never also `/opportunities/create`); seed Spatie before `role:` middleware; one batch in progress at a time.

---

## Batch 0 — Already in place (do not rebuild)

| ID | Requirement | Status |
|---|---|---|
| 0.1 | `.env` database configured (MySQL `bizlink` on `:3307`) | done |
| 0.2 | ≥ 4 interconnected normalized tables (users, opportunities, comments, conversations, messages, stories, …) | done |
| 0.3 | Primary keys + timestamps on application tables | done |
| 0.4 | Child FKs use `cascadeOnDelete()` / `onDelete('cascade')` | done |
| 0.5 | All Eloquent models have `$fillable` | done |
| 0.6 | Explicit `hasMany` / `belongsTo` on core models | done |
| 0.7 | `$request->validate()` on store/update of existing mutations | done |
| 0.8 | `inertiajs/inertia-laravel` installed | done |
| 0.9 | `react`, `react-dom`, `@inertiajs/react`, `@vitejs/plugin-react` installed | done |
| 0.10 | `HandleInertiaRequests` registered in `bootstrap/app.php` | done |
| 0.11 | `vite.config.js` uses the React plugin | done |
| 0.12 | `createInertiaApp` in `frontend/src/app.jsx` | done |
| 0.13 | Page controllers return `Inertia::render(...)` | done |
| 0.14 | Reusable React components + responsive layout | done |
| 0.15 | Inertia `useForm` validation errors on Login / Register / Forgot / Reset / Create | done |
| 0.16 | CSRF meta token + session cookie mutations | done |
| 0.17 | Login, register, password reset **exist** as custom `SessionAuthController` + Inertia pages | done |
| 0.18 | `auth` middleware on `/create`, `/messages*`, `/saved`, etc. | done |

Owner FKs (`opportunities.user_id`, `stories.user_id`) use `restrictOnDelete()` on purpose (orphan protection). That is a documented deviation from the spec’s “every FK is cascade”. Do not flip them back to cascade.

---

## Batch 1 — Inertia assignment compliance

**Goal:** Match Activity 4 file/API wording without moving the `frontend/` app.

| ID | Task | Status |
|---|---|---|
| 1.1 | Add `@inertiaHead` to `backend/resources/views/app.blade.php` (keep `@viteReactRefresh`, `@vite`, `@inertia`) | not started |
| 1.2 | Switch `frontend/src/app.jsx` resolver to Laravel’s `resolvePageComponent` (keep the AppLayout default) | not started |
| 1.3 | Confirm pages still resolve (`Pages/` vs `pages/` case) after the helper change | not started |

---

## Batch 2 — Modular named routes

**Goal:** Activity 3 “dedicated files under `routes/` with names, prefixes, groups.”

| ID | Task | Status |
|---|---|---|
| 2.1 | Add `backend/routes/opportunities.php` (store/edit/update/destroy + like/save/hide only — no GET create) | not started |
| 2.2 | Add `backend/routes/comments.php` | not started |
| 2.3 | Add `backend/routes/conversations.php` (messages, polls, meet, inquiries) | not started |
| 2.4 | Require the new files from `web.php`; keep guest pages + Fortify later in `web.php` | not started |
| 2.5 | Named routes + prefixes + `middleware` groups; each name and path registered once (`/create` only, not `/opportunities/create`) | not started |
| 2.6 | Point frontend links/forms at existing paths (do not add Ziggy; do not invent a second create URL) | not started |

---

## Batch 3 — Resource controllers (full 7 CRUD)

**Goal:** At least the primary resource (`Opportunity`) exposes `index`, `create`, `store`, `show`, `edit`, `update`, `destroy`, each returning Inertia pages (mutations redirect). Validate every store/update.

| ID | Task | Status |
|---|---|---|
| 3.1 | Expand `OpportunityController` (or a dedicated Inertia resource controller) to all 7 actions | not started |
| 3.2 | `edit` + `update` Inertia page (`Pages/Opportunities/Edit`) — owner or Admin only | not started |
| 3.3 | `destroy` with confirmation — owner or Admin only | not started |
| 3.4 | Wire `index`/`show`/`create`/`store` to the existing feed/detail/create pages (do not duplicate UI) | not started |
| 3.5 | Server-side `$request->validate()` on `update` (parity with `store`) | not started |
| 3.6 | Optional: same 7-action pattern on `CommentController` if time (already has index/store/update/destroy) | not started |

---

## Batch 4 — Laravel Fortify (headless auth → Inertia)

**Goal:** Fortify owns registration, login, password reset. Views are the existing React pages. Socialite stays extra.

| ID | Task | Status |
|---|---|---|
| 4.1 | `composer require laravel/fortify` + publish config/migrations | not started |
| 4.2 | Register `FortifyServiceProvider`; `Fortify::loginView` / `registerView` / `requestPasswordResetLinkView` / `resetPasswordView` → `Inertia::render(...)` | not started |
| 4.3 | Disable Fortify’s Blade views; keep JSON API (`AuthController`) for the legacy token API | not started |
| 4.4 | Remove overlapping guest routes from `SessionAuthController` (login/register/forgot/reset POST+GET) | not started |
| 4.5 | Keep session regenerate, preference bootstrap, and intended redirect to `/feed` via Fortify `LoginResponse` / `RegisterResponse` | not started |
| 4.6 | Stop allowing `role: admin` on public register | not started |
| 4.7 | Smoke: register, login, logout, forgot, reset on Inertia pages with error bags | not started |

---

## Batch 5 — Spatie roles & permissions

**Goal:** Replace the string `users.role` as the **authorization** source. Keep the column only as a display hint until UI is switched, then stop using it for guards.

BizLink mapping (assignment names, our domain):

| Spatie role | BizLink meaning | Seeded demo |
|---|---|---|
| `Admin` | Platform operator | new `admin@bizlink.ph` |
| `Manager` | Brand owner (publish opportunities) | `brand@bizlink.ph` + brand accounts |
| `User` | Entrepreneur (discover / inquire) | `demo@bizlink.ph` |

| ID | Task | Status |
|---|---|---|
| 5.1 | `composer require spatie/laravel-permission` + publish + migrate | not started |
| 5.2 | `HasRoles` on `User` | not started |
| 5.3 | Register Spatie `role` / `permission` middleware aliases in `bootstrap/app.php` | not started |
| 5.4 | `RolesAndPermissionsSeeder`: roles Admin / Manager / User + granular permissions | not started |
| 5.5 | Call the seeder from `DatabaseSeeder`; assign roles to existing demo users | not started |
| 5.6 | Protect write routes: `auth` + `role:Admin\|Manager` for create/update/destroy opportunities; `role:Admin` for admin-only | not started |
| 5.7 | Share `roles` + `permissions` (and `can`) from `HandleInertiaRequests` | not started |

Granular permissions to seed:

- `opportunities.create` `opportunities.update` `opportunities.delete` `opportunities.verify`
- `comments.moderate`
- `users.manage`
- `inquiries.respond`

| Role | Permissions |
|---|---|
| Admin | all of the above |
| Manager | `opportunities.create/update/delete` (own rows in policies), `inquiries.respond` |
| User | none of the write-publish set (can still comment/save/inquire via `auth`) |

---

## Batch 6 — Conditional React UI by role

**Goal:** Rubric line “conditional React rendering based on roles.”

| ID | Task | Status |
|---|---|---|
| 6.1 | Helper `can(permission)` / `hasRole(role)` reading shared Inertia `auth` props | not started |
| 6.2 | Hide **Post / Create** for `User` role; show for `Manager` and `Admin` | not started |
| 6.3 | Show **Edit / Delete** on own posts for Manager; all posts for Admin | not started |
| 6.4 | Navbar / ProfileMenu entries gated the same way | not started |
| 6.5 | Register role picker: Entrepreneur → `User`, Brand → `Manager` (never Admin) | not started |

---

## Batch 7 — Security, quality, git

| ID | Task | Status |
|---|---|---|
| 7.1 | Confirm CSRF on every Fortify + resource mutation | not started |
| 7.2 | Policies (`OpportunityPolicy`) so Managers cannot edit others’ posts | not started |
| 7.3 | Zero browser console errors on login → feed → create → edit → delete | not started |
| 7.4 | `php artisan test` + existing `OrphanProtectionTest` still green | not started |
| 7.5 | Small, named commits per batch (graded) | not started |
| 7.6 | Do **not** move `frontend/` into `resources/js`; document the split in README | not started |

---

## Batch status rollup

| Batch | Title | Status |
|---|---|---|
| 0 | Already in place | done |
| 1 | Inertia assignment compliance | not started |
| 2 | Modular named routes | not started |
| 3 | Resource controllers (7 CRUD) | not started |
| 4 | Laravel Fortify | not started |
| 5 | Spatie RBAC | not started |
| 6 | Conditional React UI | not started |
| 7 | Security / quality / git | not started |

Update this file as each ID flips to **in progress** then **done**. Only one batch should be **in progress** at a time.
