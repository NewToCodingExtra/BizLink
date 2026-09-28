# BizLink — Plan to Close Missing Assignment Requirements

> Tracker: [`requirements-progress.md`](./requirements-progress.md)
> Spec: [`bizlink-requirements.md`](./bizlink-requirements.md)
>
> This file is the execution plan. Do the batches in order. After each batch, mark IDs in the tracker **done** and commit.

---

## 1. What the project already is

BizLink is the 1st-term franchise/wholesale matchmaking site, already converted to:

- Laravel 12 backend (`backend/`)
- React 19 + Inertia (`frontend/`)
- MySQL, Sanctum (legacy JSON API), Socialite, Reverb

That satisfies the **domain** part of the final project. The assignment still requires a specific **teaching stack**: Fortify, Spatie, resource controllers with 7 CRUD actions, modular named route files, and two Inertia boilerplate details.

**Constraint:** keep the product (feed, reels, chat, stories, search). Do not rewrite the UI. Insert the missing Laravel teaching pieces underneath.

---

## 2. Gap list (why each batch exists)

| Spec item | Current code | Gap |
|---|---|---|
| Fortify registration / login / password reset | Custom `SessionAuthController` | Package not installed; instructor will look for Fortify |
| Spatie `HasRoles` + `role:` middleware | `users.role` string (`entrepreneur` / `brand` / `admin`) | Not Spatie; no permission tables; no `role:` middleware |
| `RolesAndPermissionsSeeder` | `DatabaseSeeder` only | Missing seeder + Admin/Manager/User |
| Share roles/permissions to React | `HandleInertiaRequests` shares `role` string only | No `roles[]` / `permissions[]` |
| Conditional UI by role | Register picker + profile badge | Create/edit/delete not gated |
| Resource controller 7 actions | `OpportunityController`: index/show/store only | No edit/update/destroy |
| Modular `routes/*.php` | Almost everything in `web.php` | Only `login` is named |
| `@inertiaHead` | Missing in `app.blade.php` | Add the directive |
| `resolvePageComponent` | Custom `import.meta.glob` resolver | Switch to Laravel helper |

Out of scope (already done, do not “fix”):

- ≥ 4 tables, `$fillable`, relationships, `$request->validate()` on existing writes
- Inertia + Vite + React packages
- CSRF, session auth pages, reusable components, validation error display
- Owner FKs that use `restrictOnDelete()` (orphan protection) — leave them

---

## 3. Decisions (locked)

Hard constraints. An implementing agent must not violate these.

1. **Domain stays BizLink.** Tables stay `users`, `opportunities`, `comments`, `conversations`, etc. Do not invent `product_categories`.
2. **Spatie role names** follow the spec: `Admin`, `Manager`, `User`.
   - `User` = entrepreneur
   - `Manager` = brand owner
   - `Admin` = platform operator
3. **Keep** Socialite, Sanctum JSON API (`routes/api.php`, `AuthController`), and Reverb. Fortify only replaces the **session** login/register/reset pipeline. Do not delete those stacks.
4. **Keep** `frontend/` as the Vite app. Do not relocate it to `resources/js`.
5. **Primary resource** for the 7 CRUD actions is **Opportunity**. Comments already have store/update/destroy.
6. Public register may choose Entrepreneur (`User`) or Brand (`Manager`). Never `Admin`.
7. Git: one commit per finished batch. Message prefix `feat(req):`.
8. **One URL per action.** Do not register the same path or the same route name twice. Canonical browser URLs:
   - list = `/feed` (`feed`)
   - show = `/post/{slug}` (`opportunities.show`)
   - create = `/create` (`opportunities.create`) — **not** `/opportunities/create`
   - store = `POST /opportunities` (`opportunities.store`)
   - edit = `/opportunities/{opportunity}/edit` (`opportunities.edit`)
   - update = `PUT /opportunities/{opportunity}` (`opportunities.update`)
   - destroy = `DELETE /opportunities/{opportunity}` (`opportunities.destroy`)
9. **Spatie before `role:` middleware.** Seed roles/permissions and assign them to demo users before wrapping any route in `role:...`. Until Batch 5, authorize with owner-id checks only.
10. **One batch at a time.** Mark the batch **in progress** in `requirements-progress.md`, finish it, mark **done**, commit, then start the next. Do not start Batch N+1 while N is open. Do not expand into product refactors.

---

## 4. Execution order

