<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\PasswordResetLinkRequestResponse as PasswordResetLinkRequestResponseContract;
use Laravel\Fortify\Fortify;

class FortifyPasswordResetLinkResponse implements PasswordResetLinkRequestResponseContract
{
    public function toResponse($request)
    {
        return back()->with('success', 'If an account exists, a reset link was sent.');
    }
}
