<?php

use App\Http\Controllers\CommentController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::post('/opportunities/{opportunity}/comments', [CommentController::class, 'store'])
        ->middleware('throttle:10,1')
        ->name('comments.store');
    Route::get('/opportunities/{opportunity}/comments', [CommentController::class, 'index'])
        ->name('comments.index');
    Route::get('/comments/{comment}/replies', [CommentController::class, 'replies'])
        ->name('comments.replies');
    Route::patch('/comments/{comment}', [CommentController::class, 'update'])
        ->name('comments.update');
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy'])
        ->name('comments.destroy');
    Route::post('/comments/{comment}/react', [CommentController::class, 'react'])
        ->middleware('throttle:60,1')
        ->name('comments.react');
    Route::post('/comments/{comment}/report', [CommentController::class, 'report'])
        ->name('comments.report');
});
