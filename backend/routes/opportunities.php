<?php

use App\Http\Controllers\OpportunityController;
use App\Http\Controllers\PageController;
use Illuminate\Support\Facades\Route;

/*
| REST-shaped mutations + edit only.
| List / show / create stay on pretty URLs in web.php:
|   GET /feed, GET /post/{slug}, GET /create
| Do not register GET /opportunities/create.
*/

Route::middleware(['auth', 'role:Admin|Manager'])->prefix('opportunities')->name('opportunities.')->group(function () {
    Route::post('/', [PageController::class, 'storeOpportunity'])->name('store');
    Route::get('/{opportunity}/edit', [OpportunityController::class, 'edit'])->name('edit');
    Route::put('/{opportunity}', [OpportunityController::class, 'update'])->name('update');
    Route::delete('/{opportunity}', [OpportunityController::class, 'destroy'])->name('destroy');
});

Route::middleware('auth')->prefix('opportunities')->name('opportunities.')->group(function () {
    Route::post('/{opportunity}/like', [OpportunityController::class, 'toggleLike'])->name('like');
    Route::post('/{opportunity}/save', [OpportunityController::class, 'toggleSave'])->name('save');
    Route::post('/{opportunity}/hide', [OpportunityController::class, 'hide'])->name('hide');
});
