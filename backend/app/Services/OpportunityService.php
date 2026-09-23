<?php

namespace App\Services;

use App\Models\Opportunity;
use App\Models\HiddenOpportunity;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

/**
 * Personalized feed ranking, modeled on how Facebook/Instagram rank Feed:
 *
 *   1. Candidate generation  — base filters (type, search, category, follows, hidden).
 *   2. Signals               — explicit preferences (follows, categories, budget),
 *                              implicit behavior (likes, saves, inquiries),
 *                              post info (recency decay, engagement velocity,
 *                              verified trust).
 *   3. Scoring               — weighted sum into a single affinity score.
 *   4. Diversity re-rank     — progressive penalty for repeat authors so one
 *                              brand can't crowd out a whole page.
 *
 * Guests (no viewer) get the "unconnected" variant: freshness + velocity only.
 */
class OpportunityService
{
    public function getFeed(Request $request, $viewer)
    {
        $signals = $this->collectSignals($viewer);
        $scoreExpr = $this->scoreExpression($signals);

        $base = DB::table('opportunities')
            ->select('id', 'user_id', 'brand_id', 'category', 'created_at')
            ->selectRaw("({$scoreExpr}) AS base_score");

        $this->applyFilters($base, $request, $viewer, $signals);

        // Diversity re-rank: 2nd+ post from the same author loses 6 pts each (cap 18).
        $ranked = DB::query()->fromSub($base, 's')
            ->select('*')
            ->selectRaw('ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY base_score DESC, created_at DESC, id DESC) AS author_rn');

        $final = DB::query()->fromSub($ranked, 'r')
            ->select('*')
            ->selectRaw('(base_score - LEAST(18, 6 * (author_rn - 1))) AS affinity_score')
            ->orderByDesc('affinity_score')
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        $perPage = (int) $request->query('per_page', 20);
        $perPage = max(1, min(50, $perPage));
        $page = max(1, (int) $request->query('page', 1));

        $total = (clone $base)->count();
        $ids = (clone $final)->forPage($page, $perPage)->pluck('id')->map(fn($v) => (int) $v)->all();

        $models = empty($ids)
            ? collect()
            : Opportunity::with(['user:id,name,username,avatar', 'comments.user:id,username'])
                ->withCount(['likedBy', 'savedBy', 'comments'])
                ->whereIn('id', $ids)
                ->get()
                ->sortBy(fn($o) => array_search((int) $o->id, $ids))
                ->values();

        $paginator = new LengthAwarePaginator($models, $total, $perPage, $page, [
            'path' => $request->url(),
            'query' => $request->query(),
        ]);

        return [
            'paginator' => $paginator,
            'preferredBrands' => $signals['followedSlugs'],
            'preferredCategories' => $signals['preferredCategories'],
            'preferredIds' => $this->preferredIds($models, $signals),
            'reasons' => $this->matchReasons($models, $signals),
        ];
    }

