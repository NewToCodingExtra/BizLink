<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Owner FKs follow the assignment spec: cascadeOnDelete().
 *
 * The earlier hardening pass switched these two to restrictOnDelete(), which
 * is defensible but does not match the required "foreign key constraints using
 * cascadeOnDelete()" checklist. Orphan protection is unaffected: the User
 * model's `deleting` guard still refuses to delete an account that owns
 * posts/stories, so the app layer never triggers this cascade — the DB rule
 * only governs raw deletes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('opportunities', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });
        Schema::table('stories', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('opportunities', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
        Schema::table('stories', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
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
            $table->foreign('user_id')->references('id')->on('users')->restrictOnDelete();
        });
        Schema::table('stories', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->restrictOnDelete();
        });
    }
};
