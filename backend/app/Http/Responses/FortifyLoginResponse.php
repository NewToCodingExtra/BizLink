<?php

namespace App\Http\Responses;

use App\Models\User;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Laravel\Fortify\Fortify;

/**
 * Post-login redirect, role-aware.
 *
 * Fortify owns POST /login (see route:list), so this response class — not a
 * controller — is what decides where the user lands. Admins start in the
 * console; everyone else (brands included) lands on the feed homepage.
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

        return '/feed';
    }
}
