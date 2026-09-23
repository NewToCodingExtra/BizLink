# Implementation Plan

## Overview
Restore broken post → user links (`opportunities.user_id` was nulled, breaking author profile + comment seller logic) and audit/fix every other orphaned FK, preferring in-place repair of the 40+ live posts; only wipe + reseed if repair is impossible. Then harden FK constraints and app guards so deleting a user can never silently orphan posts again.

Scope: `backend/` Laravel API (MySQL `bizlink` on `127.0.0.1:3307`), seeders, migrations, models, controllers, resource, frontend cards. Live DB is currently unreachable from CLI PHP (`pdo_mysql`/`mysqli` missing) — reconnect first, read-only audit before any write, snapshot backup before repair/reseed.

## Types
- No new enums. PHP types stay int|null user_id, string|null brand_id.
- DB (new migration, MySQL): opportunities.user_id NULL -> NOT NULL + FK RESTRICT; stories.user_id NULL -> NOT NULL + RESTRICT (two-phase: backfill then alter).
- comments.user_id stays NULLABLE SET NULL (guest snapshot author/avatar kept) + ensure FK exists.
- conversations.user_id NOT NULL CASCADE keep; messages.sender_id NULL SET NULL keep; conversations.opportunity_id NULL SET NULL keep.
- Pivots/children (likes/saves/story_likes/hidden/follows/preferences/notifications/messages.conversation_id/comments.opportunity_id): enforce NOT NULL + CASCADE; verify real DB matches migrations (drift suspected via migrate_manual.php + /migrate-now route).
- brand_id stays VARCHAR NULL display slug, NOT a FK; author truth is always user_id.
- New command: php artisan audit:orphans {--fix} {--json}.


## Files
- NEW backend/app/Console/Commands/AuditOrphans.php : read-only orphan report; --fix re-attaches owners (never deletes except provably dangling pivots after backup).
- NEW backend/database/migrations/2026_09_24_100000_harden_fk_constraints.php : zero-null assert then NOT NULL+RESTRICT on opportunities.user_id + stories.user_id; re-add missing pivot FKs; transactional.
- NEW backend/database/seeders/RepairPostOwnersSeeder.php : idempotent repair mapping brand_id/snapshot -> users.id; fixes opportunities + stories user_id and brand_avatar; chunked.
- MODIFY backend/database/seeders/DatabaseSeeder.php : keep exact 16 posts data; canonical resolveBrandOwner helper; healing update if user_id drifted; username/slug backfill; final assertNoOrphanPosts.
- MODIFY backend/database/seeders/MorePostsSeeder.php : fix brand_id drift (brand-{id} vs brand-1..16); create->firstOrCreate by headline; unify slug scheme with DatabaseSeeder/UserController.
- MODIFY backend/app/Models/Opportunity.php + Story.php + Comment.php + User.php : saving/deleting guards (see Functions).
- MODIFY backend/app/Http/Controllers/OpportunityController.php (store/toggleLike/show) : force user_id/brand_* from auth user; keep null-guards for legacy rows.
- MODIFY backend/app/Http/Controllers/CommentController.php : require auth, force user_id from auth; keep author/avatar snapshot.
- MODIFY backend/app/Http/Controllers/UserController.php : keep username->id->brand-N fallback; add withCount + 410 if reassigned.
- MODIFY backend/routes/api.php : REMOVE GET /migrate-now inline DDL hack (lines 21-33).
- CONFIG backend/.env + php.ini : enable pdo_mysql/mysqli locally; verify DB_PORT 3307 vs 3306. No secret commit.
- BACKUP dumps/bizlink-pre-repair-YYYYMMDD-HHmm.sql + snapshot.json before any write.


## Dependencies
- No new composer/npm packages; uses illuminate/database + mysqldump CLI.
- Env fix: enable pdo_mysql+mysqli in C:/xampp/php/php.ini, restart CLI; confirm DB_PORT 3307 reachable else 3306. Without this artisan/tinker/migrate/seed fail (reproduced: could not find driver).
- Optional: scout:import after reseed if Meilisearch stale.


