<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        // Platform console account. Idempotent: safe to re-run, never
        // touches an existing password.
        // Email: admin@bizlink.ph / Password: password123
        $admin = User::firstOrCreate(
            ['email' => 'admin@bizlink.ph'],
            [
                'name' => 'Platform Admin',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'avatar' => 'https://i.pravatar.cc/100?img=68',
                'email_verified_at' => now(),
            ]
        );
        $admin->forceFill(['role' => 'admin'])->save();
        $admin->assignRole('Admin');
    }
}
