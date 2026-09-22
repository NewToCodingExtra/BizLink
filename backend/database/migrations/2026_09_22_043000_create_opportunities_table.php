<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opportunities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('brand_name');
            $table->string('brand_avatar')->nullable();
            $table->string('brand_id')->nullable();
            $table->string('type')->default('Franchise');
            $table->string('category')->nullable();
            $table->string('headline');
            $table->string('capital_required')->nullable();
            $table->string('roi')->nullable();
            $table->text('description')->nullable();
            $table->string('image', 2048)->nullable();
            $table->string('media_type')->default('image');
            $table->string('video_url', 2048)->nullable();
            $table->boolean('featured')->default(false);
            $table->boolean('verified')->default(false);
            $table->unsignedInteger('likes_count')->default(0);
            $table->unsignedInteger('saves_count')->default(0);
            $table->boolean('is_new')->default(false);
            $table->timestamps();
            $table->index(['type', 'category']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opportunities');
    }
};
