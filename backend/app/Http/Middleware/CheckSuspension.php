<?php

namespace App\Http\Middleware;

use App\Services\EnforcementService;
use Closure;
use Illuminate\Http\Request;

/**
 * Blocks suspended/banned accounts from mutating content.
 * Read-only browsing stays available so the ban message is visible.
 */
class CheckSuspension
{
    public function __construct(private EnforcementService $enforcement) {}

    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if ($user && in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            // Reporting itself must stay available even while suspended.
            if (! $request->is('*/report') && ! str_contains((string) $request->path(), 'report')) {
                if ($message = $this->enforcement->isBlocked($user)) {
                    if ($request->wantsJson() || $request->expectsJson()) {
                        return response()->json(['message' => $message], 403);
                    }
                    return redirect('/feed')->with('error', $message);
                }
            }
        }
        return $next($request);
    }
}