    /**
     * Gather every ranking signal for the viewer up front so scoring stays
     * a pure function of precomputed sets (like IG's feature extraction).
     */
    private function collectSignals($viewer): array
    {
        $signals = [
            'followedSlugs' => [],
            'followedUserIds' => [],
            'preferredCategories' => [],
            'preferredCategoriesNorm' => [],
            'budgetMin' => null,
            'budgetMax' => null,
            'implicitUserIds' => [],
            'implicitSlugs' => [],
            'implicitCategoriesNorm' => [],
        ];

        if (!$viewer) {
            return $signals;
        }

        // Explicit: follows. The app follows by author ("brand-{userId}"),
        // so normalize to the followed author's user id. Raw slugs that
        // don't parse are kept as-is for forward compatibility.
        $followedSlugs = DB::table('follows')->where('user_id', $viewer->id)->pluck('brand_id')->map(fn($b) => (string) $b)->all();
        $signals['followedSlugs'] = $followedSlugs;
        $rawSlugs = [];
        foreach ($followedSlugs as $slug) {
            if (preg_match('/^brand-(\d+)$/', $slug, $m)) {
                $signals['followedUserIds'][] = (int) $m[1];
            } else {
                $rawSlugs[] = $slug;
            }
        }
        $signals['followedUserIds'] = array_values(array_unique($signals['followedUserIds']));
        $signals['followedRawSlugs'] = array_values(array_unique($rawSlugs));

        // Explicit: preference center categories + budget.
        $pref = $viewer->preference;
        $cats = ($pref && is_array($pref->categories))
            ? array_values(array_filter($pref->categories, fn($c) => is_string($c) && $c !== ''))
            : [];
        $signals['preferredCategories'] = $cats;
        $signals['preferredCategoriesNorm'] = array_map(fn($c) => mb_strtolower(trim($c)), $cats);
        $signals['budgetMin'] = self::parseMoney($pref?->budget_min ?? null);
        $signals['budgetMax'] = self::parseMoney($pref?->budget_max ?? null);

        // Implicit: brands/categories the viewer engaged with (IG's "your
        // activity" signal). Likes/saves/inquiries predict future interest.
        $likedIds = $viewer->likedOpportunities()->pluck('opportunities.id')->all();
        $savedIds = $viewer->savedOpportunities()->pluck('opportunities.id')->all();
        $engagedOppIds = array_values(array_unique(array_merge($likedIds, $savedIds)));

        $implicitUserIds = [];
        $implicitSlugs = [];
        $implicitCats = [];
        if (!empty($engagedOppIds)) {
            $rows = DB::table('opportunities')->whereIn('id', $engagedOppIds)->get(['user_id', 'brand_id', 'category']);
            foreach ($rows as $row) {
                $implicitUserIds[] = (int) $row->user_id;
                $implicitSlugs[] = (string) $row->brand_id;
                if (is_string($row->category) && $row->category !== '') {
                    $implicitCats[] = mb_strtolower(trim($row->category));
                }
            }
        }

        // Inquiries are the strongest intent signal (like IG "sends").
        $inquiredOppIds = DB::table('conversations')->where('user_id', $viewer->id)->whereNotNull('opportunity_id')->pluck('opportunity_id')->all();
        if (!empty($inquiredOppIds)) {
            $rows = DB::table('opportunities')->whereIn('id', $inquiredOppIds)->get(['user_id', 'brand_id', 'category']);
            foreach ($rows as $row) {
                $implicitUserIds[] = (int) $row->user_id;
                $implicitSlugs[] = (string) $row->brand_id;
                if (is_string($row->category) && $row->category !== '') {
                    $implicitCats[] = mb_strtolower(trim($row->category));
                }
            }
        }

        // Keep implicit strictly "unconnected": strip anything already followed.
        $signals['implicitUserIds'] = array_values(array_diff(array_unique($implicitUserIds), $signals['followedUserIds']));
        $signals['implicitSlugs'] = array_values(array_diff(array_unique($implicitSlugs), $followedSlugs));
        $signals['implicitCategoriesNorm'] = array_values(array_diff(array_unique($implicitCats), $signals['preferredCategoriesNorm']));

        return $signals;
    }

