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
        $brands = User::where('role', 'brand')->get();

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
            // Determine brand_id (e.g. brand-1 to brand-16 based on how it's seeded originally)
            // The original seeder created BrewCraft as brand-1, and others as brand-2 to brand-16
            // We can just extract it from email (e.g. brand@bizlink.ph -> brand-1, glow@bizlink.ph -> brand-2)
            // But we actually don't need exact match to the old ones as long as it's a string, we can just use "brand-{$brand->id}"
            $brandId = 'brand-' . $brand->id;

            // Add 2 Opportunities (Feeds)
            for ($i = 1; $i <= 2; $i++) {
                Opportunity::create([
                    'brand_name' => $brand->name,
                    'brand_avatar' => $brand->avatar,
                    'brand_id' => $brandId,
                    'user_id' => $brand->id,
                    'type' => 'Franchise',
                    'category' => $categories[array_rand($categories)],
                    'headline' => "New Opportunity from {$brand->name} #{$i}",
                    'capital_required' => '₱' . rand(100, 999) . 'K',
                    'roi' => rand(15, 45) . '% ROI',
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

            // Add 2 Stories (Reels)
            for ($j = 1; $j <= 2; $j++) {
                Story::create([
                    'user_id' => $brand->id,
                    'brand_name' => $brand->name,
                    'brand_id' => $brandId,
                    'avatar' => $brand->avatar,
                    'media_url' => $storyPlaceholders[array_rand($storyPlaceholders)],
                    'caption' => "Behind the scenes at {$brand->name} #{$j}",
                    'expires_at' => now()->addHours(rand(12, 24)),
                    'seen' => false,
                ]);
            }
        }
    }
}
