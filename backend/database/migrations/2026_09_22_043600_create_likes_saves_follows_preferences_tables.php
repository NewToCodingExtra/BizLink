<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opportunity_user_likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('opportunity_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['user_id', 'opportunity_id']);
        });

        Schema::create('opportunity_user_saves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('opportunity_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['user_id', 'opportunity_id']);
        });

        Schema::create('follows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('brand_id');
            $table->timestamps();
            $table->unique(['user_id', 'brand_id']);
        });

        Schema::create('preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->json('categories')->nullable();
            $table->string('budget_min')->nullable();
            $table->string('budget_max')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('preferences');
        Schema::dropIfExists('follows');
        Schema::dropIfExists('opportunity_user_saves');
        Schema::dropIfExists('opportunity_user_likes');
    }
};
