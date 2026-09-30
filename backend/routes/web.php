<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\FollowController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\PreferenceController;
use App\Http\Controllers\SocialAuthController;
use App\Http\Controllers\StoryController;
use App\Http\Controllers\UploadController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Browser (Inertia) routes
|--------------------------------------------------------------------------
| Pages render via Inertia::render with server props. Domain mutations live
| in routes/opportunities.php, comments.php, and conversations.php.
*/

// Guest pages
Route::get('/', [PageController::class, 'home'])->name('home');
Route::get('/feed', [PageController::class, 'feed'])->name('feed');
Route::get('/about', [PageController::class, 'about'])->name('about');
Route::get('/reels', [PageController::class, 'reels'])->name('reels');
Route::get('/stories/{slug}', [PageController::class, 'storyViewer'])->name('stories.show');
Route::get('/search', [PageController::class, 'search'])->name('search');
Route::get('/post/{slug}', [PageController::class, 'post'])->name('opportunities.show');
// NOTE: /profile/edit is registered before /profile/{username} so the
// static segment wins over the wildcard.
Route::get('/profile/edit', [PageController::class, 'editProfile'])->middleware('auth')->name('profile.edit');
Route::get('/profile/{username}', [PageController::class, 'profile'])->name('profile.show');
Route::get('/contact', [PageController::class, 'contactPage'])->name('contact');
Route::post('/contact', [ContactController::class, 'submit'])->name('contact.submit');

// Legal pages
Route::inertia('/privacy', 'Legal/SitePrivacy')->name('privacy');
Route::inertia('/terms', 'Legal/SiteTerms')->name('terms');
Route::inertia('/acceptable-use', 'Legal/SiteAcceptable')->name('acceptable-use');

// Session authentication is owned by Laravel Fortify (login/register/forgot/reset/logout).
// Logout is handled by Fortify's default POST /logout route.

// OAuth (stateful session flow for the Inertia app)
Route::get('/auth/{provider}/redirect', [SocialAuthController::class, 'webRedirect'])
    ->where('provider', 'google|facebook')
    ->name('social.redirect');
Route::get('/auth/{provider}/callback', [SocialAuthController::class, 'webCallback'])
    ->where('provider', 'google|facebook')
    ->name('social.callback');

// Authenticated pages
Route::middleware('auth')->group(function () {
    Route::middleware(['auth', 'role:Admin|Manager'])->get('/create', [PageController::class, 'create'])->name('opportunities.create');

    Route::get('/notifications', [PageController::class, 'notifications'])->name('notifications.index');
    Route::get('/saved', [PageController::class, 'saved'])->name('saved');
    Route::get('/settings/preferences', [PageController::class, 'preferencesPage'])->name('preferences.edit');
    Route::put('/profile', [AuthController::class, 'updateProfile'])->name('profile.update');

    Route::post('/stories', [StoryController::class, 'store'])->name('stories.store');
    Route::post('/stories/{story}/seen', [StoryController::class, 'markSeen'])->name('stories.seen');
    Route::post('/stories/{story}/like', [StoryController::class, 'toggleLike'])->name('stories.like');
    Route::delete('/stories/{identifier}', [StoryController::class, 'destroy'])->name('stories.destroy');
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');
    Route::put('/preferences', [PreferenceController::class, 'update'])->name('preferences.update');
    Route::get('/preferences', [PreferenceController::class, 'show'])->name('preferences.show');
    Route::get('/follows', [FollowController::class, 'index'])->name('follows.index');
    Route::post('/follows/toggle', [FollowController::class, 'toggle'])->name('follows.toggle');
    Route::post('/uploads', [UploadController::class, 'store'])->name('uploads.store');
});

require __DIR__.'/opportunities.php';
require __DIR__.'/comments.php';
require __DIR__.'/conversations.php';
