# FinalTermLaravel — Project Requirements (for AI Coding Assistant)

> Source: INTECH 3112 – Web Applications Development II, 1st Semester A.Y. 2026-2027, Final Term Project.
> Purpose: This file is the single source of truth for what the project must contain. Read it fully before writing any code. Every item marked `[REQUIRED]` comes directly from the assignment and must be implemented.

---

## 0. Instructions for the AI

- Build a **production-grade** Laravel + React + Inertia.js application named **FinalTermLaravel**.
- Convert our **1st-term project** (the existing website) into this Laravel application. Keep its domain/features, but re-implement them using the stack below. Suitable domains per the assignment: Multi-Role Inventory Management, E-Commerce, or Learning Portals.
- Follow Laravel's philosophy: **clean, expressive syntax**, organized file structure, proper naming conventions.
- Do not skip any `[REQUIRED]` item. When something is ambiguous, ask before assuming.
- Keep Git commits small, frequent, and meaningfully named (clean commit history is graded).

---

## 1. Overview

The project synthesizes:

| Activity | Topic |
|---|---|
| Activity 3 | Laravel MVC Foundation (backend infrastructure) |
| Activity 4 | Modern Frontend Integration (React + Inertia.js) |
| Activity 5 | Headless Auth & Access Control (Fortify + Spatie) |
| Final Project | Production-ready full-stack application combining all of the above |

The app moves from traditional server-side rendering (Blade) to a **modern decoupled architecture**: a Laravel backend serving a dynamic, component-based **React** frontend through **Inertia.js**.

## 2. Objectives

1. **MVC Architecture** — organized structure separating business logic, data persistence, and user presentation.
2. **Component-Based UI** — reusable React components using JSX and the Virtual DOM for efficient rendering.
3. **Advanced Logic & Security** — middleware, Eloquent ORM relationships, authentication, and Role-Based Access Control (RBAC).
4. **Rapid & Elegant Development** — Laravel's clean, expressive syntax to build scalable APIs and interactive interfaces.

## 3. Tech Stack (mandatory)

- **Backend:** Laravel (PHP), Eloquent ORM, Laravel Fortify, `spatie/laravel-permission`
- **Frontend:** React, React DOM, Inertia.js (`@inertiajs/react`), Vite (`@vitejs/plugin-react`)
- **Database:** Relational (configured via `.env`)
- **Version control:** Git

---

## 4. Activity 3 — Backend Infrastructure

### 4.1 Database Connection & Migrations `[REQUIRED]`
- Configure database credentials in `.env`.
- Create **normalized** migration tables (examples from the spec: `product_categories`, `products`).
- Each table must have: **primary keys**, **foreign key constraints using `cascadeOnDelete()`**, and **timestamp fields**.

### 4.2 Eloquent Models & Relationships `[REQUIRED]`
- Define mass-assignment protection with **`$fillable`** arrays on **all** models.
- Declare explicit relationship methods such as **`hasMany`** and **`belongsTo`**.

### 4.3 Resource Controllers `[REQUIRED]`
- Generate RESTful resource controllers with the standard CRUD actions: `index`, `create`, `store`, `show`, `edit`, `update`, `destroy`.
- Use **strict server-side input validation** via `$request->validate()`.

### 4.4 Modular Routing `[REQUIRED]`
- Organize routes into **dedicated files under `routes/`** (e.g., `product-categories.php`, `products.php`).
- Use **named routes**, **prefixes**, and **route groups**.

---

## 5. Activity 4 — Modern Frontend Integration (React & Inertia.js)

### 5.1 Inertia & Package Setup `[REQUIRED]`
- Backend adapter: `composer require inertiajs/inertia-laravel`
- Frontend packages: `react`, `react-dom`, `@inertiajs/react`, `@vitejs/plugin-react`

### 5.2 Middleware & Root Blade `[REQUIRED]`
- Publish and register the **`HandleInertiaRequests`** middleware in `bootstrap/app.php`.
- Create `resources/views/app.blade.php` containing:
  - `@viteReactRefresh`
  - `@vite(...)`
  - `@inertiaHead`
  - `@inertia`

### 5.3 Vite & Entry Point `[REQUIRED]`
- Configure `vite.config.js` with the React plugin.
- Set up `resources/js/app.jsx` using **`createInertiaApp`** and **`resolvePageComponent`**.

### 5.4 Controller Rendering `[REQUIRED]`
- Refactor resource controllers to return React page components via **`Inertia::render('PageName', $data)`**.

---

## 6. Activity 5 — Headless Auth & Access Control (Fortify & Spatie)

### 6.1 Laravel Fortify Authentication `[REQUIRED]`
- Install Fortify for headless authentication: **registration, login, password reset**.
- Direct authentication endpoints to render **custom React Inertia views** (not Blade).

### 6.2 Spatie Roles & Permissions `[REQUIRED]`
- Install `spatie/laravel-permission`.
- Run the migrations for roles, permissions, and pivot tables.
- Attach the **`HasRoles`** trait to the `User` model.

### 6.3 Database Seeding `[REQUIRED]`
- Create a **`RolesAndPermissionsSeeder`**.
- Seed default roles (e.g., **Admin, Manager, User**) and assign **granular permissions** to each.