    /**
     * Weighted-sum score expression. Weights mirror IG's rough priority:
     * relationship/explicit prefs first, then behavior, then post quality.
     */
    private function scoreExpression(array $s): string
    {
        $parts = [];

        // +60 followed author (connected reach: relationship wins).
        // Author-exact: a follow means "this account", never "this slug",
        // so mislabeled brand_ids can't leak other authors' posts in.
        if (!empty($s['followedUserIds']) || !empty($s['followedRawSlugs'])) {
            $conds = [];
            if (!empty($s['followedUserIds'])) {
                $conds[] = 'user_id IN (' . implode(',', array_map('intval', $s['followedUserIds'])) . ')';
            }
            if (!empty($s['followedRawSlugs'])) {
                $conds[] = 'brand_id IN (' . implode(',', array_map($this->quote(), $s['followedRawSlugs'])) . ')';
            }
            $parts[] = 'IF(' . implode(' OR ', $conds) . ', 60, 0)';
        }

        // +35 explicit category match (normalized, like IG's interest topics).
        if (!empty($s['preferredCategoriesNorm'])) {
            $parts[] = 'IF(LOWER(TRIM(category)) IN (' . implode(',', array_map($this->quote(), $s['preferredCategoriesNorm'])) . '), 35, 0)';
        }

        // +25 budget fit / +10 near-miss (previously stored but never scored).
        $parts[] = $this->budgetExpression($s['budgetMin'], $s['budgetMax']);

        // +20 implicitly engaged brand (unconnected discovery).
        if (!empty($s['implicitUserIds']) || !empty($s['implicitSlugs'])) {
            $conds = [];
            if (!empty($s['implicitUserIds'])) {
                $conds[] = 'user_id IN (' . implode(',', array_map('intval', $s['implicitUserIds'])) . ')';
            }
            if (!empty($s['implicitSlugs'])) {
                $conds[] = 'brand_id IN (' . implode(',', array_map($this->quote(), $s['implicitSlugs'])) . ')';
            }
            $parts[] = 'IF(' . implode(' OR ', $conds) . ', 20, 0)';
        }

        // +12 implicitly engaged category.
        if (!empty($s['implicitCategoriesNorm'])) {
            $parts[] = 'IF(LOWER(TRIM(category)) IN (' . implode(',', array_map($this->quote(), $s['implicitCategoriesNorm'])) . '), 12, 0)';
        }

        // Recency decay: +15 fresh, fading to 0 after ~15 days (IG: fresh wins).
        $parts[] = 'GREATEST(0, 15 - TIMESTAMPDIFF(DAY, created_at, NOW()))';

        // Engagement velocity: likes/saves/comments so far (IG: how quickly
        // people engage). Capped so mega-posts can't dominate forever.
        $parts[] = 'LEAST(15, likes_count * 0.05 + saves_count * 0.1 + (SELECT COUNT(*) FROM comments WHERE comments.opportunity_id = opportunities.id) * 0.5)';

        // Trust: verified brands get a small boost (IG demotes problematic).
        $parts[] = 'IF(verified, 3, 0)';

        return implode(' + ', $parts);
    }

    private function budgetExpression(?float $min, ?float $max): string
    {
        if ($min === null && $max === null) {
            return '0';
        }
        // Parse "₱850K" / "₱1.2M" / plain numbers into pesos.
        $cap = "CAST(NULLIF(REGEXP_REPLACE(capital_required, '[^0-9.]', ''), '') AS DECIMAL(14,2))"
            . " * CASE WHEN capital_required LIKE '%m%' THEN 1000000"
            . " WHEN capital_required LIKE '%k%' THEN 1000 ELSE 1 END";
        $hasCap = "capital_required IS NOT NULL AND REGEXP_REPLACE(capital_required, '[^0-9.]', '') <> ''";

        if ($min !== null && $max !== null) {
            [$lo, $hi] = $min <= $max ? [$min, $max] : [$max, $min];
            return "CASE WHEN NOT ({$hasCap}) THEN 0"
                . " WHEN {$cap} BETWEEN {$lo} AND {$hi} THEN 25"
                . " WHEN {$cap} BETWEEN " . ($lo * 0.7) . " AND " . ($hi * 1.3) . " THEN 10 ELSE 0 END";
        }
        if ($min !== null) {
            return "CASE WHEN NOT ({$hasCap}) THEN 0"
                . " WHEN {$cap} >= {$min} THEN 25"
                . " WHEN {$cap} >= " . ($min * 0.7) . " THEN 10 ELSE 0 END";
        }
        return "CASE WHEN NOT ({$hasCap}) THEN 0"
            . " WHEN {$cap} <= {$max} THEN 25"
            . " WHEN {$cap} <= " . ($max * 1.3) . " THEN 10 ELSE 0 END";
    }

    private function applyFilters($query, Request $request, $viewer, array $signals): void
    {
        if ($type = $request->query('type')) {
            if ($type !== 'All' && $type !== 'Following') {
                $query->where('type', $type);
            }
        }

        if ($search = $request->query('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('brand_name', 'like', "%{$search}%")
                  ->orWhere('headline', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%");
            });
        }

        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }

        if ($userId = $request->query('user_id')) {
            $query->where('user_id', $userId);
        }

        if ($brandId = $request->query('brand_id')) {
            $query->where('brand_id', $brandId);
        }

        if ($mediaType = $request->query('mediaType')) {
            $query->where('media_type', $mediaType);
        }

