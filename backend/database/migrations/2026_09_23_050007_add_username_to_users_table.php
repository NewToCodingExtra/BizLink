<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username', 50)->nullable()->unique()->after('name');
        });

        // Backfill unique URL-safe usernames for existing rows.
        $reserved = ['me', 'edit', 'login', 'register', 'feed', 'admin', 'api'];
        $taken = [];
        foreach (DB::table('users')->orderBy('id')->get(['id', 'name']) as $row) {
            $base = Str::slug((string) $row->name);
            if ($base === '') {
                $base = 'user';
            }
            $base = substr($base, 0, 40);
            if (in_array($base, $reserved, true)) {
                $base .= '-u';
            }
            $candidate = $base;
            $i = 2;
            while (isset($taken[$candidate]) || DB::table('users')->where('username', $candidate)->exists()) {
                $candidate = substr($base, 0, 45) . '-' . $i;
                $i++;
            }
            $taken[$candidate] = true;
            DB::table('users')->where('id', $row->id)->update(['username' => $candidate]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['username']);
            $table->dropColumn('username');
        });
    }
};
