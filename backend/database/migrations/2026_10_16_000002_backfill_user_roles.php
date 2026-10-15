<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // Ensure the roles exist even if the seeder hasn't run yet.
        foreach (['Admin', 'Manager', 'User'] as $name) {
            \Spatie\Permission\Models\Role::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        // Legacy social accounts were created without a Spatie role, which
        // hid the Post button (permission-gated) for them. Heal from the
        // `role` string column: brand/manager -> Manager, admin -> Admin,
        // everything else -> User (entrepreneur).
        User::with('roles')->chunkById(200, function ($users) {
            foreach ($users as $user) {
                if ($user->roles->isNotEmpty()) {
                    continue;
                }
                $role = strtolower(trim((string) ($user->role ?? 'entrepreneur')));
                if (in_array($role, ['brand', 'manager'], true)) {
                    $user->assignRole('Manager');
                    if ($user->role !== 'brand') {
                        $user->forceFill(['role' => 'brand'])->save();
                    }
                } elseif ($role === 'admin') {
                    $user->assignRole('Admin');
                } else {
                    $user->assignRole('User');
                    if (! in_array($user->role, ['entrepreneur', 'brand', 'admin'], true)) {
                        $user->forceFill(['role' => 'entrepreneur'])->save();
                    }
                }
            }
        });
    }

    public function down(): void
    {
        // No rollback: role assignment is additive and safe to keep.
    }
};
