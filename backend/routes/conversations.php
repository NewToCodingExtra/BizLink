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
    Route::put('/conversations/{conversation}/messages/{message}', [ConversationController::class, 'updateMessage'])
        ->name('conversations.messages.update');
    Route::delete('/conversations/{conversation}/messages/{message}', [ConversationController::class, 'destroyMessage'])
        ->name('conversations.messages.destroy');
    Route::post('/conversations/{conversation}/messages/{message}/bump', [ConversationController::class, 'bumpMessage'])
        ->name('conversations.messages.bump');
    Route::post('/conversations/{conversation}/messages/{message}/react', [ConversationController::class, 'reactMessage'])
        ->name('conversations.messages.react');

    Route::post('/conversations/{conversation}/polls', [PollController::class, 'store'])
        ->middleware('throttle:20,1')
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
        ->middleware('throttle:30,1')
        ->name('conversations.meet.store');
    Route::delete('/conversations/{conversation}/meet/{eventId}', [MeetController::class, 'cancel'])
        ->name('conversations.meet.destroy');
    Route::post('/conversations/{conversation}/meet/{eventId}/end', [MeetController::class, 'end'])
        ->name('conversations.meet.end');
    Route::patch('/conversations/{conversation}/meet/{eventId}', [MeetController::class, 'updateLink'])
        ->name('conversations.meet.update');


    Route::post('/inquiries', [ConversationController::class, 'inquire'])->name('inquiries.store');
    Route::post('/inquiries/resolve', [ConversationController::class, 'resolve'])->name('inquiries.resolve');

    // Messenger 3-Pane & Rich Chat endpoints
    Route::get('/conversations/{conversation}/messages/search', [ConversationController::class, 'searchMessages'])
        ->name('conversations.messages.search');
    Route::get('/conversations/{conversation}/media', [ConversationController::class, 'media'])
        ->name('conversations.media');
    Route::post('/conversations/{conversation}/mute', [ConversationController::class, 'toggleMute'])
        ->name('conversations.mute');
    Route::post('/conversations/{conversation}/read', [ConversationController::class, 'markRead'])
        ->name('conversations.read');
    Route::post('/conversations/{conversation}/block', [ConversationController::class, 'blockUser'])
        ->name('conversations.block');
    Route::post('/link-preview', [ConversationController::class, 'linkPreview'])
        ->middleware('throttle:30,1')
        ->name('link-preview');
});
