<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'opportunities.create',
            'opportunities.update',
            'opportunities.delete',
            'opportunities.verify',
            'comments.moderate',
            'users.manage',
            'inquiries.respond',
        ];
        foreach ($permissions as $p) {
            Permission::firstOrCreate(['name' => $p]);
        }

        Role::firstOrCreate(['name' => 'Admin'])->syncPermissions($permissions);
        Role::firstOrCreate(['name' => 'Manager'])->syncPermissions([
            'opportunities.create', 'opportunities.update', 'opportunities.delete', 'inquiries.respond',
        ]);
        Role::firstOrCreate(['name' => 'User'])->syncPermissions([]);
    }
}
