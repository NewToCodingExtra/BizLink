<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('google_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->text('access_token');
            $table->text('refresh_token')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->string('meet_status', 32)->nullable()->after('insight');
            $table->string('meet_event_id', 255)->nullable()->after('meet_status');
            $table->string('meet_url', 2048)->nullable()->after('meet_event_id');
            $table->timestamp('meet_start_at')->nullable()->after('meet_url');
            $table->timestamp('meet_end_at')->nullable()->after('meet_start_at');
            $table->string('meet_title', 255)->nullable()->after('meet_end_at');
            $table->index(['meet_status', 'meet_end_at']);
            $table->index('meet_event_id');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex(['meet_status', 'meet_end_at']);
            $table->dropIndex(['meet_event_id']);
            $table->dropColumn([
                'meet_status',
                'meet_event_id',
                'meet_url',
                'meet_start_at',
                'meet_end_at',
                'meet_title',
            ]);
        });

        Schema::dropIfExists('google_tokens');
    }
};
