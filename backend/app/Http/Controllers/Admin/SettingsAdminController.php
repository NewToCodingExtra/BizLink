<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAction;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SettingsAdminController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()?->can('users.manage'), 403, 'Admin access only.');

        $settings = [
            'login_rate_limit' => (int) Setting::get('login_rate_limit', 5),
            'report_throttle_per_min' => (int) Setting::get('report_throttle_per_min', 5),
            'comment_throttle_per_min' => (int) Setting::get('comment_throttle_per_min', 10),
            'inquiry_throttle_per_day' => (int) Setting::get('inquiry_throttle_per_day', 20),
            'demo_login_enabled' => (bool) Setting::get('demo_login_enabled', true),
            'registration_open' => (bool) Setting::get('registration_open', true),
            'maintenance_mode' => (bool) Setting::get('maintenance_mode', false),
        ];

        $admins = User::role('Admin')
            ->get(['id', 'name', 'username', 'email', 'avatar', 'created_at'])
            ->map(fn($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'username' => $u->username,
                'email' => $u->email,
                'avatar' => $u->avatar,
                'createdAt' => $u->created_at?->diffForHumans(),
                'isSelf' => $u->id === $request->user()->id,
            ]);

        $dbVersion = '8.0';
        try {
            $dbVersion = DB::select('SELECT VERSION() as v')[0]->v ?? '8.0';
        } catch (\Throwable $e) {
            try {
                $dbVersion = 'SQLite ' . (DB::select('SELECT sqlite_version() as v')[0]->v ?? '');
            } catch (\Throwable $e2) {
                $dbVersion = 'Default';
            }
        }

        $systemInfo = [
            'phpVersion' => PHP_VERSION,
            'laravelVersion' => app()->version(),
            'database' => str_starts_with($dbVersion, 'SQLite') ? $dbVersion : 'MySQL ' . $dbVersion,
            'environment' => app()->environment(),
            'time' => now()->toDateTimeString(),
        ];

        return Inertia::render('Admin/Settings', [
            'settings' => $settings,
            'admins' => $admins,
            'systemInfo' => $systemInfo,
        ]);
    }

    public function update(Request $request)
    {
        abort_unless($request->user()?->can('users.manage'), 403, 'Admin access only.');

        $data = $request->validate([
            'login_rate_limit' => 'nullable|integer|min:1|max:50',
            'report_throttle_per_min' => 'nullable|integer|min:1|max:60',
            'comment_throttle_per_min' => 'nullable|integer|min:1|max:120',
            'inquiry_throttle_per_day' => 'nullable|integer|min:1|max:500',
            'demo_login_enabled' => 'nullable|boolean',
            'registration_open' => 'nullable|boolean',
            'maintenance_mode' => 'nullable|boolean',
        ]);

        foreach ($data as $key => $val) {
            Setting::set($key, $val);
        }

        AdminAction::log(
            adminId: $request->user()->id,
            action: 'setting.update',
            targetType: 'Setting',
            targetId: null,
            reason: 'Platform settings updated',
            meta: $data
        );

        return back()->with('success', 'Settings updated successfully.');
    }

    public function inviteAdmin(Request $request)
    {
        abort_unless($request->user()?->can('users.manage'), 403, 'Admin access only.');

        $data = $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $targetUser = User::where('email', $data['email'])->firstOrFail();

        if ($targetUser->hasRole('Admin')) {
            return back()->with('error', 'User is already an Admin.');
        }

        $targetUser->syncRoles(['Admin']);
        $targetUser->forceFill(['role' => 'admin'])->save();

        AdminAction::log(
            adminId: $request->user()->id,
            action: 'admin.grant',
            targetType: 'User',
            targetId: $targetUser->id,
            reason: "Admin privileges granted by {$request->user()->name}"
        );

        return back()->with('success', "Admin role granted to {$targetUser->name}.");
    }

    public function revokeAdmin(Request $request, User $user)
    {
        abort_unless($request->user()?->can('users.manage'), 403, 'Admin access only.');

        if ($user->id === $request->user()->id) {
            abort(422, 'You cannot revoke your own admin access.');
        }

        $adminCount = User::role('Admin')->count();
        if ($adminCount <= 1) {
            abort(422, 'Cannot revoke the last remaining admin account.');
        }

        $user->syncRoles(['User']);
        $user->forceFill(['role' => 'entrepreneur'])->save();

        AdminAction::log(
            adminId: $request->user()->id,
            action: 'admin.revoke',
            targetType: 'User',
            targetId: $user->id,
            reason: "Admin privileges revoked by {$request->user()->name}"
        );

        return back()->with('success', "Admin access revoked for {$user->name}.");
    }
}
