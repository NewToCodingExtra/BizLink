<?php

use App\Http\Controllers\Admin\ReportAdminController;
use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

/*
| User-facing filing (session auth, same-origin fetch).
| Suspension middleware allows reporting even while suspended.
*/
Route::middleware(['auth', 'suspension'])->group(function () {
    Route::get('/report-categories', [ReportController::class, 'categories'])->name('reports.categories');
    Route::post('/opportunities/{opportunity}/report', [ReportController::class, 'reportOpportunity'])->name('reports.opportunity');
    Route::post('/stories/{story}/report', [ReportController::class, 'reportStory'])->name('reports.story');
    Route::post('/messages/{message}/report', [ReportController::class, 'reportMessage'])->name('reports.message');
    Route::post('/conversations/{conversation}/report', [ReportController::class, 'reportConversation'])->name('reports.conversation');
    Route::post('/users/{user}/report', [ReportController::class, 'reportUser'])->name('reports.user');
    // NOTE: /comments/{comment}/report stays in routes/comments.php (legacy path,
    // now backed by the unified queue) to avoid duplicate route registration.
});
