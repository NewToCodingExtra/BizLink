<?php

namespace App\Http\Responses;

use App\Models\User;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Laravel\Fortify\Fortify;

/**
 * Post-login redirect, role-aware.
 *
 * Fortify owns POST /login (see route:list), so this response class — not a
 * controller — is what decides where the user lands. Sending every role to
 * /feed is why an admin login used to feel useless; the console, the brand
 * posting form and the buyer feed each get their own entry point.
 */
class FortifyLoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        $user = $request->user();

        return redirect()->intended($this->homeFor($user))
            ->with('success', 'Welcome back!');
    }

    private function homeFor($user): string
    {
        if (! $user instanceof User) {
            return '/feed';
        }
        if ($user->hasRole('Admin')) {
            return '/admin';
        }
        if ($user->hasRole('Manager')) {
            return '/create';
        }

        return '/feed';
    }
}
