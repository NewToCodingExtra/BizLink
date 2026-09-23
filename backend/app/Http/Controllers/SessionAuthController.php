<?php

namespace App\Http\Controllers;

use App\Models\Preference;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * Session-based authentication for the Inertia app. Mirrors the rules of
 * the token API (AuthController) but responds with redirects + flash
 * messages so Inertia forms, validation errors, and intended redirects
 * all work natively. The token API is intentionally left untouched.
 */
class SessionAuthController extends Controller
{
    public function showLogin()
    {
        return Inertia::render('Login');
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

        if (RateLimiter::tooManyAttempts($rateLimitKey, $maxAttempts)) {
            $seconds = RateLimiter::availableIn($rateLimitKey);
            throw ValidationException::withMessages([
                'email' => ['Too many login attempts. Please try again in ' . $seconds . ' seconds.'],
            ]);
        }

        if (!Auth::attempt(['email' => $data['email'], 'password' => $data['password']], true)) {
            RateLimiter::hit($rateLimitKey, 60);
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        RateLimiter::clear($rateLimitKey);

        $request->session()->regenerate();
        $request->session()->put('last_activity_at', now());

        Preference::firstOrCreate(['user_id' => Auth::id()], ['categories' => []]);

        return redirect()->intended('/feed');
    }

    public function showRegister()
    {
        return Inertia::render('Register');
    }

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

        Auth::login($user, true);
        $request->session()->regenerate();
        $request->session()->put('last_activity_at', now());

        Preference::firstOrCreate(['user_id' => $user->id], ['categories' => []]);

        return redirect('/feed')->with('success', "Welcome to BizLink, {$user->name}!");
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/')->with('success', 'Logged out.');
    }

    public function showForgot()
    {
        return Inertia::render('ForgotPassword');
    }

    public function sendResetLink(Request $request)
    {
        $data = $request->validate(['email' => 'required|email|max:255']);

        $user = User::where('email', $data['email'])->first();

        if ($user && !$user->google_id && !$user->facebook_id) {
            $token = Str::random(64);

            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $user->email],
                ['token' => hash('sha256', $token), 'created_at' => now()]
            );

            $link = rtrim(config('app.url'), '/')
                . '/reset-password?email=' . urlencode($user->email)
                . '&token=' . urlencode($token);

            Mail::raw(
                "Hi {$user->name},\n\nReset your BizLink password here (valid 60 minutes):\n{$link}\n\nIgnore this if you did not request it.",
                function ($message) use ($user) {
                    $message->to($user->email)->subject('Reset your BizLink password');
                }
            );
        }

        if ($user && ($user->google_id || $user->facebook_id)) {
            throw ValidationException::withMessages([
                'email' => ['This account signs in with Google or Facebook — use those buttons instead of a password.'],
            ]);
        }

        return back()->with('success', 'If an account exists for this email, a reset link was sent.');
    }

    public function showReset(Request $request)
    {
        return Inertia::render('ResetPassword', [
            'email' => $request->query('email', ''),
            'token' => $request->query('token', ''),
        ]);
    }

    public function reset(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email|max:255',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $row = DB::table('password_reset_tokens')->where('email', $data['email'])->first();

        if (!$row || !hash_equals($row->token, hash('sha256', $data['token']))) {
            throw ValidationException::withMessages([
                'email' => ['Invalid or expired reset token.'],
            ]);
        }

        if (now()->diffInMinutes($row->created_at) > 60) {
            DB::table('password_reset_tokens')->where('email', $data['email'])->delete();
            throw ValidationException::withMessages([
                'email' => ['Reset token expired. Request a new one.'],
            ]);
        }

        $user = User::where('email', $data['email'])->first();
        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['Account not found.'],
            ]);
        }

        $user->forceFill(['password' => Hash::make($data['password'])])->save();
        DB::table('password_reset_tokens')->where('email', $data['email'])->delete();
        $user->tokens()->delete();

        return redirect('/login')->with('success', 'Password reset. Log in with your new password.');
    }
}
