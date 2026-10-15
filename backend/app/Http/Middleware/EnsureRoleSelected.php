<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * New OAuth accounts land with `pending_role_setup` in the session until
 * they pick Entrepreneur vs Brand on /welcome/role. Hold them there for
 * page visits; API/JSON traffic passes through (they hold a safe default
 * entrepreneur role until they choose).
 */
class EnsureRoleSelected
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->user()
            && $request->session()->get('pending_role_setup')
            && ! $request->expectsJson()
            && ! $request->routeIs('welcome.*')
        ) {
            return redirect()->route('welcome.role');
        }

        return $next($request);
    }
}