```
Batch 1 (Inertia boilerplate)
  → Batch 2 (modular routes)
    → Batch 3 (Opportunity CRUD)
      → Batch 4 (Fortify)
        → Batch 5 (Spatie)
          → Batch 6 (React gates)
            → Batch 7 (verify + commits already made per batch)
```

Batches 4 and 5 can overlap in one sitting (Fortify views + Spatie seed) but **do not** protect routes with `role:` until Spatie is seeded.

---

## 5. Batch instructions

### Batch 1 — Inertia assignment compliance

**Files**

- `backend/resources/views/app.blade.php`
- `frontend/src/app.jsx`

**1.1 Blade**

Insert `@inertiaHead` in `<head>` after `@vite(...)`. Final head must contain, in this order:

```blade
@viteReactRefresh
@vite(['src/app.jsx'])
@inertiaHead
```

Keep the existing CSRF meta and `<title inertia>`. Body stays `@inertia`.

**1.2 Resolver**

Replace the hand-rolled glob lookup with:

```js
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

createInertiaApp({
  resolve: (name) =>
    resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')).then((page) => {
      page.default.layout ??= (pageEl) => <AppLayout>{pageEl}</AppLayout>;
      return page;
    }),
  // setup / title / progress unchanged
});
```

If macOS/Linux is case-sensitive and folders are `pages/` not `Pages/`, either:

- rename `frontend/src/pages` → `Pages` (preferred; matches the spec), **or**
- pass `./pages/${name}.jsx` into the helper.

Do not drop the ThemeProvider / ToastProvider wrapper.

**Verify:** `npm run dev`, open `/`, `/login`, `/feed`. No “Inertia page not found”.

**Commit:** `feat(req): add inertiaHead and resolvePageComponent`

---

### Batch 2 — Modular named routes

**New files** (require from `bootstrap/app.php` **or** from `web.php` — Laravel 12 `withRouting` only auto-loads `web.php` / `api.php`. Simplest: `require` at the bottom of `web.php`):

```php
require __DIR__.'/opportunities.php';
require __DIR__.'/comments.php';
require __DIR__.'/conversations.php';
```

**Canonical URLs (do not add a second create/show/list path):**

```php
// Pretty URLs — the only list/show/create routes
Route::get('/feed', [PageController::class, 'feed'])->name('feed');
Route::get('/post/{slug}', [PageController::class, 'post'])->name('opportunities.show');
Route::get('/create', [PageController::class, 'create'])->name('opportunities.create')->middleware('auth');

// REST-shaped mutations + edit only (no GET /opportunities/create)
Route::middleware('auth')->prefix('opportunities')->name('opportunities.')->group(function () {
    Route::post('/', [PageController::class, 'storeOpportunity'])->name('store');
    Route::get('/{opportunity}/edit', [OpportunityController::class, 'edit'])->name('edit');
    Route::put('/{opportunity}', [OpportunityController::class, 'update'])->name('update');
    Route::delete('/{opportunity}', [OpportunityController::class, 'destroy'])->name('destroy');
    Route::post('/{opportunity}/like', [OpportunityController::class, 'toggleLike'])->name('like');
    Route::post('/{opportunity}/save', [OpportunityController::class, 'toggleSave'])->name('save');
    Route::post('/{opportunity}/hide', [OpportunityController::class, 'hide'])->name('hide');
});
```

Forbidden: `GET /opportunities/create`, a second `opportunities.create`, a second `opportunities.show`, or moving `/create` while leaving the old path registered. `php artisan route:list` must show each of those names once.

**`comments.php` / `conversations.php`:** move the matching blocks out of `web.php`. Give every route a `->name()`.

**Frontend:** Inertia `post('/opportunities')` can stay as a path, or switch to `route()` if Ziggy is added. **Do not add Ziggy unless a form breaks.** Paths may remain; names are for the PHP side and the rubric.

**Verify:** `php artisan route:list` shows named groups. Click feed, create, like, comment, inquire.

**Commit:** `feat(req): split web routes into named modular files`

---

### Batch 3 — Opportunity resource CRUD

**Add to `OpportunityController` (or extract `App\Http\Controllers\OpportunityPageController` if the JSON API methods get noisy):**

| Action | Behavior |
|---|---|
| `index` | Already JSON. Leave API. Browser list stays `PageController::feed`. |
| `create` | Already `PageController::create` → `CreateOpportunity`. Keep. |
| `store` | Already `PageController::storeOpportunity`. Keep. |
| `show` | Already `PageController::post`. Keep. |
| `edit` | `Inertia::render('Opportunities/Edit', ['opportunity' => ...])`. Authorize owner or Admin. |
| `update` | `$request->validate([...same as store...])`, save, redirect to `/post/{slug}` with flash. |
| `destroy` | Delete (RESTRICT means comments/likes must cascade from the opportunity side — they already do). Redirect `/feed`. |

