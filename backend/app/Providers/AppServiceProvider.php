<?php

namespace App\Providers;

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            \App\Contracts\CalendarAdapter::class,
            \App\Services\GoogleCalendarAdapter::class
        );
        $this->app->bind(
            \App\Contracts\GeocodeAdapter::class,
            \App\Services\NominatimGeocodeAdapter::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Frontend Vite lives in ../frontend and writes into public/build + public/hot.
        Vite::useHotFile(public_path('hot'))
            ->useBuildDirectory('build');

        // Session-authenticated broadcast auth (same cookie as the Inertia app).
        Broadcast::routes(['middleware' => ['web', 'auth']]);
        require base_path('routes/channels.php');
    }
}
