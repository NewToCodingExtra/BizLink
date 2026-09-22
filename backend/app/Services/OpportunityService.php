<?php

namespace App\Services;

use App\Models\Opportunity;
use App\Models\HiddenOpportunity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OpportunityService
{
    public function getFeed(Request $request, $viewer)
    {
        $query = Opportunity::with(['user:id,name,avatar', 'comments'])
            ->withCount(['likedBy', 'savedBy', 'comments']);

        // Base filters
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

        // Following feed filter
        $preferredBrands = [];
        $preferredCategories = [];
        $hiddenIds = [];

        if ($viewer) {
            $preferredBrands = DB::table('follows')->where('user_id', $viewer->id)->pluck('brand_id')->map(fn($b) => (string) $b)->toArray();
            $pref = $viewer->preference;
            if ($pref && is_array($pref->categories)) {
                $preferredCategories = array_values(array_filter($pref->categories, fn($c) => is_string($c) && $c !== ''));
            }
            $hiddenIds = HiddenOpportunity::where('user_id', $viewer->id)->pluck('opportunity_id')->toArray();

            // Filter by following
            if ($request->query('following') || $request->query('type') === 'Following') {
                if (empty($preferredBrands)) {
                    $query->whereRaw('0 = 1'); // Return empty if not following any brands
                } else {
                    $query->whereIn('brand_id', $preferredBrands);
                }
            }

            // Exclude hidden opportunities
            if (!empty($hiddenIds)) {
                $query->whereNotIn('id', $hiddenIds);
            }
        }

        // Enhanced Preference Algorithm
        if ($viewer && (count($preferredBrands) > 0 || count($preferredCategories) > 0)) {
            $quote = fn($v) => "'" . str_replace("'", "''", $v) . "'";
            $scoreParts = [];
            
            if (count($preferredBrands) > 0) {
                $brandList = implode(',', array_map($quote, $preferredBrands));
                $scoreParts[] = "IF(brand_id IN ($brandList), 50, 0)";
            }
            
            if (count($preferredCategories) > 0) {
                $catList = implode(',', array_map($quote, $preferredCategories));
                $scoreParts[] = "IF(category IN ($catList), 30, 0)";
            }

            if (count($scoreParts) > 0) {
                $scoreSql = implode(' + ', $scoreParts);
                $query->select('*', DB::raw("($scoreSql) as affinity_score"))
                      ->orderBy('affinity_score', 'desc');
            }
        }

        // Always order by latest as secondary sort
        $query->orderBy('created_at', 'desc');

        $perPage = (int) $request->query('per_page', 20);
        $perPage = max(1, min(50, $perPage));

        return [
            'paginator' => $query->paginate($perPage),
            'preferredBrands' => $preferredBrands,
            'preferredCategories' => $preferredCategories,
        ];
    }
}
