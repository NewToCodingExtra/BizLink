<?php

namespace Database\Seeders;

use App\Models\AppNotification;
use App\Models\Comment;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Opportunity;
use App\Models\Story;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $entrepreneur = User::firstOrCreate(
            ['email' => 'demo@bizlink.ph'],
            [
                'name' => 'Demo Entrepreneur',
                'password' => Hash::make('password123'),
                'avatar' => 'https://i.pravatar.cc/100?img=12',
                'bio' => 'Aspiring franchise owner exploring food and service concepts across Luzon.',
                'role' => 'entrepreneur',
                'email_verified_at' => now(),
            ]
        );

        $brandOwner = User::firstOrCreate(
            ['email' => 'brand@bizlink.ph'],
            [
                'name' => 'BrewCraft Coffee',
                'password' => Hash::make('password123'),
                'avatar' => 'https://i.pravatar.cc/100?img=11',
                'bio' => 'Specialty coffee franchise roasting single-origin Benguet beans since 2019.',
                'role' => 'brand',
                'email_verified_at' => now(),
            ]
        );

        $brandUsers = ['brand@bizlink.ph' => $brandOwner];
        $brandAccounts = [
            'brand-2' => ['Glow Skin Wholesale', 'glow@bizlink.ph', 'https://i.pravatar.cc/100?img=32'],
            'brand-3' => ['FitForge Gym', 'fitforge@bizlink.ph', 'https://i.pravatar.cc/100?img=15'],
            'brand-4' => ['ParcelGo Logistics', 'parcelgo@bizlink.ph', 'https://i.pravatar.cc/100?img=67'],
            'brand-5' => ['TastyBox Meals', 'tastybox@bizlink.ph', 'https://i.pravatar.cc/100?img=23'],
            'brand-6' => ['EduSpark Learning', 'eduspark@bizlink.ph', 'https://i.pravatar.cc/100?img=48'],
            'brand-7' => ['UrbanThread', 'urbanthread@bizlink.ph', 'https://i.pravatar.cc/100?img=19'],
            'brand-8' => ['AquaPure Water', 'aquapure@bizlink.ph', 'https://i.pravatar.cc/100?img=68'],
            'brand-9' => ['Suds&Spin Laundry', 'sudsspin@bizlink.ph', 'https://i.pravatar.cc/100?img=20'],
            'brand-10' => ['LashLuxe Salon', 'lashluxe@bizlink.ph', 'https://i.pravatar.cc/100?img=25'],
            'brand-11' => ['MilkTeaGo', 'milkteago@bizlink.ph', 'https://i.pravatar.cc/100?img=29'],
            'brand-12' => ['BuildRight Hardware', 'buildright@bizlink.ph', 'https://i.pravatar.cc/100?img=36'],
            'brand-13' => ['MediPlus Pharmacy', 'mediplus@bizlink.ph', 'https://i.pravatar.cc/100?img=41'],
            'brand-14' => ['SparkleWash Auto', 'sparklewash@bizlink.ph', 'https://i.pravatar.cc/100?img=47'],
            'brand-15' => ['CrumbCakes Bakery', 'crumbcakes@bizlink.ph', 'https://i.pravatar.cc/100?img=53'],
            'brand-16' => ['PrintFast Hub', 'printfast@bizlink.ph', 'https://i.pravatar.cc/100?img=59'],
        ];

        $brandBios = [
            'brand-2' => 'Direct K-beauty importer serving 2,000+ online sellers nationwide.',
            'brand-3' => 'Boutique fitness chain with 12 branches and a 90% retention rate.',
            'brand-4' => 'Nationwide last-mile network built for SME e-commerce.',
            'brand-5' => 'HACCP-certified cloud kitchen feeding Metro Manila offices daily.',
            'brand-6' => 'STEM and literacy programs trusted by 5,000+ parents.',
            'brand-7' => 'Manila streetwear label dropping limited runs monthly.',
            'brand-8' => 'Purified water stations serving 40 barangays and counting.',
            'brand-9' => 'Coinless laundromats beside dorms and condos across the metro.',
            'brand-10' => 'Premium lash and nail studios with certified artists.',
            'brand-11' => 'Milk tea kiosks pouring 10,000 cups a day nationwide.',
            'brand-12' => 'Contractor-priced hardware depot for provincial builders.',
            'brand-13' => 'Community drugstores with licensed pharmacists on every shift.',
            'brand-14' => 'Water-efficient car wash bays with fleet contracts.',
            'brand-15' => 'Overnight bakery commissary supplying cafes before sunrise.',
            'brand-16' => 'Rush printing hub for schools and business districts.',
        ];

        foreach ($brandAccounts as $brandId => [$name, $email, $avatar]) {
            $brandUsers[$brandId] = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'password' => Hash::make('password123'),
                    'avatar' => $avatar,
                    'bio' => $brandBios[$brandId] ?? null,
                    'role' => 'brand',
                    'email_verified_at' => now(),
                ]
            );
        }
        $brandUsers['brand-1'] = $brandOwner;

        $opportunities = [
            [
                'brand_name' => 'BrewCraft Coffee',
                'brand_avatar' => 'https://i.pravatar.cc/100?img=11',
                'brand_id' => 'brand-1',
                'type' => 'Franchise',
                'category' => 'Food & Beverage',
                'headline' => 'Premium Coffee Franchise — High Foot Traffic Locations',
                'capital_required' => '₱850K',
                'roi' => '28% annual ROI',
                'description' => 'Own a BrewCraft outlet in a prime mall location. Full training, supply chain and marketing support included. Low overhead, proven 3-year revenue track record.',
                'image' => 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80&auto=format&fit=crop',
                'media_type' => 'image',
                'video_url' => null,
                'featured' => true,
                'verified' => true,
                'likes_count' => 142,
                'saves_count' => 38,
                'is_new' => true,
            ],
            [
                'brand_name' => 'Glow Skin Wholesale',
                'brand_avatar' => 'https://i.pravatar.cc/100?img=32',
                'brand_id' => 'brand-2',
                'type' => 'Wholesale',
                'category' => 'Beauty & Wellness',
                'headline' => 'K-Beauty Wholesale Hub — 60% Margin Direct from Korea',
                'capital_required' => '₱320K',
                'roi' => '60% margin',
                'description' => 'Access 200+ K-beauty SKUs at wholesale pricing. Ideal for online sellers and beauty clinics. MOQ-friendly and COD nationwide.',
                'image' => 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80&auto=format&fit=crop',
                'media_type' => 'image',
                'video_url' => null,
                'featured' => false,
                'verified' => true,
                'likes_count' => 89,
                'saves_count' => 21,
                'is_new' => true,
            ],
            [
                'brand_name' => 'FitForge Gym',
                'brand_avatar' => 'https://i.pravatar.cc/100?img=15',
                'brand_id' => 'brand-3',
                'type' => 'Franchise',
                'category' => 'Health & Fitness',
                'headline' => 'Boutique Fitness Franchise with Recurring Membership Model',
                'capital_required' => '₱1.2M',
                'roi' => '22% annual ROI',
                'description' => '24/7 access model, app-driven member retention and proven class programming. Includes equipment bundle and 6-week founder immersion.',
                'image' => 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80&auto=format&fit=crop',
                'media_type' => 'video',
                'video_url' => 'https://videos.pexels.com/video-files/5310859/5310859-uhd_2560_1440_25fps.mp4',
                'featured' => true,
                'verified' => true,
                'likes_count' => 210,
                'saves_count' => 54,
                'is_new' => false,
            ],
            [
                'brand_name' => 'ParcelGo Logistics',
                'brand_avatar' => 'https://i.pravatar.cc/100?img=67',
                'brand_id' => 'brand-4',
                'type' => 'Resell',
                'category' => 'Services & Logistics',
                'headline' => 'Last-Mile Delivery Reseller — Nationwide Network Access',
                'capital_required' => '₱180K',
                'roi' => '35% per parcel',
                'description' => 'Resell ParcelGo delivery slots to SMEs. No warehouse needed — tech platform provided. Start with as low as one rider route.',
                'image' => 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80&auto=format&fit=crop',
                'media_type' => 'image',
                'video_url' => null,
                'featured' => false,
                'verified' => false,
                'likes_count' => 46,
                'saves_count' => 11,
                'is_new' => true,
            ],
            [
                'brand_name' => 'TastyBox Meals',
                'brand_avatar' => 'https://i.pravatar.cc/100?img=23',
                'brand_id' => 'brand-5',
                'type' => 'Wholesale',
                'category' => 'Food & Beverage',
                'headline' => 'Cloud Kitchen Wholesale — Ready-to-Heat Meal Packs',
                'capital_required' => '₱250K',
                'roi' => '45% margin',
                'description' => 'Supply offices and canteens with chef-crafted frozen meals. Central kitchen support and HACCP-certified production.',
                'image' => 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80&auto=format&fit=crop',
                'media_type' => 'image',
                'video_url' => null,
                'featured' => false,
                'verified' => true,
                'likes_count' => 73,
                'saves_count' => 19,
                'is_new' => false,
            ],
            [
                'brand_name' => 'EduSpark Learning',
                'brand_avatar' => 'https://i.pravatar.cc/100?img=48',
                'brand_id' => 'brand-6',
                'type' => 'Franchise',
                'category' => 'Education',
                'headline' => 'After-School Learning Center — Proven Curriculum',
                'capital_required' => '₱600K',
                'roi' => '30% annual ROI',
                'description' => 'Literacy and STEM programs for ages 4–12. Teacher training included. High renewal rate and parent referral engine.',
                'image' => 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80&auto=format&fit=crop',
                'media_type' => 'video',
                'video_url' => 'https://videos.pexels.com/video-files/5198159/5198159-uhd_2560_1440_25fps.mp4',
                'featured' => true,
                'verified' => true,
                'likes_count' => 118,
                'saves_count' => 27,
                'is_new' => true,
            ],
            [
                'brand_name' => 'UrbanThread',
                'brand_avatar' => 'https://i.pravatar.cc/100?img=19',
                'brand_id' => 'brand-7',
                'type' => 'Resell',
                'category' => 'Fashion & Apparel',
                'headline' => 'Streetwear Resell Partnership — Limited Drops Access',
                'capital_required' => '₱400K',
                'roi' => '50% margin',
                'description' => 'Get early access to limited streetwear drops. Consignment model available — pay only after sold. Ideal for TikTok sellers.',
                'image' => 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=800&q=80&auto=format&fit=crop',
                'media_type' => 'image',
                'video_url' => null,
                'featured' => false,
                'verified' => true,
                'likes_count' => 165,
                'saves_count' => 42,
                'is_new' => false,
            ],
            [
                'brand_name' => 'AquaPure Water',
                'brand_avatar' => 'https://i.pravatar.cc/100?img=68',
                'brand_id' => 'brand-8',
                'type' => 'Franchise',
                'category' => 'Services & Logistics',
                'headline' => 'Water Refilling Station Franchise — Essential Demand',
                'capital_required' => '₱350K',
                'roi' => '25% annual ROI',
                'description' => 'Set up in barangay centers with guaranteed catchment. Includes filtration system, training and DTI assistance.',
                'image' => 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80&auto=format&fit=crop',
                'media_type' => 'image',
                'video_url' => null,
                'featured' => false,
                'verified' => false,
                'likes_count' => 52,
                'saves_count' => 14,
                'is_new' => true,
            ],
            [
                'brand_name' => 'Suds&Spin Laundry',
                'brand_avatar' => 'https://i.pravatar.cc/100?img=20',
                'brand_id' => 'brand-9',
                'type' => 'Franchise',
                'category' => 'Services & Logistics',
                'headline' => 'Self-Service Laundromat with App Payments — Daily Cash Flow',
                'capital_required' => '₱280K',
                'roi' => '32% annual ROI',
                'description' => 'Coinless machines with GCash and app payments. Site selection, installation and laundry-ops training included. Ideal beside dorms and condos.',
                'image' => 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80&auto=format&fit=crop',
                'media_type' => 'image',
                'video_url' => null,
                'featured' => false,
                'verified' => true,
                'likes_count' => 64,
                'saves_count' => 17,
                'is_new' => true,
            ],
            [
                'brand_name' => 'LashLuxe Salon',
                'brand_avatar' => 'https://i.pravatar.cc/100?img=25',
                'brand_id' => 'brand-10',
                'type' => 'Franchise',
                'category' => 'Beauty & Wellness',
                'headline' => 'Lash and Nail Studio Franchise — Booked-Out Weekends',
                'capital_required' => '₱450K',
                'roi' => '35% annual ROI',
                'description' => 'Premium lash and nail services with certified artist training. POS booking system and grand-opening marketing blitz included.',
                'image' => 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80&auto=format&fit=crop',
                'media_type' => 'image',
                'video_url' => null,
                'featured' => false,
                'verified' => true,
                'likes_count' => 97,
                'saves_count' => 25,
                'is_new' => true,
            ],
            [
                'brand_name' => 'MilkTeaGo',
                'brand_avatar' => 'https://i.pravatar.cc/100?img=29',
                'brand_id' => 'brand-11',
                'type' => 'Franchise',
                'category' => 'Food & Beverage',
                'headline' => 'Milk Tea Kiosk Franchise — 40% Margin, 15 sqm Only',
                'capital_required' => '₱380K',
                'roi' => '40% margin',
                'description' => 'High-traffic kiosk format with 25 flavors and seasonal drops. Complete cart setup, crew training and opening inventory in one package.',
                'image' => 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80&auto=format&fit=crop',
                'media_type' => 'video',
                'video_url' => 'https://videos.pexels.com/video-files/3196344/3196344-uhd_2560_1440_25fps.mp4',
                'featured' => true,
                'verified' => true,
                'likes_count' => 188,
                'saves_count' => 47,
                'is_new' => true,
            ],
            [
                'brand_name' => 'BuildRight Hardware',
                'brand_avatar' => 'https://i.pravatar.cc/100?img=36',
                'brand_id' => 'brand-12',
                'type' => 'Wholesale',
                'category' => 'Home & Living',
                'headline' => 'Hardware Wholesale Depot — Contractor Pricing Direct',
                'capital_required' => '₱500K',
                'roi' => '38% margin',
                'description' => 'Cement, steel, paints and fixtures at contractor pricing. Delivery fleet access and volume rebates for provincial resellers.',
                'image' => 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80&auto=format&fit=crop',
                'media_type' => 'image',
                'video_url' => null,
                'featured' => false,
                'verified' => true,
                'likes_count' => 58,
                'saves_count' => 13,
                'is_new' => true,
            ],
            [
                'brand_name' => 'MediPlus Pharmacy',
                'brand_avatar' => 'https://i.pravatar.cc/100?img=41',
                'brand_id' => 'brand-13',
                'type' => 'Franchise',
                'category' => 'Health & Fitness',
                'headline' => 'Community Drugstore Franchise — Recession-Proof Demand',
                'capital_required' => '₱900K',
                'roi' => '26% annual ROI',
                'description' => 'FDA assistance, pharmacist staffing pool and generics supply chain. Layout and licensing support from site search to opening day.',
                'image' => 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800&q=80&auto=format&fit=crop',
                'media_type' => 'image',
                'video_url' => null,
                'featured' => false,
                'verified' => true,
                'likes_count' => 81,
                'saves_count' => 22,
                'is_new' => false,
            ],
            [
                'brand_name' => 'SparkleWash Auto',
                'brand_avatar' => 'https://i.pravatar.cc/100?img=47',
                'brand_id' => 'brand-14',
                'type' => 'Franchise',
                'category' => 'Services & Logistics',
                'headline' => 'Car Wash and Detailing Franchise — Fleet Contracts Included',
                'capital_required' => '₱220K',
                'roi' => '33% annual ROI',
                'description' => 'Water-efficient wash bays plus premium detailing packages. Launch with two pre-signed fleet maintenance contracts in your area.',
                'image' => 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80&auto=format&fit=crop',
                'media_type' => 'image',
                'video_url' => null,
                'featured' => false,
                'verified' => false,
                'likes_count' => 43,
                'saves_count' => 9,
                'is_new' => true,
            ],
            [
                'brand_name' => 'CrumbCakes Bakery',
                'brand_avatar' => 'https://i.pravatar.cc/100?img=53',
                'brand_id' => 'brand-15',
                'type' => 'Wholesale',
                'category' => 'Food & Beverage',
                'headline' => 'Bakery Wholesale — Daily Bread Supply for Cafes and Offices',
                'capital_required' => '₱200K',
                'roi' => '48% margin',
                'description' => 'Overnight-baked pandesal, cakes and pastries delivered before 6AM. Commissary partnership with no oven investment required.',
                'image' => 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80&auto=format&fit=crop',
                'media_type' => 'image',
                'video_url' => null,
                'featured' => false,
                'verified' => true,
                'likes_count' => 112,
                'saves_count' => 29,
                'is_new' => true,
            ],
            [
                'brand_name' => 'PrintFast Hub',
                'brand_avatar' => 'https://i.pravatar.cc/100?img=59',
                'brand_id' => 'brand-16',
                'type' => 'Resell',
                'category' => 'Services & Logistics',
                'headline' => 'Print and Copy Reseller — School and Office Accounts Ready',
                'capital_required' => '₱150K',
                'roi' => '42% per job',
                'description' => 'Resell rush printing, binding and large-format jobs through our production hub. Ideal near universities and business districts.',
                'image' => 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80&auto=format&fit=crop',
                'media_type' => 'image',
                'video_url' => null,
                'featured' => false,
                'verified' => false,
                'likes_count' => 37,
                'saves_count' => 8,
                'is_new' => true,
            ],
        ];

        $oppModels = [];
        foreach ($opportunities as $attrs) {
            $owner = $brandUsers[$attrs['brand_id']] ?? $brandOwner;
            $opp = Opportunity::firstOrCreate(
                ['headline' => $attrs['headline']],
                array_merge($attrs, ['user_id' => $owner->id])
            );
            if ($opp->user_id !== $owner->id) {
                $opp->update(['user_id' => $owner->id, 'brand_avatar' => $owner->avatar]);
            }
            $oppModels[] = $opp->fresh();
        }

        $byHeadline = [];
        foreach ($oppModels as $m) {
            $byHeadline[$m->headline] = $m;
        }

        $comments = [
            ['headline' => 'Premium Coffee Franchise — High Foot Traffic Locations', 'author' => 'Mara Reyes', 'avatar' => 'https://i.pravatar.cc/100?img=5', 'text' => 'What is the typical payback period for the ₱850K?', 'seller' => false, 'brand' => null],
            ['headline' => 'Premium Coffee Franchise — High Foot Traffic Locations', 'author' => 'BrewCraft Coffee', 'avatar' => 'https://i.pravatar.cc/100?img=11', 'text' => 'Hi Mara — average payback is 18–22 months based on our Makati & QC branches. Happy to share P&L on inquiry.', 'seller' => true, 'brand' => 'brand-1'],
            ['headline' => 'K-Beauty Wholesale Hub — 60% Margin Direct from Korea', 'author' => 'Jae Park', 'avatar' => 'https://i.pravatar.cc/100?img=8', 'text' => 'Is COD available for Visayas?', 'seller' => false, 'brand' => null],
            ['headline' => 'Boutique Fitness Franchise with Recurring Membership Model', 'author' => 'FitForge Gym', 'avatar' => 'https://i.pravatar.cc/100?img=15', 'text' => 'Launch promo: waived franchise fee for first 5 Mindanao partners this quarter.', 'seller' => true, 'brand' => 'brand-3'],
            ['headline' => 'Cloud Kitchen Wholesale — Ready-to-Heat Meal Packs', 'author' => 'Carlo Tan', 'avatar' => 'https://i.pravatar.cc/100?img=33', 'text' => 'Do meals have Halal certification?', 'seller' => false, 'brand' => null],
            ['headline' => 'Milk Tea Kiosk Franchise — 40% Margin, 15 sqm Only', 'author' => 'Sofia Lim', 'avatar' => 'https://i.pravatar.cc/100?img=16', 'text' => 'Is the cart solar-ready for night markets?', 'seller' => false, 'brand' => null],
            ['headline' => 'Milk Tea Kiosk Franchise — 40% Margin, 15 sqm Only', 'author' => 'MilkTeaGo', 'avatar' => 'https://i.pravatar.cc/100?img=29', 'text' => 'Yes — every cart ships with a solar battery pack for 8-hour night-market runs.', 'seller' => true, 'brand' => 'brand-11'],
            ['headline' => 'Lash and Nail Studio Franchise — Booked-Out Weekends', 'author' => 'Bianca Cruz', 'avatar' => 'https://i.pravatar.cc/100?img=44', 'text' => 'How long is artist certification?', 'seller' => false, 'brand' => null],
            ['headline' => 'Lash and Nail Studio Franchise — Booked-Out Weekends', 'author' => 'LashLuxe Salon', 'avatar' => 'https://i.pravatar.cc/100?img=25', 'text' => 'Three weeks full-time, including live-model practice and hygiene audit.', 'seller' => true, 'brand' => 'brand-10'],
            ['headline' => 'Bakery Wholesale — Daily Bread Supply for Cafes and Offices', 'author' => 'Ramon Uy', 'avatar' => 'https://i.pravatar.cc/100?img=51', 'text' => 'What time is the earliest Bulacan delivery?', 'seller' => false, 'brand' => null],
        ];

        foreach ($comments as $c) {
            $opp = $byHeadline[$c['headline']] ?? null;
            if (!$opp) {
                continue;
            }
            $commentUser = $c['brand'] ? ($brandUsers[$c['brand']] ?? $entrepreneur) : $entrepreneur;
            Comment::firstOrCreate(
                ['opportunity_id' => $opp->id, 'author' => $c['author'], 'text' => $c['text']],
                [
                    'user_id' => $commentUser->id,
                    'avatar' => $c['avatar'],
                    'is_seller_reply' => $c['seller'],
                ]
            );
        }

        $stories = [
            ['brand_id' => 'brand-1', 'brand_name' => 'BrewCraft', 'avatar' => 'https://i.pravatar.cc/100?img=11', 'media_url' => 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1080&q=80&auto=format&fit=crop', 'caption' => 'New BGC flagship — 40 seats, opening next month', 'hours' => 20, 'seen' => false],
            ['brand_id' => 'brand-2', 'brand_name' => 'Glow Skin', 'avatar' => 'https://i.pravatar.cc/100?img=32', 'media_url' => 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1080&q=80&auto=format&fit=crop', 'caption' => 'Fresh K-beauty drop: 30 new SKUs', 'hours' => 18, 'seen' => false],
            ['brand_id' => 'brand-3', 'brand_name' => 'FitForge', 'avatar' => 'https://i.pravatar.cc/100?img=15', 'media_url' => 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1080&q=80&auto=format&fit=crop', 'caption' => 'Founder session live at 6PM', 'hours' => 22, 'seen' => false],
            ['brand_id' => 'brand-6', 'brand_name' => 'EduSpark', 'avatar' => 'https://i.pravatar.cc/100?img=48', 'media_url' => 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1080&q=80&auto=format&fit=crop', 'caption' => 'New STEM module preview', 'hours' => 12, 'seen' => true],
            ['brand_id' => 'brand-7', 'brand_name' => 'UrbanThread', 'avatar' => 'https://i.pravatar.cc/100?img=19', 'media_url' => 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1080&q=80&auto=format&fit=crop', 'caption' => 'Limited drop — 12 hours only', 'hours' => 10, 'seen' => false],
            ['brand_id' => 'brand-11', 'brand_name' => 'MilkTeaGo', 'avatar' => 'https://i.pravatar.cc/100?img=29', 'media_url' => 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1080&q=80&auto=format&fit=crop', 'caption' => 'Ube halaya series drops Friday', 'hours' => 14, 'seen' => false],
            ['brand_id' => 'brand-10', 'brand_name' => 'LashLuxe', 'avatar' => 'https://i.pravatar.cc/100?img=25', 'media_url' => 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1080&q=80&auto=format&fit=crop', 'caption' => 'Weekend slots open — book now', 'hours' => 16, 'seen' => false],
            ['brand_id' => 'brand-15', 'brand_name' => 'CrumbCakes', 'avatar' => 'https://i.pravatar.cc/100?img=53', 'media_url' => 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1080&q=80&auto=format&fit=crop', 'caption' => 'Fresh out of the oven at 5AM', 'hours' => 8, 'seen' => false],
        ];

        foreach ($stories as $s) {
            $storyOwner = $brandUsers[$s['brand_id']] ?? $brandOwner;
            Story::firstOrCreate(
                ['brand_name' => $s['brand_name'], 'caption' => $s['caption']],
                [
                    'user_id' => $storyOwner->id,
                    'brand_id' => $s['brand_id'],
                    'avatar' => $s['avatar'],
                    'media_url' => $s['media_url'],
                    'expires_at' => now()->addHours($s['hours']),
                    'seen' => $s['seen'],
                ]
            );
        }

        $conv1 = Conversation::firstOrCreate(
            ['user_id' => $entrepreneur->id, 'with_name' => 'BrewCraft Coffee'],
            [
                'avatar' => 'https://i.pravatar.cc/100?img=11',
                'last_message' => 'Happy to share P&L on inquiry — when are you free for a call?',
                'unread' => 1,
                'brand_id' => 'brand-1',
                'opportunity_id' => $byHeadline['Premium Coffee Franchise — High Foot Traffic Locations']->id ?? null,
            ]
        );

        $conv2 = Conversation::firstOrCreate(
            ['user_id' => $entrepreneur->id, 'with_name' => 'FitForge Gym'],
            [
                'avatar' => 'https://i.pravatar.cc/100?img=15',
                'last_message' => 'Launch promo still active for Mindanao',
                'unread' => 0,
                'brand_id' => 'brand-3',
                'opportunity_id' => $byHeadline['Boutique Fitness Franchise with Recurring Membership Model']->id ?? null,
            ]
        );

        $messages = [
            ['conv' => $conv1, 'sender' => null, 'side' => 'them', 'text' => 'Hi! Thanks for your interest in BrewCraft.'],
            ['conv' => $conv1, 'sender' => $entrepreneur, 'side' => 'me', 'text' => 'Hi — can I get the detailed ROI breakdown for the ₱850K package?'],
            ['conv' => $conv1, 'sender' => null, 'side' => 'them', 'text' => 'Happy to share P&L on inquiry — when are you free for a call?'],
            ['conv' => $conv2, 'sender' => null, 'side' => 'them', 'text' => 'Hey! FitForge here — interested in the boutique gym model?'],
            ['conv' => $conv2, 'sender' => $entrepreneur, 'side' => 'me', 'text' => 'Yes, looking at South Cebu locations.'],
        ];

        foreach ($messages as $m) {
            Message::firstOrCreate(
                ['conversation_id' => $m['conv']->id, 'text' => $m['text']],
                [
                    'sender_id' => $m['sender']?->id,
                    'from_side' => $m['side'],
                ]
            );
        }

        $notes = [
            ['type' => 'comment', 'message' => 'BrewCraft Coffee replied to your comment on Premium Coffee Franchise'],
            ['type' => 'inquiry', 'message' => 'Glow Skin Wholesale viewed your inquiry'],
            ['type' => 'new_post', 'message' => 'UrbanThread posted a new Resell opportunity you might like'],
        ];

        foreach ($notes as $i => $n) {
            AppNotification::firstOrCreate(
                ['user_id' => $entrepreneur->id, 'message' => $n['message']],
                [
                    'type' => $n['type'],
                    'read' => $i === 2,
                ]
            );
        }
    }
}