**New page:** `frontend/src/pages/Opportunities/Edit.jsx`  
Copy field layout from `CreateOpportunity.jsx`. Prefill from props. `useForm` + `put`/`delete`. Show `errors.*`.

**Authorize now with a temporary check** (`$request->user()->id === $opportunity->user_id || $request->user()->role === 'admin'`). Replace with Spatie + Policy in Batches 5–6.

**Navbar / card:** “Edit” on own posts only (string role until Batch 6).

**Verify:** brand demo user can edit and delete own post; entrepreneur cannot open `/opportunities/{id}/edit` (403).

**Commit:** `feat(req): add opportunity edit, update, and destroy`

---

### Batch 4 — Fortify

```bash
cd backend
composer require laravel/fortify
php artisan vendor:publish --provider="Laravel\Fortify\FortifyServiceProvider"
php artisan migrate
```

**Provider** `app/Providers/FortifyServiceProvider.php` (create if the publish did not):

```php
Fortify::loginView(fn () => Inertia::render('Login'));
Fortify::registerView(fn () => Inertia::render('Register'));
Fortify::requestPasswordResetLinkView(fn () => Inertia::render('ForgotPassword'));
Fortify::resetPasswordView(fn ($request) => Inertia::render('ResetPassword', [
    'email' => $request->email,
    'token' => $request->route('token'),
]));
```

Register the provider in `bootstrap/providers.php`.

**Config `config/fortify.php`:**

- `views` => true (needed for the Closures above)
- Features: `registration`, `resetPasswords`. Do **not** enable 2FA/email verification unless you also build those Inertia pages.
- Home path: `/feed`

**Custom responses** so login still regenerates session, writes `last_activity_at`, and `Preference::firstOrCreate`:

- Implement `LoginResponse` / `RegisterResponse` (or `Fortify::authenticateUsing` + `Event::listen` on `Illuminate\Auth\Events\Login` / `Registered`).
- Register: map form `role` entrepreneur → Spatie comes in Batch 5; until then still write `users.role`. **Reject `admin`.**

**Remove from `web.php`** the guest `SessionAuthController` GET/POST for login, register, forgot, reset. Keep `POST /logout` **or** switch to Fortify’s logout. Keep Socialite routes.

**Do not delete** `AuthController` (token API) or `PasswordResetController` used by `/api/auth/*`.

**Frontend forms:** Fortify expects

- login: `POST /login` email + password
- register: `POST /register` name, email, password, password_confirmation
- forgot: `POST /forgot-password` email
- reset: `POST /reset-password` token, email, password, password_confirmation
- logout: `POST /logout`

Existing Inertia `useForm().post(...)` paths already match. Confirm `_token` / XSRF still sent (`utils/http.js` + Inertia default).

**Verify:** register → `/feed`; logout; login; forgot-password (log mailer); reset.

**Commit:** `feat(req): replace session auth with Laravel Fortify`

---

### Batch 5 — Spatie RBAC

```bash
composer require spatie/laravel-permission
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
php artisan migrate
```

**User model:** `use HasRoles;`

**`bootstrap/app.php`:**

```php
$middleware->alias([
    'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
    'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
    'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
]);
```

**New** `database/seeders/RolesAndPermissionsSeeder.php`:

```php
$permissions = [
    'opportunities.create',
    'opportunities.update',
    'opportunities.delete',
    'opportunities.verify',
    'comments.moderate',
    'users.manage',
    'inquiries.respond',
];
foreach ($permissions as $p) {
    Permission::firstOrCreate(['name' => $p]);
}

Role::firstOrCreate(['name' => 'Admin'])->syncPermissions($permissions);
Role::firstOrCreate(['name' => 'Manager'])->syncPermissions([
    'opportunities.create', 'opportunities.update', 'opportunities.delete', 'inquiries.respond',
]);
Role::firstOrCreate(['name' => 'User'])->syncPermissions([]);
```

**`DatabaseSeeder`:** `$this->call(RolesAndPermissionsSeeder::class);` then:

- `demo@bizlink.ph` → `User`
- `brand@bizlink.ph` and every brand account → `Manager`
- create `admin@bizlink.ph` / `password123` → `Admin`

Keep writing `users.role` as `entrepreneur` / `brand` / `admin` during this batch so old UI does not blank; Batch 6 stops relying on it.