        if ($viewer) {
            $hiddenIds = HiddenOpportunity::where('user_id', $viewer->id)->pluck('opportunity_id')->toArray();
            if (!empty($hiddenIds)) {
                $query->whereNotIn('opportunities.id', $hiddenIds);
            }
        }

        // "Following" = posts by followed authors (fixed: previously matched
        // only raw brand slugs, which miss posts whose slug ≠ author).
        if ($request->query('following') || $request->query('type') === 'Following') {
            if (empty($signals['followedUserIds']) && empty($signals['followedRawSlugs'])) {
                $query->whereRaw('0 = 1');
            } else {
                $query->where(function ($q) use ($signals) {
                    if (!empty($signals['followedUserIds'])) {
                        $q->whereIn('opportunities.user_id', $signals['followedUserIds']);
                    }
                    if (!empty($signals['followedRawSlugs'])) {
                        $q->orWhereIn('opportunities.brand_id', $signals['followedRawSlugs']);
                    }
                });
            }
        }
    }

    /**
     * Ids with at least one positive affinity reason (explicit or implicit).
     * Pure recency/velocity/trust alone doesn't mark "For you".
     */
    private function preferredIds($models, array $signals): array
    {
        $ids = [];
        foreach ($models as $o) {
            if (!empty($this->reasonsFor($o, $signals))) {
                $ids[] = $o->id;
            }
        }
        return $ids;
    }

    private function matchReasons($models, array $signals): array
    {
        $map = [];
        foreach ($models as $o) {
            $reasons = $this->reasonsFor($o, $signals);
            if (!empty($reasons)) {
                $map[$o->id] = $reasons;
            }
        }
        return $map;
    }

    private function reasonsFor($o, array $signals): array
    {
        $reasons = [];
        $catNorm = is_string($o->category) ? mb_strtolower(trim($o->category)) : '';

        if (in_array((int) $o->user_id, $signals['followedUserIds'], true)
            || (!empty($signals['followedRawSlugs']) && in_array((string) $o->brand_id, $signals['followedRawSlugs'], true))) {
            $reasons[] = 'Following';
        }
        if ($catNorm !== '' && in_array($catNorm, $signals['preferredCategoriesNorm'], true)) {
            $reasons[] = 'Preferred category';
        }
        if ($this->budgetFits($o->capital_required ?? null, $signals['budgetMin'], $signals['budgetMax'])) {
            $reasons[] = 'Budget fit';
        }
        if (in_array((int) $o->user_id, $signals['implicitUserIds'], true)
            || in_array((string) $o->brand_id, $signals['implicitSlugs'], true)) {
            $reasons[] = 'Similar to liked';
        } elseif ($catNorm !== '' && in_array($catNorm, $signals['implicitCategoriesNorm'], true)) {
            $reasons[] = 'Similar to liked';
        }
        return array_values(array_unique($reasons));
    }

    private function budgetFits(?string $capital, ?float $min, ?float $max): bool
    {
        if ($min === null && $max === null) {
            return false;
        }
        $cap = self::parseCapital($capital);
        if ($cap === null) {
            return false;
        }
        if ($min !== null && $max !== null) {
            [$lo, $hi] = $min <= $max ? [$min, $max] : [$max, $min];
            return $cap >= $lo && $cap <= $hi;
        }
        if ($min !== null) {
            return $cap >= $min;
        }
        return $cap <= $max;
    }

    public static function parseCapital(?string $value): ?float
    {
        if ($value === null || trim($value) === '') {
            return null;
        }
        if (!preg_match('/[\d,.]+/', trim($value), $m)) {
            return null;
        }
        $num = (float) str_replace(',', '', $m[0]);
        $lower = mb_strtolower(trim($value));
        if (str_contains($lower, 'm')) {
            $num *= 1000000;
        } elseif (str_contains($lower, 'k')) {
            $num *= 1000;
        }
        return $num;
    }

    public static function parseMoney($value): ?float
    {
        if ($value === null) {
            return null;
        }
        if (is_numeric($value)) {
            return (float) $value;
        }
        return self::parseCapital(is_string($value) ? $value : null);
    }

    private function quote(): callable
    {
        return fn($v) => "'" . str_replace("'", "''", (string) $v) . "'";
    }
}