## Classes
- NEW App.Console.Commands.AuditOrphans (Command): handle/check/report.
- NEW Database.Seeders.RepairPostOwnersSeeder (Seeder): run/repair*/resolveBrandOwner.
- MODIFIED App.Models.Opportunity : +booted guard; relations unchanged.
- MODIFIED App.Models.Story : +user() belongsTo +booted guard.
- MODIFIED App.Models.Comment : +booted orphan-opportunity guard.
- MODIFIED App.Models.User : extend booted() with deleting protection.
- REMOVED none (MorePostsSeeder/DatabaseSeeder/controllers stay, methods tightened).


## Functions
- NEW AuditOrphans::handle() : 12 checks (opps/stories NULL + NOT IN users; comments user/opportunity orphan; conversations/messages/notifications/likes/saves/follows/preferences/story_likes/hidden orphans; brand_id with no user). --fix calls repair seeder.
- NEW RepairPostOwnersSeeder::run()/repairOpportunities()/repairStories()/repairComments()/resolveBrandOwner() : order exact brand_id map -> brand-{id} -> brand_name/avatar fuzzy -> BrewCraft fallback + log.
- NEW DatabaseSeeder::resolveBrandOwner()+assertNoOrphanPosts() : prevents future null owners.
- MODIFIED Opportunity::booted() saving guard : abort if user_id null or user missing (repair seeder uses withoutEvents bypass).
- MODIFIED User::booted() deleting guard : block delete when opportunities/stories exist unless force flag.
- MODIFIED OpportunityController::store() : user_id/brand_id/brand_name/brand_avatar forced from request->user(); ignore client values.
- MODIFIED CommentController::store() : user_id forced from auth; snapshot author/avatar kept.
- REMOVED routes/api.php migrate-now closure -> versioned migration file.
- Migration up() : dropForeignIfExists then addForeign RESTRICT; down() restores nullOnDelete.


## Testing
- Pre-flight read-only: (1) php -m pdo_mysql + artisan db:show; (2) mysqldump to dumps/ + row-count JSON; (3) audit:orphans capture (expect opps NULL>0); (4) browser baseline /post/slug author null, /profile/brandId 404, seller badge missing.
- Post-repair: (1) audit:orphans zeros (except guest comments with author); (2) Repair seeder idempotent 2nd run 0 changes; (3) API GET /opportunities every item user+authorId non-null, show/comments 200, POST comment sets user_id, GET /users/{username,id,brand-N} 200 per owner; (4) profile lists posts; comment links work; (5) hardening: DELETE user with posts fails RESTRICT on staging, create post w/o user_id throws, User delete blocked; (6) reseed path only if needed: migrate:fresh --seed on staging -> users=17, opps>=16, headlines preserved, slugs unique.
- Run php artisan test before/after; add tests/Feature/OrphanProtectionTest.php.


## Implementation Order
1. Reconnect+backup: enable drivers, verify DB, mysqldump+JSON snapshot, record counts + 5 sample orphans.
2. Add AuditOrphans read-only -> run audit:orphans -> evidence decides repair vs reseed.
3. Create RepairPostOwnersSeeder dry-run (log only) -> review brand-1..16 vs brand-{id} mapping.
4. Live repair: db:seed --class=RepairPostOwnersSeeder -> re-audit -> verify API/profile/comment. Skip step 5 if clean.
5. Reseed fallback only if unresolvable: save headlines JSON, migrate:fresh, db:seed, scout:import, recount 40+ with owners.
6. Harden schema migration (zero-null assert, NOT NULL+RESTRICT, re-add pivot FKs); remove /migrate-now; archive migrate_manual.php.
7. Harden app: model guards + store() forced owners + seeder idempotency + brand_id unification.
8. Final validation: audit clean, tests green, feed/post/profile/comment/inquire smoke, delete-block demo on staging, docs update.

