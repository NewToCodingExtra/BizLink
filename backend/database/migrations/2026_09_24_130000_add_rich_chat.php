<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('polls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('question', 255);
            $table->json('options');
            $table->timestamp('closes_at')->nullable();
            $table->boolean('closed')->default(false);
            $table->timestamps();
            $table->index(['conversation_id', 'closed']);
        });

        Schema::create('poll_votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('poll_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('option_index');
            $table->timestamps();
            $table->unique(['poll_id', 'user_id']);
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->string('media_url', 2048)->nullable()->after('text');
            $table->string('media_type', 32)->nullable()->after('media_url');
            $table->string('media_name', 255)->nullable()->after('media_type');
            $table->unsignedBigInteger('media_size')->nullable()->after('media_name');
            $table->foreignId('poll_id')->nullable()->after('attachment_type')->constrained('polls')->nullOnDelete();
            $table->json('insight')->nullable()->after('poll_id');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropConstrainedForeignId('poll_id');
            $table->dropColumn(['media_url', 'media_type', 'media_name', 'media_size', 'insight']);
        });
        Schema::dropIfExists('poll_votes');
        Schema::dropIfExists('polls');
    }
};
