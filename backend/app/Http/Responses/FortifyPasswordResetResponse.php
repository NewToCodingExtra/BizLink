<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\PasswordResetResponse as PasswordResetResponseContract;
use Laravel\Fortify\Fortify;

class FortifyPasswordResetResponse implements PasswordResetResponseContract
{
    public function toResponse($request)
    {
        return redirect('/login')
            ->with('success', 'Password reset. Log in with your new password.');
    }
}
