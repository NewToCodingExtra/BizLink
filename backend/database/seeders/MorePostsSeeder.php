<?php

namespace Database\Seeders;

use App\Models\Opportunity;
use App\Models\Story;
use App\Models\User;
use Illuminate\Database\Seeder;

class MorePostsSeeder extends Seeder
{
    public function run(): void
    {
        // Fetch all brand users, excluding the entrepreneur/demo accounts and any manual/social logins
        $brands = User::where('role', 'brand')->orderBy('id')->get();
        if ($brands->isEmpty()) {
            $this->command->warn('MorePostsSeeder: no brand users found, skipping.');
            return;
        }

        $categories = ['Food & Beverage', 'Beauty & Wellness', 'Health & Fitness', 'Services & Logistics', 'Education', 'Fashion & Apparel', 'Home & Living'];

        $imagePlaceholders = [
            'https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?w=800&q=80&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=800&q=80&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1507914372368-b2b50c40f096?w=800&q=80&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1555529771-835f59fc5efe?w=800&q=80&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80&auto=format&fit=crop',
        ];

        $storyPlaceholders = [
            'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1080&q=80&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=1080&q=80&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1080&q=80&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1080&q=80&auto=format&fit=crop',
        ];

        foreach ($brands as $index => $brand) {
            // Authoritative scheme: brand-{userId}, same as OpportunityController::store.
            // (Old rows used logical brand-1..16 / drifted pairs; repair seeder heals those.)
            $brandId = 'brand-' . $brand->id;

            // Add 2 Opportunities (Feeds) — firstOrCreate by headline so reseeds never duplicate.
            for ($i = 1; $i <= 2; $i++) {
                $headline = "New Opportunity from {$brand->name} #{$i}";
                $capitalAmount = rand(100, 999) * 1000;
                $roiPercent = rand(15, 45);
                Opportunity::firstOrCreate(['headline' => $headline], [
                    'brand_name' => $brand->name,
                    'brand_avatar' => $brand->avatar,
                    'brand_id' => $brandId,
                    'user_id' => $brand->id,
                    'type' => 'Franchise',
                    'category' => $categories[array_rand($categories)],
                    'headline' => $headline,
                    'capital_required' => '₱' . ($capitalAmount / 1000) . 'K',
                    'capital_amount' => $capitalAmount,
                    'roi' => $roiPercent . '% ROI',
                    'roi_percent' => $roiPercent,
                    'description' => "This is a brand new opportunity added to {$brand->name}'s feed. Take advantage of our scalable business model today!",
                    'image' => $imagePlaceholders[array_rand($imagePlaceholders)],
                    'media_type' => 'image',
                    'video_url' => null,
                    'featured' => (bool)rand(0, 1),
                    'verified' => true,
                    'likes_count' => rand(10, 500),
                    'saves_count' => rand(5, 100),
                    'is_new' => true,
                ]);
            }

            // Add 2 Stories (Reels) — firstOrCreate by caption so reseeds never duplicate.
            for ($j = 1; $j <= 2; $j++) {
                $caption = "Behind the scenes at {$brand->name} #{$j}";
                Story::firstOrCreate(['brand_name' => $brand->name, 'caption' => $caption], [
                    'user_id' => $brand->id,
                    'brand_name' => $brand->name,
                    'brand_id' => $brandId,
                    'avatar' => $brand->avatar,
                    'media_url' => $storyPlaceholders[array_rand($storyPlaceholders)],
                    'caption' => $caption,
                    'expires_at' => now()->addHours(rand(12, 24)),
                    'seen' => false,
                ]);
            }
        }
    }
}
