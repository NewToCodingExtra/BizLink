<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    private const PROVIDERS = ['google', 'facebook'];

    private function providerOrFail(string $provider): ?\Illuminate\Http\JsonResponse
    {
        if (!in_array($provider, self::PROVIDERS, true)) {
            return response()->json(['message' => "Unsupported provider: {$provider}"], 422);
        }
        return null;
    }

    private function frontend(): string
    {
        return config('services.frontend.google_success') ?: (rtrim(config('services.frontend.url', config('app.url', 'http://localhost:5173')), '/') . '/auth/social/callback');
    }

    private const SOCIAL_ROLES = ['entrepreneur', 'brand'];

    /**
     * Normalize a requested account type. Only entrepreneur/brand are
     * assignable — anything else (admin included) falls back to entrepreneur.
     */
    private function socialRole(?string $role): string
    {
        $role = strtolower(trim((string) $role));
        return in_array($role, self::SOCIAL_ROLES, true) ? $role : 'entrepreneur';
    }

    private function applySocialRole(User $user, string $role): void
    {
        $user->forceFill(['role' => $role])->save();
        if (! $user->hasAnyRole(['Admin', 'Manager', 'User'])) {
            $user->assignRole($role === 'brand' ? 'Manager' : 'User');
        }
    }

    /**
     * Persist the Google OAuth tokens as the Meet/Calendar connection, so a
     * Google sign-in automatically connects Calendar & Meet (same tokens the
     * manual /meet/connect flow stores).
     */
    private function storeGoogleTokens(User $user, $socialUser): void
    {
        try {
            $access = $socialUser->token ?? null;
            if (! $access) {
                return;
            }
            $user->googleToken()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'access_token' => $access,
                    'refresh_token' => $socialUser->refreshToken ?? $user->googleToken?->refresh_token,
                    'expires_at' => isset($socialUser->expiresIn) && $socialUser->expiresIn
                        ? now()->addSeconds((int) $socialUser->expiresIn)
                        : ($user->googleToken?->expires_at ?? now()->addHour()),
                ]
            );
        } catch (\Throwable $e) {
            Log::warning('Auto-connect Google Calendar failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);
        }
    }

    public function status(string $provider)
    {
        if (!in_array($provider, self::PROVIDERS, true)) {
            return response()->json(['message' => "Unsupported provider: {$provider}"], 422);
        }

        $configured = (bool) config("services.{$provider}.client_id");

        return response()->json([
            'provider' => $provider,
            'configured' => $configured,
            'message' => $configured ? null : ucfirst($provider) . ' OAuth is not configured. Set ' . strtoupper($provider) . '_CLIENT_ID and ' . strtoupper($provider) . '_CLIENT_SECRET in backend/.env',
        ]);
    }

    public function redirect(Request $request, string $provider)
    {
        if ($bad = $this->providerOrFail($provider)) {
            return $bad;
        }

        if (!config("services.{$provider}.client_id")) {
            return response()->json([
                'message' => ucfirst($provider) . ' OAuth is not configured. Set ' . strtoupper($provider) . '_CLIENT_ID and ' . strtoupper($provider) . '_CLIENT_SECRET in backend/.env',
                'setup' => $provider === 'google'
                    ? 'Create OAuth credentials at https://console.cloud.google.com/apis/credentials, authorized redirect URI: ' . config('services.google.redirect', env('GOOGLE_REDIRECT_URI'))
                    : 'Create a Login app at https://developers.facebook.com/apps, Valid OAuth Redirect URI: ' . config('services.facebook.redirect', env('FACEBOOK_REDIRECT_URI')),
            ], 503);
        }

        $driver = Socialite::driver($provider)->stateless();
        if ($provider === 'google') {
            // Calendar scope + offline access so a Google sign-in doubles as
            // the Calendar/Meet connection (tokens stored on callback).
            $driver = $driver->scopes(['https://www.googleapis.com/auth/calendar.events'])
                ->with(['access_type' => 'offline', 'prompt' => 'consent']);
        }

        return $driver->redirect();
    }

    public function callback(Request $request, string $provider)
    {
        if ($bad = $this->providerOrFail($provider)) {
            return $bad;
        }

        $frontend = $this->frontend();

        if (!config("services.{$provider}.client_id")) {
            return redirect($frontend . "?provider={$provider}&error={$provider}_not_configured");
        }

        if ($request->query('error')) {
            Log::warning("Social login denied", ['provider' => $provider, 'error' => $request->query('error'), 'reason' => $request->query('error_reason')]);
            return redirect($frontend . "?provider={$provider}&error={$provider}_denied");
        }

        try {
            $socialUser = Socialite::driver($provider)->stateless()->user();
        } catch (\Exception $e) {
            Log::error("Social login exchange failed", ['provider' => $provider, 'message' => $e->getMessage()]);
            $suffix = config('app.debug') ? '&detail=' . urlencode(substr($e->getMessage(), 0, 160)) : '';
            return redirect($frontend . "?provider={$provider}&error={$provider}_failed{$suffix}");
        }

        $idColumn = $provider . '_id';
        $user = User::where($idColumn, $socialUser->getId())
            ->orWhere('email', $socialUser->getEmail())
            ->first();

        $isNewApi = false;
        if (!$user) {
            $user = User::create([
                'name' => $socialUser->getName() ?: explode('@', $socialUser->getEmail())[0],
                'email' => $socialUser->getEmail(),
                $idColumn => $socialUser->getId(),
                'avatar' => $socialUser->getAvatar() ?: 'https://i.pravatar.cc/100?u=' . urlencode($socialUser->getEmail()),
                'password' => Hash::make(Str::random(32)),
                'email_verified_at' => now(),
                'role' => 'entrepreneur',
            ]);
            $user->assignRole('User');
            $isNewApi = true;
        } else {
            $user->forceFill([
                $idColumn => $user->{$idColumn} ?: $socialUser->getId(),
                'avatar' => $user->avatar ?: $socialUser->getAvatar(),
                'email_verified_at' => $user->email_verified_at ?: now(),
            ])->save();
            if (! $user->hasAnyRole(['Admin', 'Manager', 'User'])) {
                $this->applySocialRole($user, $this->socialRole($user->role));
            }
        }

        if ($provider === 'google') {
            $this->storeGoogleTokens($user, $socialUser);
        }

        $token = $user->createToken($provider)->plainTextToken;

        \App\Models\Preference::firstOrCreate(['user_id' => $user->id], ['categories' => []]);

        $suffix = $isNewApi ? '&new_account=1' : '';
        return redirect($frontend . "?provider={$provider}&token=" . urlencode($token) . $suffix);
    }

    /**
     * Session (web/Inertia) OAuth entry point. Uses stateful Socialite so
     * the provider round-trip is CSRF-protected. The token-API flow above
     * is intentionally left untouched.
     */
    public function webRedirect(Request $request, string $provider)
    {
        if ($bad = $this->providerOrFail($provider)) {
            return $bad;
        }

        if (!config("services.{$provider}.client_id")) {
            return redirect('/login')->with('error', ucfirst($provider) . ' OAuth is not configured.');
        }

        $driver = Socialite::driver($provider);
        if ($provider === 'google') {
            // Calendar scope + offline access so a Google sign-in doubles as
            // the Calendar/Meet connection (tokens stored on callback).
            $driver = $driver->scopes(['https://www.googleapis.com/auth/calendar.events'])
                ->with(['access_type' => 'offline', 'prompt' => 'consent']);
        }

        return $driver->redirect();
    }

    public function webCallback(Request $request, string $provider)
    {
        if ($bad = $this->providerOrFail($provider)) {
            return $bad;
        }

        if ($request->query('error')) {
            Log::warning("Social login denied", ['provider' => $provider]);
            return redirect('/login')->with('error', ucfirst($provider) . ' sign-in was cancelled.');
        }

        try {
            $socialUser = Socialite::driver($provider)->user();
        } catch (\Exception $e) {
            Log::error("Social login exchange failed", ['provider' => $provider, 'message' => $e->getMessage()]);
            return redirect('/login')->with('error', ucfirst($provider) . ' sign-in failed. Try again.');
        }

        $idColumn = $provider . '_id';
        $user = User::where($idColumn, $socialUser->getId())
            ->orWhere('email', $socialUser->getEmail())
            ->first();

        $isNew = !$user;
        if (!$user) {
            // Brand-new social account: create with a safe default and send
            // them to the role setup page (shown ONLY to new users) to pick
            // Entrepreneur vs Brand before entering the app.
            $user = User::create([
                'name' => $socialUser->getName() ?: explode('@', $socialUser->getEmail())[0],
                'email' => $socialUser->getEmail(),
                $idColumn => $socialUser->getId(),
                'avatar' => $socialUser->getAvatar() ?: 'https://i.pravatar.cc/100?u=' . urlencode($socialUser->getEmail()),
                'password' => Hash::make(Str::random(32)),
                'email_verified_at' => now(),
                'role' => 'entrepreneur',
            ]);
            $user->assignRole('User');
        } else {
            $user->forceFill([
                $idColumn => $user->{$idColumn} ?: $socialUser->getId(),
                'avatar' => $user->avatar ?: $socialUser->getAvatar(),
                'email_verified_at' => $user->email_verified_at ?: now(),
            ])->save();
            // Heal legacy social accounts that never received a Spatie role.
            if (! $user->hasAnyRole(['Admin', 'Manager', 'User'])) {
                $this->applySocialRole($user, $this->socialRole($user->role));
            }
        }

        if ($provider === 'google') {
            $this->storeGoogleTokens($user, $socialUser);
        }

        \App\Models\Preference::firstOrCreate(['user_id' => $user->id], ['categories' => []]);

        \Illuminate\Support\Facades\Auth::login($user, true);
        $request->session()->regenerate();
        $request->session()->put('last_activity_at', now());

        if ($isNew) {
            $request->session()->put('pending_role_setup', true);
            $request->session()->put('pending_role_provider', $provider);
            return redirect()->route('welcome.role');
        }

        $greeting = "Welcome back, {$user->name}!";
        return redirect()->intended('/feed')->with('success', $greeting);
    }

    public function tokenFromSession(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $token = $user->createToken('web')->plainTextToken;
        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'bio' => $user->bio,
                'role' => $user->role,
            ],
            'token' => $token,
        ]);
    }
}
