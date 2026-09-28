<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;
use Laravel\Fortify\Fortify;

class FortifyRegisterResponse implements RegisterResponseContract
{
    public function toResponse($request)
    {
        return redirect(Fortify::redirects('register', '/feed'))
            ->with('success', 'Welcome to BizLink!');
    }
}
