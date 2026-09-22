<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->unsignedBigInteger('attachment_id')->nullable();
            $table->string('attachment_type')->nullable(); // e.g., 'App\Models\Opportunity' or 'App\Models\Story'
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['attachment_id', 'attachment_type']);
        });
    }
};
