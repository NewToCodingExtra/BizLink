<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LogoutResponse as LogoutResponseContract;
use Laravel\Fortify\Fortify;

class FortifyLogoutResponse implements LogoutResponseContract
{
    public function toResponse($request)
    {
        return redirect(Fortify::redirects('logout', '/'))
            ->with('success', 'Logged out.');
    }
}
