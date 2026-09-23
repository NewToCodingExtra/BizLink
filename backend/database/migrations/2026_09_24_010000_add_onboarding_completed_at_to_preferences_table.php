<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('preferences', function (Blueprint $table) {
            $table->timestamp('onboarding_completed_at')->nullable()->after('budget_max');
        });

        // Preserve the intent of people who already saved a real preference
        // before the explicit completion flag existed.
        DB::table('preferences')
            ->where(function ($query) {
                $query->whereNotNull('budget_min')
                    ->orWhereNotNull('budget_max')
                    ->orWhereRaw("categories IS NOT NULL AND categories != '[]'");
            })
            ->update(['onboarding_completed_at' => now()]);
    }

    public function down(): void
    {
        Schema::table('preferences', function (Blueprint $table) {
            $table->dropColumn('onboarding_completed_at');
        });
    }
};
