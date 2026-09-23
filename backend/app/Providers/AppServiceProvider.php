<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Frontend Vite lives in ../frontend and writes into public/build + public/hot.
        Vite::useHotFile(public_path('hot'))
            ->useBuildDirectory('build');
    }
}
