<?php

namespace Database\Seeders;

use App\Models\Opportunity;
use App\Models\Story;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MorePostsSeeder extends Seeder
{
    public function run(): void
    {
        $brands = User::where('role', 'brand')->orderBy('id')->get();
        if ($brands->isEmpty()) {
            $this->command?->warn('MorePostsSeeder: no brand users found, skipping.');
            return;
        }

        // Map of brand accounts with 5 curated, realistic, high-converting opportunities each
        $brandCatalog = [
            'brand-1' => [ // BrewCraft Coffee
                'category' => 'Food & Beverage',
                'posts' => [
                    [
                        'type' => 'Franchise',
                        'headline' => 'BrewCraft Drive-Thru Kiosk — Prime Provincial Highway Location',
                        'capital_required' => '₱650K',
                        'capital_amount' => 650000,
                        'roi' => '32% annual ROI',
                        'roi_percent' => 32.0,
                        'description' => 'Compact drive-thru coffee pod designed for provincial highways and suburban thoroughfares. Low overhead, full espresso machinery package, and digital POS included.',
                        'image' => 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Wholesale',
                        'headline' => 'Specialty Nitro Cold Brew Bottling & Regional Distribution Rights',
                        'capital_required' => '₱350K',
                        'capital_amount' => 350000,
                        'roi' => '42% margin',
                        'roi_percent' => 42.0,
                        'description' => 'Exclusive distribution license for BrewCraft bottled cold brew teas and nitro canned coffees. Supply local gyms, convenience stores, and co-working hubs.',
                        'image' => 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => 'Turnkey Mall Espresso Bar with Benguet Single-Origin Supply',
                        'capital_required' => '₱920K',
                        'capital_amount' => 920000,
                        'roi' => '29% annual ROI',
                        'roi_percent' => 29.0,
                        'description' => 'Full-service inline cafe package inside Tier-1 shopping malls. Includes La Marzocco commercial machine, interior buildout, and certified barista recruitment.',
                        'image' => 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => 'University Campus Coffee Cart — Low Capex, High Foot Traffic',
                        'capital_required' => '₱280K',
                        'capital_amount' => 280000,
                        'roi' => '38% annual ROI',
                        'roi_percent' => 38.0,
                        'description' => 'Compact modular cart optimized for university corridors and library plazas. Fast 45-second drink turnaround with high daily cup counts.',
                        'image' => 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Resell',
                        'headline' => 'Mobile Coffee Van Franchise — Catering & Corporate Events',
                        'capital_required' => '₱480K',
                        'capital_amount' => 480000,
                        'roi' => '35% per event',
                        'roi_percent' => 35.0,
                        'description' => 'Customized retro coffee van fully equipped with water tanks and quiet inverters. Book corporate pop-ups, weddings, and weekend sports tournaments.',
                        'image' => 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80&auto=format&fit=crop',
                    ],
                ],
            ],

            'brand-2' => [ // Glow Skin Wholesale
                'category' => 'Beauty & Wellness',
                'posts' => [
                    [
                        'type' => 'Wholesale',
                        'headline' => 'Authorized K-Beauty Wholesale Distributorship — Luzon Territory',
                        'capital_required' => '₱400K',
                        'capital_amount' => 400000,
                        'roi' => '50% margin',
                        'roi_percent' => 50.0,
                        'description' => 'Direct master distributor pricing on certified Seoul brands (toners, serums, sunsticks). Verified FDA notifications and marketing collaterals supplied.',
                        'image' => 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Resell',
                        'headline' => 'Derma-Grade Serum & Skincare Reseller Starter Package',
                        'capital_required' => '₱120K',
                        'capital_amount' => 120000,
                        'roi' => '45% margin',
                        'roi_percent' => 45.0,
                        'description' => 'Turnkey reseller bundle with Niacinamide, Hyaluronic, and Retinol serums. Includes branded counter displays and high-converting Shopee/TikTok product kits.',
                        'image' => 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Wholesale',
                        'headline' => 'Organic Sunscreen & Skincare Bulk Wholesale Supply',
                        'capital_required' => '₱180K',
                        'capital_amount' => 180000,
                        'roi' => '48% margin',
                        'roi_percent' => 48.0,
                        'description' => 'Broad-spectrum SPF 50+ water-gel sunscreens manufactured for tropical climates. Non-greasy finish, zero white cast, highly sought after by beach and city markets.',
                        'image' => 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => 'Mall Kiosk Beauty Franchise with Turnkey Display Unit',
                        'capital_required' => '₱320K',
                        'capital_amount' => 320000,
                        'roi' => '36% annual ROI',
                        'roi_percent' => 36.0,
                        'description' => 'Sleek acrylic retail island for department stores and mall walkways. Complete inventory, tester counter, barcode system, and sales staff onboarding.',
                        'image' => 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Wholesale',
                        'headline' => 'Private Label Skincare Bundles for Online Retailers & Shopee/TikTok Sellers',
                        'capital_required' => '₱220K',
                        'capital_amount' => 220000,
                        'roi' => '55% margin',
                        'roi_percent' => 55.0,
                        'description' => 'Launch your own cosmetic line with low minimum order quantities. Custom box packaging, FDA documentation, and lab-tested botanical actives.',
                        'image' => 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80&auto=format&fit=crop',
                    ],
                ],
            ],

            'brand-3' => [ // FitForge Gym
                'category' => 'Health & Fitness',
                'posts' => [
                    [
                        'type' => 'Franchise',
                        'headline' => '24/7 Keyless Access Fitness Studio Franchise — BGC / Ortigas Ready',
                        'capital_required' => '₱1.5M',
                        'capital_amount' => 1500000,
                        'roi' => '26% annual ROI',
                        'roi_percent' => 26.0,
                        'description' => 'Smart unstaffed gym model operating around the clock with RFID and facial recognition access. Low staff payroll with high recurring subscription revenue.',
                        'image' => 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => 'HIIT & Functional Training Center with Branded Equipment',
                        'capital_required' => '₱850K',
                        'capital_amount' => 850000,
                        'roi' => '31% annual ROI',
                        'roi_percent' => 31.0,
                        'description' => 'High-energy community group workouts with heart rate monitoring displays. Complete barbell rigs, air bikes, rowers, and coach training curricula.',
                        'image' => 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => 'Infrared Sauna & Recovery Lounge Studio Franchise',
                        'capital_required' => '₱720K',
                        'capital_amount' => 720000,
                        'roi' => '34% annual ROI',
                        'roi_percent' => 34.0,
                        'description' => 'Boutique wellness recovery facility with cedar infrared sauna booths, cold plunge ice tubs, and compression therapy boots for endurance athletes.',
                        'image' => 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Wholesale',
                        'headline' => 'Corporate Wellness Partnership & Gym Equipment Licensing',
                        'capital_required' => '₱500K',
                        'capital_amount' => 500000,
                        'roi' => '28% annual ROI',
                        'roi_percent' => 28.0,
                        'description' => 'Setup and manage on-site wellness facilities for BPO and corporate clients. Predictable 2-3 year corporate facility maintenance contracts.',
                        'image' => 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => 'Pilates & Reformer Studio Boutique Franchise',
                        'capital_required' => '₱980K',
                        'capital_amount' => 980000,
                        'roi' => '36% annual ROI',
                        'roi_percent' => 36.0,
                        'description' => 'Aesthetic boutique pilates studio with 8 commercial reformers. Premium membership pricing catering to young professionals and post-rehab clients.',
                        'image' => 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80&auto=format&fit=crop',
                    ],
                ],
            ],

            'brand-4' => [ // ParcelGo Logistics
                'category' => 'Services & Logistics',
                'posts' => [
                    [
                        'type' => 'Franchise',
                        'headline' => 'E-Commerce Last-Mile Drop-off & Sorting Hub Franchise',
                        'capital_required' => '₱380K',
                        'capital_amount' => 380000,
                        'roi' => '38% annual ROI',
                        'roi_percent' => 38.0,
                        'description' => 'Neighborhood parcel drop-off center partnered with leading national marketplaces. Earn per drop-off, return dispatch, and pouch sale.',
                        'image' => 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => 'Provincial Courier & Freight Forwarding Branch License',
                        'capital_required' => '₱620K',
                        'capital_amount' => 620000,
                        'roi' => '33% annual ROI',
                        'roi_percent' => 33.0,
                        'description' => 'Connect provincial businesses to Manila via consolidated 24-48hr freight routes. Includes booking software, weighing scales, and cargo insurance.',
                        'image' => 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => 'Same-Day Motorcycle Fleet Delivery Hub — City Center',
                        'capital_required' => '₱450K',
                        'capital_amount' => 450000,
                        'roi' => '40% annual ROI',
                        'roi_percent' => 40.0,
                        'description' => 'Dedicated motorcycle dispatch squad handling pharmacy, document, and grocery rush deliveries. Automated rider route assignment software.',
                        'image' => 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => 'Automated Parcel Locker Station Network Placement',
                        'capital_required' => '₱290K',
                        'capital_amount' => 290000,
                        'roi' => '30% annual ROI',
                        'roi_percent' => 30.0,
                        'description' => 'Weatherproof smart electronic lockers installed at condominiums and gas stations. Contactless 24/7 customer pickup with zero labor overhead.',
                        'image' => 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Wholesale',
                        'headline' => 'Cold Chain Micro-Fulfillment Depot for Fresh Produce',
                        'capital_required' => '₱580K',
                        'capital_amount' => 580000,
                        'roi' => '35% annual ROI',
                        'roi_percent' => 35.0,
                        'description' => 'Refrigerated container hub storing dairy, meats, and seafood for farm-to-table delivery subscriptions. HACCP-compliant temperature monitoring.',
                        'image' => 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=80&auto=format&fit=crop',
                    ],
                ],
            ],

            'brand-5' => [ // TastyBox Meals
                'category' => 'Food & Beverage',
                'posts' => [
                    [
                        'type' => 'Franchise',
                        'headline' => 'Cloud Kitchen Multi-Brand Food Franchise — HACCP Certified',
                        'capital_required' => '₱680K',
                        'capital_amount' => 680000,
                        'roi' => '35% annual ROI',
                        'roi_percent' => 35.0,
                        'description' => 'Cook and dispatch 4 top-selling food brands from a single kitchen footprint. Integrated GrabFood and Foodpanda order routing console.',
                        'image' => 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Wholesale',
                        'headline' => 'Ready-to-Heat Gourmet Meal Prep Reseller Distribution',
                        'capital_required' => '₱210K',
                        'capital_amount' => 210000,
                        'roi' => '44% margin',
                        'roi_percent' => 44.0,
                        'description' => 'Vacuum-sealed chef-crafted healthy meal boxes. Zero cooking required on your end — distribute to offices, gym kiosks, and residential towers.',
                        'image' => 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => 'Office District Bento & Rice Bowl Express Counter',
                        'capital_required' => '₱390K',
                        'capital_amount' => 390000,
                        'roi' => '37% annual ROI',
                        'roi_percent' => 37.0,
                        'description' => 'Fast grab-and-go rice bowl counter targeting BPO employees and corporate lunch crowds. 30-second meal dispensing with high lunchtime turnover.',
                        'image' => 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Wholesale',
                        'headline' => 'School & Hospital Dietary Meal Catering Subcontract',
                        'capital_required' => '₱460K',
                        'capital_amount' => 460000,
                        'roi' => '28% annual ROI',
                        'roi_percent' => 28.0,
                        'description' => 'Institutional daily meal commissary routes. Nutritionist-certified portion-controlled meals delivered under recurring institutional contracts.',
                        'image' => 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Wholesale',
                        'headline' => 'Frozen Dimsum & Ready-to-Cook Wholesale Supply',
                        'capital_required' => '₱160K',
                        'capital_amount' => 160000,
                        'roi' => '52% margin',
                        'roi_percent' => 52.0,
                        'description' => 'Bulk frozen pork siomai, hakaw, spring rolls, and dumplings. Premium commercial quality with no artificial preservatives for restaurants and food carts.',
                        'image' => 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80&auto=format&fit=crop',
                    ],
                ],
            ],

            'brand-6' => [ // EduSpark Learning
                'category' => 'Education',
                'posts' => [
                    [
                        'type' => 'Franchise',
                        'headline' => 'Robotics & STEM After-School Academy Franchise',
                        'capital_required' => '₱520K',
                        'capital_amount' => 520000,
                        'roi' => '36% annual ROI',
                        'roi_percent' => 36.0,
                        'description' => 'Interactive robotics and maker lab for children aged 6 to 16. Includes modular LEGO/Arduino kits, curriculum, and instructor certifications.',
                        'image' => 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => 'Early Childhood Phonics & Literacy Center License',
                        'capital_required' => '₱380K',
                        'capital_amount' => 380000,
                        'roi' => '32% annual ROI',
                        'roi_percent' => 32.0,
                        'description' => 'Proven reading readiness and speech development program for toddlers and preschoolers. High parent referral rate and year-round enrollment.',
                        'image' => 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => 'Coding & AI Academy for Kids & Teens — Interactive Lab',
                        'capital_required' => '₱440K',
                        'capital_amount' => 440000,
                        'roi' => '38% annual ROI',
                        'roi_percent' => 38.0,
                        'description' => 'Gamified computer programming curriculum covering Python, Scratch, and game development. Turnkey computer workstation setup included.',
                        'image' => 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => 'Singapore Math & Speed Reading Learning Hub',
                        'capital_required' => '₱310K',
                        'capital_amount' => 310000,
                        'roi' => '34% annual ROI',
                        'roi_percent' => 34.0,
                        'description' => 'Conceptual mathematics mastery program with certified teaching materials. Small class sizes of 4-6 students with recurring monthly tuition.',
                        'image' => 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => 'Hybrid Tutoring Center with Proprietary Digital LMS',
                        'capital_required' => '₱270K',
                        'capital_amount' => 270000,
                        'roi' => '39% annual ROI',
                        'roi_percent' => 39.0,
                        'description' => 'Dual online and in-person study center providing homework assistance and exam prep. Cloud-based progress tracking for parents.',
                        'image' => 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80&auto=format&fit=crop',
                    ],
                ],
            ],

            'brand-7' => [ // UrbanThread
                'category' => 'Fashion & Apparel',
                'posts' => [
                    [
                        'type' => 'Franchise',
                        'headline' => 'Streetwear Concept Store Franchise — Premium Skate & Urban Aesthetic',
                        'capital_required' => '₱620K',
                        'capital_amount' => 620000,
                        'roi' => '33% annual ROI',
                        'roi_percent' => 33.0,
                        'description' => 'Curated lifestyle boutique carrying limited drop sneakers, graphic apparel, and skate accessories. Turnkey industrial interior aesthetic.',
                        'image' => 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Wholesale',
                        'headline' => 'Limited-Drop Graphic Tees & Hoodies Wholesale Distributorship',
                        'capital_required' => '₱190K',
                        'capital_amount' => 190000,
                        'roi' => '54% margin',
                        'roi_percent' => 54.0,
                        'description' => 'Heavyweight 240GSM combed cotton tees and French terry hoodies. High retail sell-through across independent boutiques and online streetwear shops.',
                        'image' => 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Resell',
                        'headline' => 'Eco-Friendly Activewear & Athleisure Reseller Starter Pack',
                        'capital_required' => '₱140K',
                        'capital_amount' => 140000,
                        'roi' => '46% margin',
                        'roi_percent' => 46.0,
                        'description' => 'Seamless leggings, sports bras, and training shorts made from recycled ocean polymers. High elasticity and squat-proof fabric testing.',
                        'image' => 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => 'Denim & Workwear Pop-up Kiosk Franchise — High Density Malls',
                        'capital_required' => '₱310K',
                        'capital_amount' => 310000,
                        'roi' => '37% annual ROI',
                        'roi_percent' => 37.0,
                        'description' => 'Custom raw denim and durable utility jackets in a compact 12sqm modular pop-up format. Includes fitting curtain and on-the-spot hem service.',
                        'image' => 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Wholesale',
                        'headline' => 'Custom Merchandising & Screen Printing Reseller License',
                        'capital_required' => '₱230K',
                        'capital_amount' => 230000,
                        'roi' => '48% margin',
                        'roi_percent' => 48.0,
                        'description' => 'Supply branded apparel for corporate runs, university events, and music festivals. Access our high-capacity automatic screen printing presses.',
                        'image' => 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80&auto=format&fit=crop',
                    ],
                ],
            ],

            'brand-8' => [ // AquaPure Water
                'category' => 'Food & Beverage',
                'posts' => [
                    [
                        'type' => 'Franchise',
                        'headline' => '16-Stage Alkaline & Purified Water Station Franchise',
                        'capital_required' => '₱420K',
                        'capital_amount' => 420000,
                        'roi' => '45% annual ROI',
                        'roi_percent' => 45.0,
                        'description' => 'Commercial grade reverse osmosis and mineralization equipment. Daily laboratory quality testing sensors and 500 initial 5-gallon slim jugs included.',
                        'image' => 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => 'Commercial Mineral Water Refilling Station — 200 Jugs/Day Capacity',
                        'capital_required' => '₱350K',
                        'capital_amount' => 350000,
                        'roi' => '42% annual ROI',
                        'roi_percent' => 42.0,
                        'description' => 'Neighborhood refilling depot with motorized delivery trike. High repeat cash-flow business serving residential subdivisions and local canteens.',
                        'image' => 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => 'Automated 24/7 Coinless Water Vending Machine Network',
                        'capital_required' => '₱260K',
                        'capital_amount' => 260000,
                        'roi' => '48% annual ROI',
                        'roi_percent' => 48.0,
                        'description' => 'Smart outdoor water kiosks accepting coins, bills, and GCash. Zero staff required — collect revenues and replace UV filters on a simple schedule.',
                        'image' => 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Wholesale',
                        'headline' => 'Commercial Water Dispenser Rental & Refill Fleet',
                        'capital_required' => '₱310K',
                        'capital_amount' => 310000,
                        'roi' => '36% annual ROI',
                        'roi_percent' => 36.0,
                        'description' => 'Contract-based dispenser leasing for clinics, law offices, and banks. Guaranteed monthly recurring income per active dispenser contract.',
                        'image' => 'https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Wholesale',
                        'headline' => 'Industrial Water Softening & Filtration Contract Services',
                        'capital_required' => '₱490K',
                        'capital_amount' => 490000,
                        'roi' => '32% annual ROI',
                        'roi_percent' => 32.0,
                        'description' => 'Heavy duty water treatment systems for laundromats, boiler plants, and hotels. Includes resin tanks, brine systems, and service maintenance contracts.',
                        'image' => 'https://images.unsplash.com/photo-1564419320461-6870880221ad?w=800&q=80&auto=format&fit=crop',
                    ],
                ],
            ],

            'brand-9' => [ // Suds&Spin Laundry
                'category' => 'Services & Logistics',
                'posts' => [
                    [
                        'type' => 'Franchise',
                        'headline' => 'Smart Cashless Self-Service Laundromat Franchise with Speed Queen Units',
                        'capital_required' => '₱1.4M',
                        'capital_amount' => 1400000,
                        'roi' => '32% annual ROI',
                        'roi_percent' => 32.0,
                        'description' => 'Commercial coinless laundromat with 5 stacked washer-dryer units. Customers activate machines via QR payment with automatic detergent dispensing.',
                        'image' => 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => 'Condominium Micro-Laundromat with Digital App Payments',
                        'capital_required' => '₱650K',
                        'capital_amount' => 650000,
                        'roi' => '35% annual ROI',
                        'roi_percent' => 35.0,
                        'description' => 'Compact 2-stack installation ideal for residential condo basements and student dormitories. Complete remote revenue monitoring via smartphone app.',
                        'image' => 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Wholesale',
                        'headline' => 'Hotel & Restaurant Linen Drop-Off Wholesale Contract',
                        'capital_required' => '₱480K',
                        'capital_amount' => 480000,
                        'roi' => '38% annual ROI',
                        'roi_percent' => 38.0,
                        'description' => 'Industrial wash, dry, and fold contracts for boutique hotels and catering services. Consistent daily volume with commercial steam pressing.',
                        'image' => 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => 'Dry Cleaning & Sneaker Care Specialty Franchise',
                        'capital_required' => '₱390K',
                        'capital_amount' => 390000,
                        'roi' => '44% margin',
                        'roi_percent' => 44.0,
                        'description' => 'High-margin niche care for designer suits, barongs, leather boots, and collectible sneakers. Ultrasonic cleaning and eco-friendly chemical solvents.',
                        'image' => 'https://images.unsplash.com/photo-1521656693074-0ef32e80a5d5?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => 'Provincial Laundromat Hub with 8 Commercial Washer-Dryer Stacks',
                        'capital_required' => '₱1.8M',
                        'capital_amount' => 1800000,
                        'roi' => '28% annual ROI',
                        'roi_percent' => 28.0,
                        'description' => 'Flagship provincial laundry hub with LPG tank setup, backup power generator, and customer lounge. High capacity handling up to 100 loads a day.',
                        'image' => 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&q=80&auto=format&fit=crop',
                    ],
                ],
            ],

            'brand-10' => [ // LashLuxe Salon
                'category' => 'Beauty & Wellness',
                'posts' => [
                    [
                        'type' => 'Franchise',
                        'headline' => 'Boutique Eyelash Extension & Brow Studio Franchise',
                        'capital_required' => '₱480K',
                        'capital_amount' => 480000,
                        'roi' => '38% annual ROI',
                        'roi_percent' => 38.0,
                        'description' => 'Chic pastel lash and brow salon with 4 ergonomic recliner beds. Includes Korean lash adhesives, mink lash trays, and certified technician training.',
                        'image' => 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => 'Luxury Gel Nail Bar & Spa Outlet — High Income Residential Hub',
                        'capital_required' => '₱550K',
                        'capital_amount' => 550000,
                        'roi' => '36% annual ROI',
                        'roi_percent' => 36.0,
                        'description' => 'Premium non-toxic gel manicures and pedicures with foot reflexology massage chairs. Loyal recurring client base with appointment booking software.',
                        'image' => 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => 'Express Lash & Brow Bar for Metro Rail & Shopping Plazas',
                        'capital_required' => '₱290K',
                        'capital_amount' => 290000,
                        'roi' => '42% annual ROI',
                        'roi_percent' => 42.0,
                        'description' => 'Fast 30-minute lash lift and brow threading station for busy commuters. High throughput with minimal square footage requirements.',
                        'image' => 'https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Wholesale',
                        'headline' => 'Professional Lash Academy & Technician Certification Center',
                        'capital_required' => '₱340K',
                        'capital_amount' => 340000,
                        'roi' => '45% margin',
                        'roi_percent' => 45.0,
                        'description' => 'Accredited training facility offering beginner to advanced lash volume mapping courses. High tuition margins plus ongoing student supplies sales.',
                        'image' => 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Wholesale',
                        'headline' => 'Wholesale Eyelash Supplies & Adhesive Distribution',
                        'capital_required' => '₱180K',
                        'capital_amount' => 180000,
                        'roi' => '50% margin',
                        'roi_percent' => 50.0,
                        'description' => 'Medical grade ISO-certified lash glues, tweezers, microbrushes, and hydrogel eye patches. Distribute directly to beauty salons nationwide.',
                        'image' => 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&q=80&auto=format&fit=crop',
                    ],
                ],
            ],

            'brand-11' => [ // MilkTeaGo
                'category' => 'Food & Beverage',
                'posts' => [
                    [
                        'type' => 'Franchise',
                        'headline' => 'Boba Tea Express Kiosk — Mall Ground Floor Placement',
                        'capital_required' => '₱380K',
                        'capital_amount' => 380000,
                        'roi' => '39% annual ROI',
                        'roi_percent' => 39.0,
                        'description' => 'Bright branded boba milk tea cart with commercial fructose dispensers, cup sealers, and induction tea brewers. 15 classic and cream cheese flavors.',
                        'image' => 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => 'Taiwanese Fruit Tea & Brown Sugar Milk Tea Food Cart Franchise',
                        'capital_required' => '₱320K',
                        'capital_amount' => 320000,
                        'roi' => '42% annual ROI',
                        'roi_percent' => 42.0,
                        'description' => 'Real fruit brewed teas featuring passionfruit, lychee, and slow-simmered tiger brown sugar boba. Low cost of goods sold under 28%.',
                        'image' => 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => 'Drive-Thru Milk Tea & Snack Station with Low Space Footprint',
                        'capital_required' => '₱520K',
                        'capital_amount' => 520000,
                        'roi' => '34% annual ROI',
                        'roi_percent' => 34.0,
                        'description' => 'Container-based drive-thru kiosk combining drinks with bubble waffles and Taiwanese fried chicken snacks. Maximizes average ticket size.',
                        'image' => 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Wholesale',
                        'headline' => 'Milk Tea Raw Ingredients & Tapioca Pearls Wholesale Supply',
                        'capital_required' => '₱190K',
                        'capital_amount' => 190000,
                        'roi' => '46% margin',
                        'roi_percent' => 46.0,
                        'description' => 'Imported Assam and Earl Grey tea leaves, non-dairy creamer sacks, popping boba, and vacuum-sealed cassava pearls. Consistent wholesale supply.',
                        'image' => 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => 'School District Bubble Tea Stall with High Student Volume',
                        'capital_required' => '₱240K',
                        'capital_amount' => 240000,
                        'roi' => '45% annual ROI',
                        'roi_percent' => 45.0,
                        'description' => 'Value-priced milk tea concept targeted directly at student budgets. Simple operations, minimal equipment maintenance, rapid ROI payback.',
                        'image' => 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?w=800&q=80&auto=format&fit=crop',
                    ],
                ],
            ],

            'brand-12' => [ // BuildRight Hardware
                'category' => 'Home & Living',
                'posts' => [
                    [
                        'type' => 'Franchise',
                        'headline' => 'Community Hardware & Electrical Supply Franchise',
                        'capital_required' => '₱750K',
                        'capital_amount' => 750000,
                        'roi' => '30% annual ROI',
                        'roi_percent' => 30.0,
                        'description' => 'Neighborhood depot stocking fast-moving electrical wires, circuit breakers, plumbing PVC pipes, and hand tools. Essential community business.',
                        'image' => 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Wholesale',
                        'headline' => 'Contractor Tools & Heavy Duty Power Equipment Reseller License',
                        'capital_required' => '₱420K',
                        'capital_amount' => 420000,
                        'roi' => '38% margin',
                        'roi_percent' => 38.0,
                        'description' => 'Direct manufacturer pricing on cordless drills, angle grinders, welding inverters, and diamond cutting blades. Complete warranty repair support.',
                        'image' => 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => 'Paint Depot & Computerized Color Mixing Center Franchise',
                        'capital_required' => '₱510K',
                        'capital_amount' => 510000,
                        'roi' => '35% annual ROI',
                        'roi_percent' => 35.0,
                        'description' => 'Automated tinting dispenser mixing 5,000+ architectural paint shades on demand. Strong demand from residential house painters and contractors.',
                        'image' => 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Wholesale',
                        'headline' => 'Plumbing & Sanitary Wholesale Depot for Provincial Subdivisions',
                        'capital_required' => '₱380K',
                        'capital_amount' => 380000,
                        'roi' => '40% margin',
                        'roi_percent' => 40.0,
                        'description' => 'Bulk PPR pipes, brass valves, stainless water faucets, and drainage fixtures. Steady demand driven by housing developments in provincial growth corridors.',
                        'image' => 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Wholesale',
                        'headline' => 'Solar Panel & Renewable Energy Equipment Dealership',
                        'capital_required' => '₱620K',
                        'capital_amount' => 620000,
                        'roi' => '33% annual ROI',
                        'roi_percent' => 33.0,
                        'description' => 'Tier-1 monocrystalline solar panels, hybrid inverters, and LiFePO4 battery banks. Booming market for provincial homes lowering Meralco electric bills.',
                        'image' => 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&q=80&auto=format&fit=crop',
                    ],
                ],
            ],

            'brand-13' => [ // MediPlus Pharmacy
                'category' => 'Beauty & Wellness',
                'posts' => [
                    [
                        'type' => 'Franchise',
                        'headline' => 'Community Drugstore Franchise with Licensed Pharmacist Support',
                        'capital_required' => '₱850K',
                        'capital_amount' => 850000,
                        'roi' => '34% annual ROI',
                        'roi_percent' => 34.0,
                        'description' => 'Turnkey neighborhood pharmacy complete with FDA licensing assistance, POS system with senior citizen discounts, and branded medicines supply.',
                        'image' => 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Wholesale',
                        'headline' => 'Generic Medicine & OTC Healthcare Wholesale Distribution',
                        'capital_required' => '₱360K',
                        'capital_amount' => 360000,
                        'roi' => '48% margin',
                        'roi_percent' => 48.0,
                        'description' => 'Direct distributor supply of affordable generic antibiotics, pain relievers, vitamins, and maintenance medications. 100% FDA registered.',
                        'image' => 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Wholesale',
                        'headline' => 'Medical Supplies & Diagnostic Test Kits Bulk Dealership',
                        'capital_required' => '₱250K',
                        'capital_amount' => 250000,
                        'roi' => '42% margin',
                        'roi_percent' => 42.0,
                        'description' => 'Hospital grade digital blood pressure monitors, blood glucose meters, test strips, and surgical dressings for clinics and home care.',
                        'image' => 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => '24-Hour Express Pharmacy Kiosk for Hospitals & Transport Terminals',
                        'capital_required' => '₱520K',
                        'capital_amount' => 520000,
                        'roi' => '38% annual ROI',
                        'roi_percent' => 38.0,
                        'description' => 'High-velocity 15sqm pharmacy counter designed for transit terminals and medical centers. 24/7 operating model capturing emergency drug purchases.',
                        'image' => 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Wholesale',
                        'headline' => 'Senior Citizen & Chronic Disease Prescription Delivery Hub',
                        'capital_required' => '₱310K',
                        'capital_amount' => 310000,
                        'roi' => '36% annual ROI',
                        'roi_percent' => 36.0,
                        'description' => 'Monthly subscription delivery service for diabetes and hypertension maintenance medicine. Recurring automatic refills with digital prescription storage.',
                        'image' => 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&q=80&auto=format&fit=crop',
                    ],
                ],
            ],

            'brand-14' => [ // SparkleWash Auto
                'category' => 'Services & Logistics',
                'posts' => [
                    [
                        'type' => 'Franchise',
                        'headline' => 'Water-Recycling Eco Car Wash Bay Franchise — 4-Bay Setup',
                        'capital_required' => '₱890K',
                        'capital_amount' => 890000,
                        'roi' => '36% annual ROI',
                        'roi_percent' => 36.0,
                        'description' => 'Sustainable car wash facility recycling 80% of wash water through multi-bed sand and carbon filters. Cuts utility overhead and complies with DENR standards.',
                        'image' => 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => 'Ceramic Coating & Auto Detailing Studio Franchise',
                        'capital_required' => '₱640K',
                        'capital_amount' => 640000,
                        'roi' => '44% annual ROI',
                        'roi_percent' => 44.0,
                        'description' => 'Climate-controlled dust-free detailing bay with high-CRI inspection lights. High-ticket 9H ceramic coatings and paint correction packages.',
                        'image' => 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => 'Motorcycle Express Foam Wash Hub — High Volume Delivery Riders',
                        'capital_required' => '₱230K',
                        'capital_amount' => 230000,
                        'roi' => '46% annual ROI',
                        'roi_percent' => 46.0,
                        'description' => 'Fast 10-minute motorcycle foam wash and chain lube station near delivery hubs and commercial centers. High volume with 100+ bikes daily.',
                        'image' => 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Wholesale',
                        'headline' => 'Fleet Vehicle Cleaning & Mobile Detailing Van Dealership',
                        'capital_required' => '₱470K',
                        'capital_amount' => 470000,
                        'roi' => '35% annual ROI',
                        'roi_percent' => 35.0,
                        'description' => 'Mobile wash van servicing car rental fleets, company motor pools, and car dealerships on-site. Equipped with water tank and quiet generator.',
                        'image' => 'https://images.unsplash.com/photo-1552930294-6b595f4c2974?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Wholesale',
                        'headline' => 'Car Care Products & Professional Detailing Chemical Wholesale',
                        'capital_required' => '₱180K',
                        'capital_amount' => 180000,
                        'roi' => '52% margin',
                        'roi_percent' => 52.0,
                        'description' => 'Concentrated pH-neutral car shampoos, degreasers, tire dressings, and iron removers packaged in 20L carboys for professional wash centers.',
                        'image' => 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=800&q=80&auto=format&fit=crop',
                    ],
                ],
            ],

            'brand-15' => [ // CrumbCakes Bakery
                'category' => 'Food & Beverage',
                'posts' => [
                    [
                        'type' => 'Franchise',
                        'headline' => 'Artisan Sourdough & Croissant Bakery Cafe Franchise',
                        'capital_required' => '₱950K',
                        'capital_amount' => 950000,
                        'roi' => '32% annual ROI',
                        'roi_percent' => 32.0,
                        'description' => 'European style artisanal bakery cafe serving naturally leavened sourdough, flaky butter croissants, and gourmet pastries. Full commissary support.',
                        'image' => 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Wholesale',
                        'headline' => 'Daily Pandesal & Breakfast Pastries Commissary Wholesale Route',
                        'capital_required' => '₱280K',
                        'capital_amount' => 280000,
                        'roi' => '44% margin',
                        'roi_percent' => 44.0,
                        'description' => 'Hot pandesal, ensaymada, and Spanish bread delivered fresh before 5:30 AM every morning to sari-sari stores, canteens, and local coffee counters.',
                        'image' => 'https://images.unsplash.com/photo-1511018556340-d16986a1c194?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => 'Custom Cake & Celebration Dessert Studio Franchise',
                        'capital_required' => '₱480K',
                        'capital_amount' => 480000,
                        'roi' => '38% annual ROI',
                        'roi_percent' => 38.0,
                        'description' => 'Custom birthday, wedding, and event cakes. Includes digital cake designer ordering portal and complete cake decorating workstation kit.',
                        'image' => 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Wholesale',
                        'headline' => 'Commercial Sandwich Bread Supply for Restos & Coffee Shops',
                        'capital_required' => '₱220K',
                        'capital_amount' => 220000,
                        'roi' => '40% margin',
                        'roi_percent' => 40.0,
                        'description' => 'Brioche burger buns, milk bread loaves, and focaccia delivered in commercial volumes to cafes and restaurant chains across Luzon.',
                        'image' => 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Wholesale',
                        'headline' => 'Frozen Pre-Proofed Pastries Wholesale for Hotel Kitchens',
                        'capital_required' => '₱310K',
                        'capital_amount' => 310000,
                        'roi' => '46% margin',
                        'roi_percent' => 46.0,
                        'description' => 'Ready-to-bake frozen croissants, chocolate twists, and apple turnovers. Simply thaw and bake for 15 minutes with zero dough preparation.',
                        'image' => 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=800&q=80&auto=format&fit=crop',
                    ],
                ],
            ],

            'brand-16' => [ // PrintFast Hub
                'category' => 'Services & Logistics',
                'posts' => [
                    [
                        'type' => 'Franchise',
                        'headline' => 'Digital Quick-Print & Large Format Signage Center Franchise',
                        'capital_required' => '₱580K',
                        'capital_amount' => 580000,
                        'roi' => '37% annual ROI',
                        'roi_percent' => 37.0,
                        'description' => 'High-capacity digital laser press and 6-foot eco-solvent vinyl tarpaulin printer. High demand near schools, municipal halls, and business districts.',
                        'image' => 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Wholesale',
                        'headline' => 'Corporate Packaging & Label Printing Wholesale Account',
                        'capital_required' => '₱320K',
                        'capital_amount' => 320000,
                        'roi' => '45% margin',
                        'roi_percent' => 45.0,
                        'description' => 'Die-cut product labels, corrugated mailing boxes, and food-grade takeaway sleeves for SME food producers and skincare brands nationwide.',
                        'image' => 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Franchise',
                        'headline' => 'University Thesis Binding & Blueprints Rush Service Hub',
                        'capital_required' => '₱240K',
                        'capital_amount' => 240000,
                        'roi' => '48% annual ROI',
                        'roi_percent' => 48.0,
                        'description' => 'Bookbinding, gold-stamp hardcover finishing, and architectural CAD blueprint printing located within walking distance of universities.',
                        'image' => 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Wholesale',
                        'headline' => 'Direct-to-Film (DTF) & T-Shirt Sublimation Print Depot',
                        'capital_required' => '₱390K',
                        'capital_amount' => 390000,
                        'roi' => '50% margin',
                        'roi_percent' => 50.0,
                        'description' => 'Industrial DTF printer and heat press line creating vivid, wash-resistant apparel transfers for local clothing brands and event organizers.',
                        'image' => 'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?w=800&q=80&auto=format&fit=crop',
                    ],
                    [
                        'type' => 'Wholesale',
                        'headline' => 'Custom Merchandise & Corporate Giveaways Production Franchise',
                        'capital_required' => '₱290K',
                        'capital_amount' => 290000,
                        'roi' => '42% margin',
                        'roi_percent' => 42.0,
                        'description' => 'UV-printed tumblers, notebooks, lanyard badges, and custom USB flash drives. Year-end corporate gift orders generate substantial lump-sum profits.',
                        'image' => 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80&auto=format&fit=crop',
                    ],
                ],
            ],
        ];

        // Story video / photo placeholders (high-res reels)
        $storyMedia = [
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1080&q=80&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1080&q=80&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1080&q=80&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=1080&q=80&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1080&q=80&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1080&q=80&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1080&q=80&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=1080&q=80&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=1080&q=80&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=1080&q=80&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=1080&q=80&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1080&q=80&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1080&q=80&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=1080&q=80&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1080&q=80&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1080&q=80&auto=format&fit=crop',
        ];

        // Match brand user by index or email
        $brandMap = [];
        foreach ($brands as $index => $brand) {
            $key = 'brand-' . ($index + 1);
            $brandMap[$key] = $brand;
        }

        $createdOpps = 0;
        $createdStories = 0;

        foreach ($brandCatalog as $brandKey => $data) {
            $brandUser = $brandMap[$brandKey] ?? $brands->first();
            $brandId = 'brand-' . $brandUser->id;

            foreach ($data['posts'] as $postAttrs) {
                $opp = Opportunity::firstOrCreate(
                    ['headline' => $postAttrs['headline']],
                    [
                        'brand_name' => $brandUser->name,
                        'brand_avatar' => $brandUser->avatar,
                        'brand_id' => $brandId,
                        'user_id' => $brandUser->id,
                        'type' => $postAttrs['type'],
                        'category' => $data['category'],
                        'headline' => $postAttrs['headline'],
                        'capital_required' => $postAttrs['capital_required'],
                        'capital_amount' => $postAttrs['capital_amount'],
                        'roi' => $postAttrs['roi'],
                        'roi_percent' => $postAttrs['roi_percent'],
                        'description' => $postAttrs['description'],
                        'image' => $postAttrs['image'],
                        'media_type' => 'image',
                        'video_url' => null,
                        'featured' => (bool) rand(0, 1),
                        'verified' => true,
                        'likes_count' => rand(15, 350),
                        'saves_count' => rand(8, 85),
                        'is_new' => true,
                    ]
                );

                if ($opp->wasRecentlyCreated) {
                    $createdOpps++;
                }

                if (empty($opp->slug)) {
                    $base = Str::slug($opp->headline ?: ($opp->brand_name ?: 'post')) ?: 'post';
                    $opp->slug = $base . '-' . $opp->id;
                    $opp->saveQuietly();
                }
            }

            // Create 2 Stories / Pitch Reels for each brand
            for ($k = 1; $k <= 2; $k++) {
                $caption = "Inside {$brandUser->name} Operations — Day in the Life #{$k}";
                $storyMediaUrl = $storyMedia[array_rand($storyMedia)];
                $story = Story::firstOrCreate(
                    [
                        'brand_name' => $brandUser->name,
                        'caption' => $caption,
                    ],
                    [
                        'user_id' => $brandUser->id,
                        'brand_name' => $brandUser->name,
                        'brand_id' => $brandId,
                        'avatar' => $brandUser->avatar,
                        'media_url' => $storyMediaUrl,
                        'caption' => $caption,
                        'expires_at' => now()->addDays(7),
                        'seen' => false,
                    ]
                );

                if ($story->wasRecentlyCreated) {
                    $createdStories++;
                }

                if (empty($story->slug)) {
                    $base = Str::slug($story->brand_name ?: 'story') ?: 'story';
                    $story->slug = $base . '-' . $story->id;
                    $story->saveQuietly();
                }
            }
        }

        $this->command?->info("MorePostsSeeder finished. Created {$createdOpps} opportunities and {$createdStories} stories across {$brands->count()} brand accounts.");
    }
}
