<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Actions\Fortify\UpdateUserPassword;
use App\Actions\Fortify\UpdateUserProfileInformation;
use App\Http\Responses\FortifyLoginResponse;
use App\Http\Responses\FortifyLogoutResponse;
use App\Http\Responses\FortifyPasswordResetLinkResponse;
use App\Http\Responses\FortifyPasswordResetResponse;
use App\Http\Responses\FortifyRegisterResponse;
use App\Models\Preference;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Registered;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Laravel\Fortify\Contracts\LogoutResponse as LogoutResponseContract;
use Laravel\Fortify\Contracts\PasswordResetResponse as PasswordResetResponseContract;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;
use Laravel\Fortify\Contracts\SuccessfulPasswordResetLinkRequestResponse as SuccessfulPasswordResetLinkRequestResponseContract;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(LoginResponseContract::class, FortifyLoginResponse::class);
        $this->app->singleton(RegisterResponseContract::class, FortifyRegisterResponse::class);
        $this->app->singleton(LogoutResponseContract::class, FortifyLogoutResponse::class);
        $this->app->singleton(PasswordResetResponseContract::class, FortifyPasswordResetResponse::class);
        $this->app->singleton(SuccessfulPasswordResetLinkRequestResponseContract::class, FortifyPasswordResetLinkResponse::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Fortify::loginView(fn () => Inertia::render('Login'));
        Fortify::registerView(fn () => Inertia::render('Register'));
        Fortify::requestPasswordResetLinkView(fn () => Inertia::render('ForgotPassword'));
        Fortify::resetPasswordView(fn ($request) => Inertia::render('ResetPassword', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]));

        Fortify::createUsersUsing(CreateNewUser::class);
        Fortify::updateUserProfileInformationUsing(UpdateUserProfileInformation::class);
        Fortify::updateUserPasswordsUsing(UpdateUserPassword::class);
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });

        Event::listen(Login::class, function (Login $event): void {
            if (request()->hasSession()) {
                request()->session()->put('last_activity_at', now());
            }
            Preference::firstOrCreate(['user_id' => $event->user->id], ['categories' => []]);
        });

        Event::listen(Registered::class, function (Registered $event): void {
            if (request()->hasSession()) {
                request()->session()->put('last_activity_at', now());
            }
            Preference::firstOrCreate(['user_id' => $event->user->id], ['categories' => []]);
        });
    }
}
