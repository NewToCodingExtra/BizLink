<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('brand_id')->nullable();
            $table->string('brand_name');
            $table->string('avatar')->nullable();
            $table->string('media_url', 2048)->nullable();
            $table->string('caption', 1024)->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('seen')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stories');
    }
};
