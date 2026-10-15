<?php

use App\Http\Controllers\Admin\AnalyticsController;
use App\Http\Controllers\Admin\ExportController;
use App\Http\Controllers\Admin\ReportAdminController;
use App\Http\Controllers\Admin\SettingsAdminController;
use App\Http\Controllers\Admin\UserAdminController;
use App\Http\Controllers\Admin\VerificationAdminController;
use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'role:Admin', 'suspension'])->prefix('admin')->name('admin.')->group(function () {
    // 1. Dashboard Overview
    Route::get('/', [AdminController::class, 'index'])->name('index');

    // 2. User Management (Module A)
    Route::get('/users', [UserAdminController::class, 'index'])->name('users.index');
    Route::get('/users/{user}', [UserAdminController::class, 'show'])->name('users.show');
    Route::post('/users/{user}/warn', [UserAdminController::class, 'warn'])->name('users.warn');
    Route::post('/users/{user}/suspend', [UserAdminController::class, 'suspend'])->name('users.suspend');
    Route::post('/users/{user}/unsuspend', [UserAdminController::class, 'unsuspend'])->name('users.unsuspend');
    Route::post('/users/{user}/ban', [UserAdminController::class, 'ban'])->name('users.ban');
    Route::post('/users/{user}/unban', [UserAdminController::class, 'unban'])->name('users.unban');
    Route::post('/users/{user}/role', [UserAdminController::class, 'changeRole'])->name('users.role');
    Route::post('/users/{user}/reset-password', [UserAdminController::class, 'resetPassword'])->name('users.reset-password');
    Route::post('/users/{user}/unlock', [UserAdminController::class, 'unlock'])->name('users.unlock');

    // 3. Reports & Moderation
    Route::get('/reports', [ReportAdminController::class, 'index'])->name('reports.index');
    Route::get('/reports/{report}', [ReportAdminController::class, 'show'])->name('reports.show');
    Route::post('/reports/{report}/reject', [ReportAdminController::class, 'reject'])->name('reports.reject');
    Route::post('/reports/{report}/accept', [ReportAdminController::class, 'accept'])->name('reports.accept');
    Route::get('/users/{user}/moderation-history', [ReportAdminController::class, 'history'])->name('users.history');

    // 4. Verifications (Module B)
    Route::get('/verifications', [VerificationAdminController::class, 'index'])->name('verifications.index');
    Route::post('/verifications/{verificationRequest}/approve', [VerificationAdminController::class, 'approve'])->name('verifications.approve');
    Route::post('/verifications/{verificationRequest}/reject', [VerificationAdminController::class, 'reject'])->name('verifications.reject');
    Route::post('/verifications/{identifier}/revoke', [VerificationAdminController::class, 'revoke'])->name('verifications.revoke');

    // 5. Analytics (Module C)
    Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');

    // 6. Settings (Module E)
    Route::get('/settings', [SettingsAdminController::class, 'index'])->name('settings.index');
    Route::post('/settings', [SettingsAdminController::class, 'update'])->name('settings.update');
    Route::post('/settings/admins/invite', [SettingsAdminController::class, 'inviteAdmin'])->name('settings.admins.invite');
    Route::post('/settings/admins/{user}/revoke', [SettingsAdminController::class, 'revokeAdmin'])->name('settings.admins.revoke');

    // 7. Exports (Module D)
    Route::get('/export/users', [ExportController::class, 'users'])->name('export.users');
    Route::get('/export/reports', [ExportController::class, 'reports'])->name('export.reports');
    Route::get('/export/verifications', [ExportController::class, 'verifications'])->name('export.verifications');
    Route::get('/export/audit-logs', [ExportController::class, 'auditLogs'])->name('export.audit-logs');
});
