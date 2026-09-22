<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'sometimes|string|in:entrepreneur,brand,admin',
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => $data['role'] ?? 'entrepreneur',
            'avatar' => 'https://i.pravatar.cc/100?u=' . urlencode($data['email']),
        ]);

        $token = $user->createToken('web')->plainTextToken;

        \App\Models\Preference::firstOrCreate(['user_id' => $user->id], ['categories' => []]);

        return response()->json([
            'user' => $this->userPayload($user),
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $ip = $request->ip();
        $rateLimitKey = 'login.attempts.' . $ip;
        $maxAttempts = (int) \App\Models\Setting::get('login_rate_limit', 5);

        if (\Illuminate\Support\Facades\RateLimiter::tooManyAttempts($rateLimitKey, $maxAttempts)) {
            $seconds = \Illuminate\Support\Facades\RateLimiter::availableIn($rateLimitKey);
            throw ValidationException::withMessages([
                'email' => ['Too many login attempts. Please try again in ' . $seconds . ' seconds.'],
            ]);
        }

        $user = User::where('email', $data['email'])->first();

        if (!$user || !$user->password || !Hash::check($data['password'], $user->password)) {
            \Illuminate\Support\Facades\RateLimiter::hit($rateLimitKey, 60);
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        \Illuminate\Support\Facades\RateLimiter::clear($rateLimitKey);

        $token = $user->createToken('web')->plainTextToken;

        \App\Models\Preference::firstOrCreate(['user_id' => $user->id], ['categories' => []]);

        return response()->json([
            'user' => $this->userPayload($user),
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user) {
            $current = $user->currentAccessToken();
            if ($current) {
                $current->delete();
            } else {
                $user->tokens()->delete();
            }
        }

        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        return response()->json(['user' => $this->userPayload($user)]);
    }

    public function updateProfile(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'avatar' => 'nullable|string|max:2048',
            'bio' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        $user->forceFill([
            'name' => $data['name'],
            'avatar' => $data['avatar'] ?? $user->avatar,
            'bio' => $data['bio'] ?? null,
        ])->save();

        return response()->json(['user' => $this->userPayload($user->fresh())]);
    }

    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->avatar,
            'bio' => $user->bio,
            'role' => $user->role,
            'google_id' => $user->google_id,
            'created_at' => $user->created_at,
        ];
    }
}
