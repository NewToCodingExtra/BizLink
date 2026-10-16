<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\PasswordResetLinkRequestResponse as PasswordResetLinkRequestResponseContract;
use Laravel\Fortify\Fortify;

class FortifyPasswordResetLinkResponse implements PasswordResetLinkRequestResponseContract
{
    public function toResponse($request)
    {
        $resetUrl = session('reset_url');
        $msg = $resetUrl
            ? 'Reset link generated. Click below to set a new password.'
            : 'If an account exists, a reset link was sent.';

        return back()
            ->with('success', $msg)
            ->with('reset_url', $resetUrl);
    }
}
