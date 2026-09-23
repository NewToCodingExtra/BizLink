<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            $table->foreignId('parent_id')->nullable()->after('opportunity_id')
                ->constrained('comments')->cascadeOnDelete();
            $table->string('media_url', 2048)->nullable()->after('text');
            $table->string('media_type', 32)->nullable()->after('media_url');
            $table->timestamp('edited_at')->nullable()->after('is_seller_reply');
            $table->softDeletes()->after('updated_at');
            $table->index(['opportunity_id', 'parent_id', 'created_at']);
        });

        Schema::create('comment_reactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('comment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('emoji', 16);
            $table->timestamps();
            $table->unique(['comment_id', 'user_id', 'emoji']);
        });

        Schema::create('comment_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('comment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('reason', 32);
            $table->timestamps();
            $table->unique(['comment_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comment_reports');
        Schema::dropIfExists('comment_reactions');
        Schema::table('comments', function (Blueprint $table) {
            $table->dropIndex(['opportunity_id', 'parent_id', 'created_at']);
            $table->dropSoftDeletes();
            $table->dropColumn(['edited_at', 'media_type', 'media_url']);
            $table->dropConstrainedForeignId('parent_id');
        });
    }
};
