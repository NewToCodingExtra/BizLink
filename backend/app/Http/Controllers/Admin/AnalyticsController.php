<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Conversation;
use App\Models\Opportunity;
use App\Models\Report;
use App\Models\ReportCategory;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AnalyticsController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()?->can('users.manage'), 403, 'Admin access only.');

        $range = $request->input('range', '30d');
        $days = match ($range) {
            '7d' => 7,
            '90d' => 90,
            default => 30,
        };

        $cacheKey = "admin_analytics_v1_{$days}";
        $data = Cache::remember($cacheKey, 300, function () use ($days) {
            $now = Carbon::now();
            $startDate = $now->copy()->subDays($days)->startOfDay();
            $prevStartDate = $startDate->copy()->subDays($days);

            // 1. Core KPIs
            $signupsCurrent = User::where('created_at', '>=', $startDate)->count();
            $signupsPrev = User::whereBetween('created_at', [$prevStartDate, $startDate])->count();
            $signupsDelta = $signupsPrev > 0 ? round((($signupsCurrent - $signupsPrev) / $signupsPrev) * 100, 1) : 0;

            $postsCurrent = Opportunity::where('created_at', '>=', $startDate)->count();
            $postsPrev = Opportunity::whereBetween('created_at', [$prevStartDate, $startDate])->count();
            $postsDelta = $postsPrev > 0 ? round((($postsCurrent - $postsPrev) / $postsPrev) * 100, 1) : 0;

            $inquiriesCurrent = Conversation::where('created_at', '>=', $startDate)->count();

            $reportsTotal = Report::where('created_at', '>=', $startDate)->count();
            $reportsResolved = Report::where('status', '!=', 'pending')->where('created_at', '>=', $startDate)->count();
            $reportsAccepted = Report::where('status', 'accepted')->where('created_at', '>=', $startDate)->count();
            $resolutionRate = $reportsTotal > 0 ? round(($reportsResolved / $reportsTotal) * 100, 1) : 100;
            $acceptanceRate = $reportsResolved > 0 ? round(($reportsAccepted / $reportsResolved) * 100, 1) : 0;

            // 2. Daily time series (signups and posts per day)
            $dailyStats = [];
            for ($i = $days - 1; $i >= 0; $i--) {
                $day = $now->copy()->subDays($i)->format('Y-m-d');
                $dailyStats[$day] = [
                    'date' => Carbon::parse($day)->format('M d'),
                    'signups' => 0,
                    'posts' => 0,
                ];
            }

            $usersByDay = User::where('created_at', '>=', $startDate)
                ->selectRaw('DATE(created_at) as day, count(*) as count')
                ->groupBy('day')
                ->pluck('count', 'day');

            $postsByDay = Opportunity::where('created_at', '>=', $startDate)
                ->selectRaw('DATE(created_at) as day, count(*) as count')
                ->groupBy('day')
                ->pluck('count', 'day');

            foreach ($dailyStats as $rawDate => &$item) {
                if (isset($usersByDay[$rawDate])) {
                    $item['signups'] = (int) $usersByDay[$rawDate];
                }
                if (isset($postsByDay[$rawDate])) {
                    $item['posts'] = (int) $postsByDay[$rawDate];
                }
            }
            unset($item);
            $timeSeries = array_values($dailyStats);

            // 3. Category Breakdown for Opportunities
            $typeDistribution = Opportunity::groupBy('type')
                ->selectRaw('type, count(*) as count')
                ->pluck('count', 'type')
                ->toArray();

            // 4. Reports by Category
            $reportsByCategory = ReportCategory::withCount(['reports' => function ($q) use ($startDate) {
                $q->where('created_at', '>=', $startDate);
            }])
                ->get()
                ->map(fn($c) => [
                    'key' => $c->key,
                    'label' => $c->label,
                    'severity' => (int) $c->severity,
                    'count' => (int) $c->reports_count,
                ])
                ->sortByDesc('count')
                ->values()
                ->all();

            // 5. Moderation resolution outcomes (pie chart data)
            $resolutionOutcomes = [
                ['name' => 'Accepted', 'value' => Report::where('status', 'accepted')->count(), 'color' => '#10B981'],
                ['name' => 'Rejected', 'value' => Report::where('status', 'rejected')->count(), 'color' => '#64748B'],
                ['name' => 'Pending', 'value' => Report::where('status', 'pending')->count(), 'color' => '#F59E0B'],
            ];

            // 6. Leaderboards
            $topOpportunities = Opportunity::with('user:id,name,username')
                ->orderByDesc('likes_count')
                ->limit(5)
                ->get(['id', 'slug', 'brand_name', 'headline', 'type', 'likes_count', 'saves_count', 'verified'])
                ->map(fn($o) => [
                    'id' => $o->id,
                    'slug' => $o->slug,
                    'headline' => $o->headline,
                    'brandName' => $o->brand_name,
                    'type' => $o->type,
                    'likes' => (int) $o->likes_count,
                    'saves' => (int) $o->saves_count,
                    'verified' => (bool) $o->verified,
                ]);

            $topBrands = User::role('Manager')
                ->withCount('opportunities')
                ->orderByDesc('opportunities_count')
                ->limit(5)
                ->get(['id', 'name', 'username', 'avatar', 'is_brand_verified', 'created_at'])
                ->map(fn($b) => [
                    'id' => $b->id,
                    'name' => $b->name,
                    'username' => $b->username,
                    'avatar' => $b->avatar,
                    'isBrandVerified' => (bool) $b->is_brand_verified,
                    'postsCount' => (int) $b->opportunities_count,
                ]);

            return [
                'kpis' => [
                    'signups' => [
                        'value' => $signupsCurrent,
                        'delta' => $signupsDelta,
                        'label' => 'New Accounts',
                    ],
                    'posts' => [
                        'value' => $postsCurrent,
                        'delta' => $postsDelta,
                        'label' => 'Opportunities Posted',
                    ],
                    'inquiries' => [
                        'value' => $inquiriesCurrent,
                        'label' => 'Conversations Started',
                    ],
                    'resolutionRate' => [
                        'value' => $resolutionRate,
                        'label' => 'Resolution Rate %',
                    ],
                    'acceptanceRate' => [
                        'value' => $acceptanceRate,
                        'label' => 'Accepted Action %',
                    ],
                ],
                'timeSeries' => $timeSeries,
                'typeDistribution' => $typeDistribution,
                'reportsByCategory' => $reportsByCategory,
                'resolutionOutcomes' => $resolutionOutcomes,
                'topOpportunities' => $topOpportunities,
                'topBrands' => $topBrands,
            ];
        });

        return Inertia::render('Admin/Analytics', [
            'data' => $data,
            'currentRange' => $range,
        ]);
    }
}
