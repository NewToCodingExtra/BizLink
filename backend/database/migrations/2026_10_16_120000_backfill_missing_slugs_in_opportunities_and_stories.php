<?php

use App\Models\Opportunity;
use App\Models\Story;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Backfills all missing, empty, or 'null' slugs for Opportunities and Stories,
     * as well as missing usernames for Users.
     */
    public function up(): void
    {
        if (Schema::hasTable('opportunities') && Schema::hasColumn('opportunities', 'slug')) {
            Opportunity::whereNull('slug')
                ->orWhere('slug', '')
                ->orWhere('slug', 'null')
                ->chunkById(100, function ($opportunities) {
                    foreach ($opportunities as $opp) {
                        $base = Str::slug($opp->headline ?: ($opp->brand_name ?: 'post'));
                        if (empty($base)) {
                            $base = 'post';
                        }
                        $opp->slug = $base . '-' . $opp->id;
                        $opp->saveQuietly();
                    }
                });
        }

        if (Schema::hasTable('stories') && Schema::hasColumn('stories', 'slug')) {
            Story::whereNull('slug')
                ->orWhere('slug', '')
                ->orWhere('slug', 'null')
                ->chunkById(100, function ($stories) {
                    foreach ($stories as $story) {
                        $base = Str::slug($story->brand_name ?: 'story');
                        if (empty($base)) {
                            $base = 'story';
                        }
                        $story->slug = $base . '-' . $story->id;
                        $story->saveQuietly();
                    }
                });
        }

        if (Schema::hasTable('users') && Schema::hasColumn('users', 'username')) {
            User::whereNull('username')
                ->orWhere('username', '')
                ->chunkById(100, function ($users) {
                    foreach ($users as $user) {
                        $user->username = User::makeUsername($user->name ?? 'user', $user->id);
                        $user->saveQuietly();
                    }
                });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Slugs can remain populated safely
    }
};
