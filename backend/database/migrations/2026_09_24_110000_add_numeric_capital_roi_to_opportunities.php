<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add numeric columns (nullable during backfill).
        Schema::table('opportunities', function (Blueprint $table) {
            $table->unsignedBigInteger('capital_amount')->nullable()->after('capital_required');
            $table->decimal('roi_percent', 6, 2)->nullable()->after('roi');
        });

        // 2. Backfill from legacy strings ("₱850K", "28% ROI", "₱1.2M").
        $rows = DB::table('opportunities')->select('id', 'capital_required', 'roi')->get();
        foreach ($rows as $r) {
            DB::table('opportunities')->where('id', $r->id)->update([
                'capital_amount' => self::parseCapital($r->capital_required),
                'roi_percent' => self::parseRoi($r->roi),
            ]);
        }

        // 3. New writes go through validation, so legacy strings stay for
        // display fallback but numerics are the source of truth.
    }

    public function down(): void
    {
        Schema::table('opportunities', function (Blueprint $table) {
            $table->dropColumn(['capital_amount', 'roi_percent']);
        });
    }

    public static function parseCapital(?string $value): ?int
    {
        if ($value === null || trim($value) === '') {
            return null;
        }
        if (! preg_match('/[\d,.]+/', trim($value), $m)) {
            return null;
        }
        $num = (float) str_replace(',', '', $m[0]);
        $lower = mb_strtolower(trim($value));
        if (str_contains($lower, 'm')) {
            $num *= 1000000;
        } elseif (str_contains($lower, 'k')) {
            $num *= 1000;
        }
        return (int) round($num);
    }

    public static function parseRoi(?string $value): ?float
    {
        if ($value === null || trim($value) === '') {
            return null;
        }
        if (! preg_match('/[\d,.]+/', trim($value), $m)) {
            return null;
        }
        return (float) str_replace(',', '', $m[0]);
    }
};
