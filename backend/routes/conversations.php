<?php

use App\Http\Controllers\ConversationController;
use App\Http\Controllers\MeetController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\PollController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('/messages', [PageController::class, 'messages'])->name('messages.index');
    Route::get('/messages/{identifier}', [PageController::class, 'thread'])->name('messages.show');

    Route::post('/conversations/{conversation}/messages', [ConversationController::class, 'send'])
        ->middleware('throttle:30,1')
        ->name('conversations.messages.store');
    Route::post('/conversations/{conversation}/polls', [PollController::class, 'store'])
        ->middleware('throttle:5,1440')
        ->name('conversations.polls.store');
    Route::post('/polls/{poll}/vote', [PollController::class, 'vote'])->name('polls.vote');
    Route::post('/polls/{poll}/close', [PollController::class, 'close'])->name('polls.close');
    Route::post('/conversations/{conversation}/insights', [ConversationController::class, 'insights'])
        ->name('conversations.insights');

    Route::get('/meet/connect', [MeetController::class, 'connect'])->name('meet.connect');
    Route::get('/meet/callback', [MeetController::class, 'callback'])->name('meet.callback');
    Route::get('/meet/status', [MeetController::class, 'status'])->name('meet.status');
    Route::post('/meet/disconnect', [MeetController::class, 'disconnect'])->name('meet.disconnect');
    Route::post('/conversations/{conversation}/meet', [MeetController::class, 'schedule'])
        ->middleware('throttle:10,1440')
        ->name('conversations.meet.store');
    Route::delete('/conversations/{conversation}/meet/{eventId}', [MeetController::class, 'cancel'])
        ->name('conversations.meet.destroy');

    Route::post('/inquiries', [ConversationController::class, 'inquire'])->name('inquiries.store');
    Route::post('/inquiries/resolve', [ConversationController::class, 'resolve'])->name('inquiries.resolve');
});
