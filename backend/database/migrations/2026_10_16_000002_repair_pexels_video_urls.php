<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('opportunities')
            ->where('video_url', 'like', '%videos.pexels.com%5198159%')
            ->update(['video_url' => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4']);

        DB::table('opportunities')
            ->where('video_url', 'like', '%videos.pexels.com%3196344%')
            ->update(['video_url' => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4']);

        DB::table('opportunities')
            ->where('video_url', 'like', '%videos.pexels.com%')
            ->update(['video_url' => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4']);

        DB::table('stories')
            ->where('media_url', 'like', '%videos.pexels.com%')
            ->update(['media_url' => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // One-way migration: pexels UHD videos caused net::ERR_CACHE_OPERATION_NOT_SUPPORTED in Chrome.
    }
};