### 6.4 Authorization Guards `[REQUIRED]`
- Protect backend routes with Laravel middleware (e.g., `auth`, `role:Admin`).
- **Conditionally render React UI elements** based on the authenticated user's role (share roles/permissions via `HandleInertiaRequests`).

---

## 7. Final Project — Production-Ready Full-Stack Web Application

**Goal:** Synthesize everything from Activities 3–5 into a fully functional, production-ready app in a domain such as Multi-Role Inventory Management, E-Commerce, or Learning Portals. **Use our 1st-term project and convert it into a Laravel application.**

### Core Requirements `[REQUIRED]`
1. **Normalized relational database** with a **minimum of 4 interconnected tables**, plus migrations, seeders, and mass-assignment protection.
2. **Complete user authentication pipeline** powered by **Fortify**, and **role-restricted capabilities** powered by **Spatie RBAC**.
3. **Interactive, responsive React single-page frontend** using Inertia.js, with **real-time validation error feedback**.
4. **Strict security standards:**
   - CSRF token defense
   - **100% server-side validation**
   - Clean Git commit history
   - **Zero console errors**

---

## 8. Grading Rubric (what the instructor scores)

| Category | Weight | What is evaluated | Excellent | Good | Poor |
|---|---|---|---|---|---|
| Architecture | 30% | Correct MVC flow; proper migration usage; Eloquent ORM implementation | 30 | 20 | 10 |
| Frontend & Integration | 30% | Blade → React conversion; efficient JSX and Virtual DOM use; Inertia.js connectivity | 30 | 20 | 10 |
| Security & Permissions | 25% | Correct Spatie RBAC; `@csrf` protection; conditional React rendering based on roles | 25 | 15 | 5 |
| Code Quality | 15% | Clean, expressive syntax; organized file structure; proper naming conventions | 15 | 10 | 5 |
| **Maximum Score** | | | **100** | **65** | **30** |

Target the **Excellent** column in every category.

---

## 9. Implementation Checklist

### Backend (Activity 3)
- [ ] `.env` database configured
- [ ] Migrations for ≥ 4 interconnected, normalized tables
- [ ] Primary keys, foreign keys with `cascadeOnDelete()`, timestamps on every table
- [ ] All models have `$fillable`
- [ ] `hasMany` / `belongsTo` relationships defined explicitly
- [ ] Resource controllers with all 7 CRUD actions
- [ ] `$request->validate()` on every store/update
- [ ] Modular route files in `routes/` with names, prefixes, groups

### Frontend (Activity 4)
- [ ] `inertiajs/inertia-laravel` installed
- [ ] `react`, `react-dom`, `@inertiajs/react`, `@vitejs/plugin-react` installed
- [ ] `HandleInertiaRequests` published and registered in `bootstrap/app.php`
- [ ] `resources/views/app.blade.php` with `@viteReactRefresh`, `@vite(...)`, `@inertiaHead`, `@inertia`
- [ ] `vite.config.js` uses the React plugin
- [ ] `resources/js/app.jsx` uses `createInertiaApp` + `resolvePageComponent`
- [ ] Controllers return `Inertia::render('PageName', $data)`
- [ ] Reusable React components; responsive layout
- [ ] Real-time validation error display in forms

### Auth & RBAC (Activity 5)
- [ ] Fortify installed: registration, login, password reset
- [ ] Fortify views point to React Inertia pages
- [ ] `spatie/laravel-permission` installed and migrated
- [ ] `HasRoles` on `User`
- [ ] `RolesAndPermissionsSeeder` seeds Admin, Manager, User + granular permissions
- [ ] Routes protected with `auth` and `role:...` middleware
- [ ] React UI conditionally rendered by role/permission

### Security & Quality (Final Project)
- [ ] CSRF protection active on all state-changing requests
- [ ] 100% server-side validation
- [ ] Zero browser console errors
- [ ] Clean, incremental Git commit history
- [ ] Clean, expressive code; organized folders; consistent naming

---

## 10. Suggested File Structure (guideline)

```
app/
  Http/
    Controllers/        # Resource controllers returning Inertia::render()
    Middleware/
      HandleInertiaRequests.php
  Models/               # $fillable + explicit relationships; User uses HasRoles
  Providers/
    FortifyServiceProvider.php
bootstrap/
  app.php               # registers HandleInertiaRequests
database/
  migrations/
  seeders/
    RolesAndPermissionsSeeder.php
resources/
  js/
    app.jsx             # createInertiaApp + resolvePageComponent
    Components/         # reusable React components
    Layouts/
    Pages/              # one folder per resource (Index, Create, Edit, Show)
      Auth/             # Login, Register, ForgotPassword, ResetPassword
  views/
    app.blade.php       # root Blade template
routes/
  web.php
  product-categories.php  # example modular route files
  products.php
vite.config.js
```

> Note: the structure and the example table/route names above follow the assignment's examples; rename them to match our 1st-term project's domain.

---

## 11. Open Items to Confirm With the Team

- Which **1st-term project/domain** are we converting (inventory, e-commerce, learning portal, other)?
- Final list of **tables** (minimum 4) and their relationships.
- Final list of **roles** and **permissions** (spec examples: Admin, Manager, User).
- Preferred **database** (MySQL, SQLite, etc.) and Laravel/PHP/Node versions.
