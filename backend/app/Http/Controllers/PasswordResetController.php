<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    public function requestLink(Request $request)
    {
        $data = $request->validate(['email' => 'required|email|max:255']);

        $user = User::where('email', $data['email'])->first();

        if (!$user) {
            return response()->json(['message' => 'If an account exists for this email, a reset link was sent.']);
        }

        if ($user->google_id || $user->facebook_id) {
            return response()->json([
                'message' => 'This account signs in with Google or Facebook — use those buttons instead of a password.',
                'social' => true,
            ], 422);
        }

        $token = Str::random(64);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            ['token' => hash('sha256', $token), 'created_at' => now()]
        );

        $link = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/')
            . '/reset-password?email=' . urlencode($user->email)
            . '&token=' . urlencode($token);

        Mail::raw(
            "Hi {$user->name},\n\nReset your BizLink password here (valid 60 minutes):\n{$link}\n\nIgnore this if you did not request it.",
            function ($message) use ($user) {
                $message->to($user->email)->subject('Reset your BizLink password');
            }
        );

        $payload = ['message' => 'If an account exists for this email, a reset link was sent.'];
        if (config('app.debug')) {
            $payload['token'] = $token;
            $payload['link'] = $link;
        }

        return response()->json($payload);
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
            return response()->json(['message' => 'Invalid or expired reset token.'], 422);
        }

        if (now()->diffInMinutes($row->created_at) > 60) {
            DB::table('password_reset_tokens')->where('email', $data['email'])->delete();
            return response()->json(['message' => 'Reset token expired. Request a new one.'], 422);
        }

        $user = User::where('email', $data['email'])->first();
        if (!$user) {
            return response()->json(['message' => 'Account not found.'], 404);
        }

        $user->forceFill(['password' => Hash::make($data['password'])])->save();
        DB::table('password_reset_tokens')->where('email', $data['email'])->delete();
        $user->tokens()->delete();

        return response()->json(['message' => 'Password reset. Log in with your new password.']);
    }
}
