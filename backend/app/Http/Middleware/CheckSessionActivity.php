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
        }
        
        return $next($request);
    }
}
