<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    public function redirect(Request $request)
    {
        $frontend = env('GOOGLE_FRONTEND_SUCCESS', 'http://localhost:5173/auth/google/callback');

        if (!config('services.google.client_id')) {
            return response()->json([
                'message' => 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env',
                'setup' => 'Create OAuth credentials at https://console.cloud.google.com/apis/credentials, set authorized redirect URI to ' . env('GOOGLE_REDIRECT_URI'),
            ], 503);
        }

        return Socialite::driver('google')->stateless()->redirect();
    }

    public function callback(Request $request)
    {
        $frontend = env('GOOGLE_FRONTEND_SUCCESS', 'http://localhost:5173/auth/google/callback');

        if (!config('services.google.client_id')) {
            return redirect($frontend . '?error=google_not_configured');
        }

        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Exception $e) {
            return redirect($frontend . '?error=google_failed');
        }

        $user = User::where('google_id', $googleUser->getId())
            ->orWhere('email', $googleUser->getEmail())
            ->first();

        if (!$user) {
            $user = User::create([
                'name' => $googleUser->getName() ?: explode('@', $googleUser->getEmail())[0],
                'email' => $googleUser->getEmail(),
                'google_id' => $googleUser->getId(),
                'avatar' => $googleUser->getAvatar() ?: 'https://i.pravatar.cc/100?u=' . urlencode($googleUser->getEmail()),
                'password' => Hash::make(Str::random(32)),
                'email_verified_at' => now(),
            ]);
        } else {
            $user->forceFill([
                'google_id' => $user->google_id ?: $googleUser->getId(),
                'avatar' => $user->avatar ?: $googleUser->getAvatar(),
                'email_verified_at' => $user->email_verified_at ?: now(),
            ])->save();
        }

        $token = $user->createToken('google')->plainTextToken;

        return redirect($frontend . '?token=' . urlencode($token));
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
