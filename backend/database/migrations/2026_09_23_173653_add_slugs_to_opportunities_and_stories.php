<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Opportunity;
use App\Models\Story;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('opportunities', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('id');
        });

        Schema::table('stories', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('id');
        });

        // Backfill slugs for existing records
        Opportunity::chunk(100, function ($opportunities) {
            foreach ($opportunities as $opp) {
                $base = Str::slug($opp->headline ?: $opp->brand_name);
                if (empty($base)) $base = 'post';
                $opp->slug = $base . '-' . $opp->id;
                $opp->save();
            }
        });

        Story::chunk(100, function ($stories) {
            foreach ($stories as $story) {
                $base = Str::slug($story->brand_name);
                if (empty($base)) $base = 'story';
                $story->slug = $base . '-' . $story->id;
                $story->save();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('opportunities', function (Blueprint $table) {
            $table->dropColumn('slug');
        });

        Schema::table('stories', function (Blueprint $table) {
            $table->dropColumn('slug');
        });
    }
};
