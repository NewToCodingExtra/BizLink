<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\FollowController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\SocialAuthController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OpportunityController;
use App\Http\Controllers\PreferenceController;
use App\Http\Controllers\StoryController;
use App\Http\Controllers\UploadController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn() => response()->json(['ok' => true, 'app' => 'BizLink']));

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [PasswordResetController::class, 'requestLink']);
    Route::post('/reset-password', [PasswordResetController::class, 'reset']);
    Route::get('/{provider}/status', [SocialAuthController::class, 'status'])->where('provider', 'google|facebook');
    Route::get('/{provider}/redirect', [SocialAuthController::class, 'redirect'])->where('provider', 'google|facebook');
    Route::get('/{provider}/callback', [SocialAuthController::class, 'callback'])->where('provider', 'google|facebook');
    Route::post('/uploads', [UploadController::class, 'store'])->middleware('auth:sanctum');
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::get('/token', [SocialAuthController::class, 'tokenFromSession']);
    });
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/opportunities', [OpportunityController::class, 'index']);
Route::get('/opportunities/{opportunity}', [OpportunityController::class, 'show']);
Route::get('/opportunities/{opportunity}/comments', [CommentController::class, 'index']);

Route::get('/stories', [StoryController::class, 'index']);

Route::get('/users/{id}', [UserController::class, 'show']);

Route::post('/contact', [ContactController::class, 'submit']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/opportunities', [OpportunityController::class, 'store']);
    Route::post('/opportunities/{opportunity}/like', [OpportunityController::class, 'toggleLike']);
    Route::post('/opportunities/{opportunity}/save', [OpportunityController::class, 'toggleSave']);
    Route::get('/saved', [OpportunityController::class, 'saved']);

    Route::post('/opportunities/{opportunity}/comments', [CommentController::class, 'store']);

    Route::post('/stories', [StoryController::class, 'store']);
    Route::post('/stories/{story}/seen', [StoryController::class, 'markSeen']);

    Route::get('/conversations', [ConversationController::class, 'index']);
    Route::get('/conversations/{conversation}', [ConversationController::class, 'show']);
    Route::post('/inquiries', [ConversationController::class, 'inquire']);
    Route::post('/conversations/{conversation}/messages', [ConversationController::class, 'send']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);

    Route::get('/preferences', [PreferenceController::class, 'show']);
    Route::put('/preferences', [PreferenceController::class, 'update']);

    Route::get('/follows', [FollowController::class, 'index']);
    Route::post('/follows/toggle', [FollowController::class, 'toggle']);
});
