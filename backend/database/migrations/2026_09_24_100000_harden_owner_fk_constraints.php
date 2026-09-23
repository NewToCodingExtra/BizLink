<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Guard: never harden while orphans still exist.
        $oppsNull = DB::table('opportunities')->whereNull('user_id')->count();
        $storiesNull = DB::table('stories')->whereNull('user_id')->count();
        if ($oppsNull > 0 || $storiesNull > 0) {
            throw new RuntimeException(
                "Refusing to harden FKs with orphans present: opportunities.user_id NULL={$oppsNull}, stories.user_id NULL={$storiesNull}. Run RepairPostOwnersSeeder first."
            );
        }

        Schema::table('opportunities', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });
        Schema::table('stories', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('opportunities', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->restrictOnDelete();
        });
        Schema::table('stories', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('opportunities', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });
        Schema::table('stories', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });
        Schema::table('opportunities', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->change();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });
        Schema::table('stories', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->change();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });
    }
};
