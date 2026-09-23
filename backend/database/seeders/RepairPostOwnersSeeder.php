<?php

namespace Database\Seeders;

use App\Models\Comment;
use App\Models\Opportunity;
use App\Models\Story;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RepairPostOwnersSeeder extends Seeder
{
    public function run(): void
    {
        $brandUsers = $this->ensureBrandUsers();
        $oppFixed = $this->repairOpportunities($brandUsers);
        $storyFixed = $this->repairStories($brandUsers);
        $commentFixed = $this->repairComments();
        $this->command->info("owners repaired: opps={$oppFixed} stories={$storyFixed} comments={$commentFixed}");
    }

    public function brandAccounts(): array
    {
        return [
            'brand-1' => ['BrewCraft Coffee', 'brand@bizlink.ph', 'https://i.pravatar.cc/100?img=11', 'Specialty coffee franchise roasting single-origin Benguet beans since 2019.'],
            'brand-2' => ['Glow Skin Wholesale', 'glow@bizlink.ph', 'https://i.pravatar.cc/100?img=32', 'Direct K-beauty importer serving 2,000+ online sellers nationwide.'],
            'brand-3' => ['FitForge Gym', 'fitforge@bizlink.ph', 'https://i.pravatar.cc/100?img=15', 'Boutique fitness chain with 12 branches and a 90% retention rate.'],
            'brand-4' => ['ParcelGo Logistics', 'parcelgo@bizlink.ph', 'https://i.pravatar.cc/100?img=67', 'Nationwide last-mile network built for SME e-commerce.'],
            'brand-5' => ['TastyBox Meals', 'tastybox@bizlink.ph', 'https://i.pravatar.cc/100?img=23', 'HACCP-certified cloud kitchen feeding Metro Manila offices daily.'],
            'brand-6' => ['EduSpark Learning', 'eduspark@bizlink.ph', 'https://i.pravatar.cc/100?img=48', 'STEM and literacy programs trusted by 5,000+ parents.'],
            'brand-7' => ['UrbanThread', 'urbanthread@bizlink.ph', 'https://i.pravatar.cc/100?img=19', 'Manila streetwear label dropping limited runs monthly.'],
            'brand-8' => ['AquaPure Water', 'aquapure@bizlink.ph', 'https://i.pravatar.cc/100?img=68', 'Purified water stations serving 40 barangays and counting.'],
        ];
    }

    public function brandAccounts2(): array
    {
        return [
            'brand-9' => ['Suds&Spin Laundry', 'sudsspin@bizlink.ph', 'https://i.pravatar.cc/100?img=20', 'Coinless laundromats beside dorms and condos.'],
            'brand-10' => ['LashLuxe Salon', 'lashluxe@bizlink.ph', 'https://i.pravatar.cc/100?img=25', 'Premium lash and nail studios with certified artists.'],
            'brand-11' => ['MilkTeaGo', 'milkteago@bizlink.ph', 'https://i.pravatar.cc/100?img=29', 'Milk tea kiosks pouring 10,000 cups a day nationwide.'],
            'brand-12' => ['BuildRight Hardware', 'buildright@bizlink.ph', 'https://i.pravatar.cc/100?img=36', 'Contractor-priced hardware depot for provincial builders.'],
            'brand-13' => ['MediPlus Pharmacy', 'mediplus@bizlink.ph', 'https://i.pravatar.cc/100?img=41', 'Community drugstores with licensed pharmacists on every shift.'],
            'brand-14' => ['SparkleWash Auto', 'sparklewash@bizlink.ph', 'https://i.pravatar.cc/100?img=47', 'Water-efficient car wash bays with fleet contracts.'],
            'brand-15' => ['CrumbCakes Bakery', 'crumbcakes@bizlink.ph', 'https://i.pravatar.cc/100?img=53', 'Overnight bakery commissary supplying cafes before sunrise.'],
            'brand-16' => ['PrintFast Hub', 'printfast@bizlink.ph', 'https://i.pravatar.cc/100?img=59', 'Rush printing hub for schools and business districts.'],
        ];
    }

    public function ensureBrandUsers(): array
    {
        $out = [];
        foreach (array_merge($this->brandAccounts(), $this->brandAccounts2()) as $slug => [$name, $email, $avatar, $bio]) {
            $user = User::firstOrCreate(['email' => $email], [
                'name' => $name, 'password' => Hash::make('password123'),
                'avatar' => $avatar, 'bio' => $bio, 'role' => 'brand',
                'email_verified_at' => now(),
            ]);
            if ($user->name !== $name || $user->avatar !== $avatar) {
                $user->update(['name' => $name, 'avatar' => $avatar]);
            }
            $out[$slug] = $user->fresh();
        }
        User::firstOrCreate(['email' => 'demo@bizlink.ph'], [
            'name' => 'Demo Entrepreneur', 'password' => Hash::make('password123'),
            'avatar' => 'https://i.pravatar.cc/100?img=12',
            'bio' => 'Aspiring franchise owner exploring food and service concepts across Luzon.',
            'role' => 'entrepreneur', 'email_verified_at' => now(),
        ]);
        return $out;
    }

    private function repairOpportunities(array $brandUsers): int
    {
        // Phase 1: canonical rows (id<=16) have exact brand_id brand-1..16.
        $fixed = 0;
        Opportunity::whereNull('user_id')->orderBy('id')->chunk(100, function ($rows) use ($brandUsers, &$fixed) {
            foreach ($rows as $opp) {
                $owner = $brandUsers[$opp->brand_id] ?? null;
                // DatabaseSeeder snapshot uses full brand name — exact match wins
                // over the drifted MorePostsSeeder brand_id (off-by-one legacy slug).
                $byName = User::where('name', $opp->brand_name)->first();
                if ($byName) {
                    $owner = $byName;
                }
                if (! $owner) {
                    continue;
                }
                $opp->update(['user_id' => $owner->id, 'brand_avatar' => $owner->avatar, 'brand_id' => $this->slugFor($brandUsers, $owner) ?? $opp->brand_id]);
                $fixed++;
            }
        });
        $canonicalByName = Opportunity::whereNotNull('user_id')->get()->keyBy('brand_name');
        Opportunity::whereNull('user_id')->orderBy('id')->chunk(100, function ($rows) use ($canonicalByName, &$fixed) {
            foreach ($rows as $opp) {
                $canon = $canonicalByName->get($opp->brand_name);
                if ($canon) {
                    $opp->update(['user_id' => $canon->user_id]);
                    $fixed++;
                    continue;
                }
                $byAvatar = User::where('avatar', $opp->brand_avatar)->where('role', 'brand')->first();
                if ($byAvatar) {
                    $opp->update(['user_id' => $byAvatar->id]);
                    $fixed++;
                }
            }
        });
        // Phase 2 (heal legacy off-by-one brand_id + brand_avatar on already-linked rows):
        // MorePostsSeeder wrote brand-2..brand-17 with the PREVIOUS brand's name,
        // and my first repair pass copied that wrong slug's user. brand_name is the
        // trustworthy snapshot, so re-link every seeder row by exact brand_name.
        $canonAll = Opportunity::where('id', '<=', 16)->get()->keyBy('brand_name');
        foreach (Opportunity::where('id', '>', 16)->orderBy('id')->get() as $opp) {
            $owner = $canonAll->get($opp->brand_name);
            if ($owner && (int) $opp->user_id !== (int) $owner->user_id) {
                $opp->update(['user_id' => $owner->user_id, 'brand_avatar' => $owner->avatar, 'brand_id' => $owner->brand_id]);
                $fixed++;
            }
        }
        return $fixed;
    }

    private function slugFor(array $brandUsers, User $owner): ?string
    {
        foreach ($brandUsers as $slug => $u) {
            if ((int) $u->id === (int) $owner->id) {
                return $slug;
            }
        }
        return null;
    }

    private function repairStories(array $brandUsers): int
    {
        $fixed = 0;
        Story::whereNull('user_id')->orderBy('id')->chunk(100, function ($rows) use ($brandUsers, &$fixed) {
            foreach ($rows as $s) {
                // brand_name snapshot wins over legacy drifted brand_id.
                $owner = User::where('name', $s->brand_name)->first() ?? ($brandUsers[$s->brand_id] ?? null);
                if (! $owner && $s->avatar) {
                    $owner = User::where('avatar', $s->avatar)->first();
                }
                if (! $owner) {
                    continue;
                }
                $slug = null;
                foreach ($brandUsers as $bslug => $u) {
                    if ((int) $u->id === (int) $owner->id) {
                        $slug = $bslug;
                        break;
                    }
                }
                $s->update(['user_id' => $owner->id, 'brand_id' => $slug ?? $s->brand_id]);
                $fixed++;
            }
        });
        // Heal already-linked drifted rows by exact brand_name.
        $canonAll = Opportunity::where('id', '<=', 16)->get()->keyBy('brand_name');
        foreach (Story::orderBy('id')->get() as $s) {
            $owner = $canonAll->get($s->brand_name) ?? User::where('name', $s->brand_name)->first();
            if ($owner && (int) $s->user_id !== (int) $owner->id) {
                $slug = null;
                foreach ($brandUsers as $bslug => $u) {
                    if ((int) $u->id === (int) $owner->id) {
                        $slug = $bslug;
                        break;
                    }
                }
                $s->update(['user_id' => $owner->id, 'brand_id' => $slug ?? $s->brand_id]);
                $fixed++;
            }
        }
        return $fixed;
    }

    private function repairComments(): int
    {
        $fixed = 0;
        $byName = User::all()->keyBy('name');
        Comment::whereNull('user_id')->orderBy('id')->chunk(100, function ($rows) use ($byName, &$fixed) {
            foreach ($rows as $c) {
                $owner = $byName->get($c->author);
                if ($owner) {
                    $c->update(['user_id' => $owner->id]);
                    $fixed++;
                }
            }
        });
        return $fixed;
    }
}
