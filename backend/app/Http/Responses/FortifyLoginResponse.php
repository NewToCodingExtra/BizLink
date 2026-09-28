<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Laravel\Fortify\Fortify;

class FortifyLoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        return redirect()->intended(Fortify::redirects('login', '/feed'))
            ->with('success', 'Welcome back!');
    }
}
