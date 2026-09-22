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
        return env('GOOGLE_FRONTEND_SUCCESS', 'http://localhost:5173/auth/social/callback');
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
                    ? 'Create OAuth credentials at https://console.cloud.google.com/apis/credentials, authorized redirect URI: ' . env('GOOGLE_REDIRECT_URI')
                    : 'Create a Login app at https://developers.facebook.com/apps, Valid OAuth Redirect URI: ' . env('FACEBOOK_REDIRECT_URI'),
            ], 503);
        }

        return Socialite::driver($provider)->stateless()->redirect();
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

        if (!$user) {
            $user = User::create([
                'name' => $socialUser->getName() ?: explode('@', $socialUser->getEmail())[0],
                'email' => $socialUser->getEmail(),
                $idColumn => $socialUser->getId(),
                'avatar' => $socialUser->getAvatar() ?: 'https://i.pravatar.cc/100?u=' . urlencode($socialUser->getEmail()),
                'password' => Hash::make(Str::random(32)),
                'email_verified_at' => now(),
            ]);
        } else {
            $user->forceFill([
                $idColumn => $user->{$idColumn} ?: $socialUser->getId(),
                'avatar' => $user->avatar ?: $socialUser->getAvatar(),
                'email_verified_at' => $user->email_verified_at ?: now(),
            ])->save();
        }

        $token = $user->createToken($provider)->plainTextToken;

        return redirect($frontend . "?provider={$provider}&token=" . urlencode($token));
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
                'role' => $user->role,
            ],
            'token' => $token,
        ]);
    }
}
