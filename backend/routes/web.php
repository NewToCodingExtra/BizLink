<?php

use App\Http\Controllers\ContactController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\FollowController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OpportunityController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\PreferenceController;
use App\Http\Controllers\SessionAuthController;
use App\Http\Controllers\SocialAuthController;
use App\Http\Controllers\StoryController;
use App\Http\Controllers\UploadController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Browser (Inertia) routes
|--------------------------------------------------------------------------
| Pages render via Inertia::render with server props. Lightweight mutations
| stay as same-origin JSON fetch calls (session cookie + CSRF) reusing the
| existing controllers, so interaction behavior is unchanged.
*/

// Guest pages
Route::get('/', [PageController::class, 'home']);
Route::get('/feed', [PageController::class, 'feed']);
Route::get('/about', [PageController::class, 'about']);
Route::get('/reels', [PageController::class, 'reels']);
Route::get('/stories/{slug}', [PageController::class, 'storyViewer']);
Route::get('/search', [PageController::class, 'search']);
Route::get('/post/{slug}', [PageController::class, 'post']);
// NOTE: /profile/edit is registered before /profile/{username} so the
// static segment wins over the wildcard.
Route::get('/profile/edit', [PageController::class, 'editProfile'])->middleware('auth');
Route::get('/profile/{username}', [PageController::class, 'profile']);
Route::get('/contact', [PageController::class, 'contactPage']);
Route::post('/contact', [ContactController::class, 'submit']);

// Legal pages
Route::inertia('/privacy', 'Legal/SitePrivacy');
Route::inertia('/terms', 'Legal/SiteTerms');
Route::inertia('/acceptable-use', 'Legal/SiteAcceptable');

// Session authentication (guest only)
Route::middleware('guest')->group(function () {
    Route::get('/login', [SessionAuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [SessionAuthController::class, 'login']);
    Route::get('/register', [SessionAuthController::class, 'showRegister']);
    Route::post('/register', [SessionAuthController::class, 'register']);
    Route::get('/forgot-password', [SessionAuthController::class, 'showForgot']);
    Route::post('/forgot-password', [SessionAuthController::class, 'sendResetLink']);
    Route::get('/reset-password', [SessionAuthController::class, 'showReset']);
    Route::post('/reset-password', [SessionAuthController::class, 'reset']);
});

// OAuth (stateful session flow for the Inertia app)
Route::get('/auth/{provider}/redirect', [SocialAuthController::class, 'webRedirect'])->where('provider', 'google|facebook');
Route::get('/auth/{provider}/callback', [SocialAuthController::class, 'webCallback'])->where('provider', 'google|facebook');

// Authenticated pages + session logout
Route::middleware('auth')->group(function () {
    Route::post('/logout', [SessionAuthController::class, 'logout']);
    Route::get('/create', [PageController::class, 'create']);
    Route::post('/opportunities', [PageController::class, 'storeOpportunity']);
    Route::get('/messages', [PageController::class, 'messages']);
    Route::get('/messages/{identifier}', [PageController::class, 'thread']);
    Route::get('/notifications', [PageController::class, 'notifications']);
    Route::get('/saved', [PageController::class, 'saved']);
    Route::get('/settings/preferences', [PageController::class, 'preferencesPage']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);

    // JSON mutations (same controllers as the token API)
    Route::post('/opportunities/{opportunity}/like', [OpportunityController::class, 'toggleLike']);
    Route::post('/opportunities/{opportunity}/save', [OpportunityController::class, 'toggleSave']);
    Route::post('/opportunities/{opportunity}/hide', [OpportunityController::class, 'hide']);
    Route::post('/opportunities/{opportunity}/comments', [CommentController::class, 'store'])->middleware('throttle:10,1');
    Route::get('/opportunities/{opportunity}/comments', [CommentController::class, 'index']);
    Route::get('/comments/{comment}/replies', [CommentController::class, 'replies']);
    Route::patch('/comments/{comment}', [CommentController::class, 'update']);
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy']);
    Route::post('/comments/{comment}/react', [CommentController::class, 'react'])->middleware('throttle:60,1');
    Route::post('/comments/{comment}/report', [CommentController::class, 'report']);
    Route::post('/stories', [StoryController::class, 'store']);
    Route::post('/stories/{story}/seen', [StoryController::class, 'markSeen']);
    Route::post('/stories/{story}/like', [StoryController::class, 'toggleLike']);
    Route::post('/inquiries', [ConversationController::class, 'inquire']);
    Route::post('/conversations/{conversation}/messages', [ConversationController::class, 'send']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::put('/preferences', [PreferenceController::class, 'update']);
    Route::get('/preferences', [PreferenceController::class, 'show']);
    Route::get('/follows', [FollowController::class, 'index']);
    Route::post('/follows/toggle', [FollowController::class, 'toggle']);
    Route::post('/uploads', [UploadController::class, 'store']);
});
