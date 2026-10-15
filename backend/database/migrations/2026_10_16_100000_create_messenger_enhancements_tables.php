<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add reply_to_id to messages
        Schema::table('messages', function (Blueprint $table) {
            $table->foreignId('reply_to_id')->nullable()->after('conversation_id')->constrained('messages')->nullOnDelete();
        });

        // 2. Conversation mutes
        Schema::create('conversation_mutes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['conversation_id', 'user_id']);
        });

        // 3. Conversation reads (read receipts)
        Schema::create('conversation_reads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->unique(['conversation_id', 'user_id']);
        });

        // 4. User blocks
        Schema::create('user_blocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('blocker_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('blocked_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['blocker_id', 'blocked_id']);
        });

        // 5. Link previews cache
        Schema::create('link_previews', function (Blueprint $table) {
            $table->id();
            $table->string('url_hash', 64)->unique();
            $table->text('url');
            $table->string('title', 500)->nullable();
            $table->text('description')->nullable();
            $table->string('image_url', 2048)->nullable();
            $table->string('site_name', 255)->nullable();
            $table->timestamp('fetched_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('link_previews');
        Schema::dropIfExists('user_blocks');
        Schema::dropIfExists('conversation_reads');
        Schema::dropIfExists('conversation_mutes');

        Schema::table('messages', function (Blueprint $table) {
            $table->dropConstrainedForeignId('reply_to_id');
        });
    }
};
