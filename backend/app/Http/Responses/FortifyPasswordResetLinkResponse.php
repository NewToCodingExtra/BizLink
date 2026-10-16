<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\SuccessfulPasswordResetLinkRequestResponse as SuccessfulPasswordResetLinkRequestResponseContract;
use Laravel\Fortify\Fortify;

class FortifyPasswordResetLinkResponse implements SuccessfulPasswordResetLinkRequestResponseContract
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
