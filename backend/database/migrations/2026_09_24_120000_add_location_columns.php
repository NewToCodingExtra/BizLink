<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('opportunities', function (Blueprint $table) {
            $table->string('city', 255)->nullable()->after('category');
            $table->string('province', 255)->nullable()->after('city');
            $table->decimal('latitude', 10, 7)->nullable()->after('province');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->index(['latitude', 'longitude'], 'opportunities_lat_lng_index');
        });

        Schema::table('stories', function (Blueprint $table) {
            $table->string('city', 255)->nullable()->after('caption');
            $table->string('province', 255)->nullable()->after('city');
            $table->decimal('latitude', 10, 7)->nullable()->after('province');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->index(['latitude', 'longitude'], 'stories_lat_lng_index');
        });

        Schema::table('preferences', function (Blueprint $table) {
            $table->string('city', 255)->nullable()->after('budget_max');
            $table->string('province', 255)->nullable()->after('city');
            $table->decimal('latitude', 10, 7)->nullable()->after('province');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
        });
    }

    public function down(): void
    {
        Schema::table('opportunities', function (Blueprint $table) {
            $table->dropIndex('opportunities_lat_lng_index');
            $table->dropColumn(['city', 'province', 'latitude', 'longitude']);
        });
        Schema::table('stories', function (Blueprint $table) {
            $table->dropIndex('stories_lat_lng_index');
            $table->dropColumn(['city', 'province', 'latitude', 'longitude']);
        });
        Schema::table('preferences', function (Blueprint $table) {
            $table->dropColumn(['city', 'province', 'latitude', 'longitude']);
        });
    }
};
