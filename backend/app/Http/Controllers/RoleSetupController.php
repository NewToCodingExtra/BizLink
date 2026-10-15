<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * First-run role picker for brand-new social accounts. Shown ONLY when the
 * session carries `pending_role_setup` (set by SocialAuthController for new
 * OAuth users). Existing users never see this page.
 */
class RoleSetupController extends Controller
{
    public function show(Request $request)
    {
        if (! $request->session()->get('pending_role_setup')) {
            return redirect('/feed');
        }

        $provider = $request->session()->get('pending_role_provider', 'social');

        return Inertia::render('Welcome/Role', [
            'provider' => $provider,
            'name' => $request->user()?->name,
        ]);
    }

    public function store(Request $request)
    {
        if (! $request->session()->get('pending_role_setup')) {
            return redirect('/feed');
        }

        $data = $request->validate([
            'role' => 'required|string|in:entrepreneur,brand',
        ]);

        $user = $request->user();
        $user->forceFill(['role' => $data['role']])->save();
        $user->syncRoles([$data['role'] === 'brand' ? 'Manager' : 'User']);

        $request->session()->forget(['pending_role_setup', 'pending_role_provider']);

        $label = $data['role'] === 'brand' ? 'Brand' : 'Entrepreneur';
        return redirect('/feed')->with('success', "Welcome to BizLink, {$user->name}! You're set up as {$label}.");
    }
}