**Route guards** (after seeder exists):

```php
Route::middleware(['auth', 'role:Admin|Manager'])->group(function () {
    // create / store / edit / update / destroy opportunities
});
```

Comment/like/save/inquire stay `auth` only.

**`HandleInertiaRequests::share`:**

```php
'auth' => [
    'user' => $user?->only([...]),
    'roles' => $user?->getRoleNames() ?? [],
    'permissions' => $user?->getAllPermissions()->pluck('name') ?? [],
],
```

**Policy** `app/Policies/OpportunityPolicy.php`:

- `create`: permission `opportunities.create`
- `update`/`delete`: Admin **or** (Manager **and** owner)

Register via `Gate::policy` or Laravel auto-discovery. Use `$this->authorize()` in edit/update/destroy.

**Fortify register:** after `User::create`, `$user->assignRole($formRole === 'brand' ? 'Manager' : 'User');`

**Verify:** `php artisan db:seed --class=RolesAndPermissionsSeeder` (idempotent). Entrepreneur hitting `/create` → 403. Brand → 200. Admin can edit any post.

**Commit:** `feat(req): add Spatie roles, permissions seeder, and route guards`

---

### Batch 6 — Conditional React UI

**Helper** `frontend/src/utils/can.js`:

```js
export function hasRole(page, role) {
  return page.props.auth?.roles?.includes(role);
}
export function can(page, permission) {
  return page.props.auth?.permissions?.includes(permission);
}
```

Use `usePage()` at call sites.

| UI | Rule |
|---|---|
| Navbar “Post” / `/create` | `can('opportunities.create')` |
| Card overflow Edit | `can('opportunities.update')` and (owner or Admin) |
| Card overflow Delete | `can('opportunities.delete')` and (owner or Admin) |
| Register buttons | Entrepreneur / Brand only |
| Profile “Brand” badge | `hasRole('Manager')` or `hasRole('Admin')` |

Pass `auth.user.id` vs `opportunity.user_id` for ownership. Share `opportunity.user_id` in the resource if missing.

**Verify:** three seeded accounts, three different navbars. No console errors when a User loads `/feed`.

**Commit:** `feat(req): gate create/edit/delete UI by Spatie permissions`

---

### Batch 7 — Security, tests, docs

1. CSRF: Fortify + Inertia forms + `utils/http.js` JSON mutations. No new fetch without `X-XSRF-TOKEN` / `X-CSRF-TOKEN`.
2. Run `cd backend && php artisan test`.
3. Manual browser pass (zero console errors):
   - guest `/` `/about` `/contact` `/login`
   - User: feed, inquire, comment, saved — no Post
   - Manager: create, edit own, cannot edit others
   - Admin: edit/delete any
   - forgot/reset password
4. README Auth section: Fortify + Spatie; demo `admin@bizlink.ph`; note `frontend/` stays a sibling of `backend/`.
5. Flip tracker IDs to **done**.

**Commit:** `docs(req): document Fortify, Spatie, and demo admin account`

---

## 6. Suggested commit sequence (graded history)

1. `feat(req): add inertiaHead and resolvePageComponent`
2. `feat(req): split web routes into named modular files`
3. `feat(req): add opportunity edit, update, and destroy`
4. `feat(req): replace session auth with Laravel Fortify`
5. `feat(req): add Spatie roles, permissions seeder, and route guards`
6. `feat(req): gate create/edit/delete UI by Spatie permissions`
7. `docs(req): document Fortify, Spatie, and demo admin account`

Do not squash. Do not mix product refactors into these commits.

---

## 7. Explicit non-goals

- Moving Vite into `backend/resources/js`
- Replacing Sanctum token API or Socialite
- Registering duplicate paths or names (`/create` **and** `/opportunities/create`)
- Putting `role:` middleware on routes before `RolesAndPermissionsSeeder` has run
- Starting the next batch before the current one is **done** and committed
- Changing owner FKs from `restrictOnDelete` to cascade
- Building a separate Admin Blade dashboard
- Location tagging, vitest, GitHub Actions (README roadmap — not this assignment)

---

## 8. Definition of done

The assignment checklist in `bizlink-requirements.md` §9 can be ticked, **except** we document:

- Vite/React lives in `frontend/` (still `@vitejs/plugin-react` + `createInertiaApp` + `resolvePageComponent`)
- Opportunity is the resource with 7 CRUD actions; other domains keep their existing controllers
- `restrictOnDelete` on post/story owners is intentional

`requirements-progress.md` Batch 1–7 all **done**.
