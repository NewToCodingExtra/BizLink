<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class CheckSessionActivity
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if ($user && $token = $user->currentAccessToken()) {
            $idleDays = Setting::get('session_idle_timeout_days', 7);
            
            if ($token->last_used_at && Carbon::parse($token->last_used_at)->diffInDays(now()) >= $idleDays) {
                // Token is too old, revoke it
                $token->delete();
                return response()->json(['message' => 'Session expired due to inactivity. Please log in again.'], 401);
            }
            return $next($request);
        }

        // Session (browser) users: same inactivity policy, web-friendly logout.
        if ($user && $request->hasSession()) {
            $idleDays = Setting::get('session_idle_timeout_days', 7);
            $last = $request->session()->get('last_activity_at');

            if ($last && now()->diffInMinutes($last) > $idleDays * 24 * 60) {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
                return redirect('/login')->with('error', 'Session expired due to inactivity. Please log in again.');
            }

            $request->session()->put('last_activity_at', now());
        }
        
        return $next($request);
    }
}
