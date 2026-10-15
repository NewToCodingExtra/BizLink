<?php

namespace Database\Seeders;

use App\Models\ReportCategory;
use Illuminate\Database\Seeder;

class ReportCategorySeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            ['key' => 'spam', 'label' => 'Spam / misleading', 'severity' => 20, 'description' => 'Unsolicited promos, repetitive posts, fake offers.'],
            ['key' => 'scam', 'label' => 'Scam / fraud', 'severity' => 70, 'description' => 'Fake investment, phishing, impersonation for money.'],
            ['key' => 'harassment', 'label' => 'Harassment / bullying', 'severity' => 60, 'description' => 'Targeted abuse, threats, intimidation.'],
            ['key' => 'hate', 'label' => 'Hate speech', 'severity' => 85, 'description' => 'Attacks on protected characteristics.'],
            ['key' => 'explicit', 'label' => 'Sexual / explicit', 'severity' => 90, 'description' => 'Nudity or sexual content.'],
            ['key' => 'violence', 'label' => 'Violence / gore', 'severity' => 95, 'description' => 'Glorification or depiction of violence.'],
            ['key' => 'self_harm', 'label' => 'Self-harm', 'severity' => 95, 'description' => 'Self-injury or suicide content. Prioritize.'],
            ['key' => 'copyright', 'label' => 'Copyright / IP', 'severity' => 40, 'description' => 'Stolen photos, video, brand assets.'],
            ['key' => 'other', 'label' => 'Other', 'severity' => 10, 'description' => 'Something else — describe it.'],
        ];

        foreach ($rows as $row) {
            ReportCategory::updateOrCreate(['key' => $row['key']], $row + ['active' => true]);
        }
    }
}
