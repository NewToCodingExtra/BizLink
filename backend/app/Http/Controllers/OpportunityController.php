<?php

namespace App\Http\Controllers;

use App\Models\Opportunity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OpportunityController extends Controller
{
    public function index(Request $request)
    {
        $query = Opportunity::with(['user:id,name,avatar', 'comments'])->withCount(['likedBy', 'savedBy']);

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

        $viewer = Auth::guard('sanctum')->user() ?? $request->user();

        if ($request->query('following') && $viewer) {
            $brands = \DB::table('follows')->where('user_id', $viewer->id)->pluck('brand_id');
            if ($brands->isNotEmpty()) {
                $query->whereIn('brand_id', $brands);
            } else {
                $query->whereRaw('0 = 1');
            }
        }

        $perPage = (int) $request->query('per_page', 20);
        $perPage = max(1, min(50, $perPage));

        $opps = $query->latest()->paginate($perPage);

        $user = $viewer;
        $likedIds = $user ? $user->likedOpportunities()->pluck('opportunities.id')->toArray() : [];
        $savedIds = $user ? $user->savedOpportunities()->pluck('opportunities.id')->toArray() : [];

        $data = $opps->getCollection()->map(fn($o) => $this->serialize($o, $likedIds, $savedIds));

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $opps->currentPage(),
                'last_page' => $opps->lastPage(),
                'per_page' => $opps->perPage(),
                'total' => $opps->total(),
            ],
        ]);
    }

    public function show(Request $request, Opportunity $opportunity)
    {
        $opportunity->load(['user:id,name,avatar', 'comments.user:id,name,avatar']);
        $user = Auth::guard('sanctum')->user() ?? $request->user();
        $likedIds = $user ? [$opportunity->id => $user->likedOpportunities()->where('opportunity_id', $opportunity->id)->exists()] : [];
        $savedIds = $user ? [$opportunity->id => $user->savedOpportunities()->where('opportunity_id', $opportunity->id)->exists()] : [];
        $liked = $user ? $user->likedOpportunities()->where('opportunity_id', $opportunity->id)->exists() : false;
        $saved = $user ? $user->savedOpportunities()->where('opportunity_id', $opportunity->id)->exists() : false;

        $payload = $this->serialize($opportunity, [], []);
        $payload['liked'] = $liked;
        $payload['saved'] = $saved;

        return response()->json(['data' => $payload]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'type' => 'required|string|in:Franchise,Wholesale,Resell',
            'category' => 'nullable|string|max:255',
            'headline' => 'required|string|max:255',
            'capital_required' => 'nullable|string|max:255',
            'roi' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:2000',
            'image' => 'nullable|string|max:2048',
            'media_type' => 'sometimes|string|in:image,video',
            'video_url' => 'nullable|string|max:2048',
            'brand_name' => 'sometimes|string|max:255',
            'brand_avatar' => 'sometimes|string|max:2048',
        ]);

        $user = $request->user();

        $opp = Opportunity::create([
            'user_id' => $user->id,
            'brand_name' => $data['brand_name'] ?? $user->name,
            'brand_avatar' => $data['brand_avatar'] ?? ($user->avatar ?: 'https://i.pravatar.cc/100?u=' . $user->id),
            'brand_id' => 'brand-' . $user->id,
            'type' => $data['type'],
            'category' => $data['category'] ?? 'General',
            'headline' => $data['headline'],
            'capital_required' => $data['capital_required'] ?? null,
            'roi' => $data['roi'] ?? null,
            'description' => $data['description'] ?? null,
            'image' => $data['image'] ?? 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80&auto=format&fit=crop',
            'media_type' => $data['media_type'] ?? 'image',
            'video_url' => $data['video_url'] ?? null,
            'featured' => false,
            'verified' => false,
            'likes_count' => 0,
            'saves_count' => 0,
            'is_new' => true,
        ]);

        if ($user) {
            \App\Models\AppNotification::create([
                'user_id' => $user->id,
                'type' => 'new_post',
                'message' => "Your opportunity \"{$opp->headline}\" is live on the feed",
                'read' => false,
            ]);
        }

        return response()->json(['data' => $this->serialize($opp, [], [])], 201);
    }

    public function toggleLike(Request $request, Opportunity $opportunity)
    {
        $user = $request->user();
        $exists = $user->likedOpportunities()->where('opportunity_id', $opportunity->id)->exists();
        if ($exists) {
            $user->likedOpportunities()->detach($opportunity->id);
            $opportunity->decrement('likes_count');
            $liked = false;
        } else {
            $user->likedOpportunities()->attach($opportunity->id);
            $opportunity->increment('likes_count');
            $liked = true;
        }
        $opportunity->refresh();
        return response()->json(['liked' => $liked, 'likes_count' => $opportunity->likes_count]);
    }

    public function toggleSave(Request $request, Opportunity $opportunity)
    {
        $user = $request->user();
        $exists = $user->savedOpportunities()->where('opportunity_id', $opportunity->id)->exists();
        if ($exists) {
            $user->savedOpportunities()->detach($opportunity->id);
            $opportunity->decrement('saves_count');
            $saved = false;
        } else {
            $user->savedOpportunities()->attach($opportunity->id);
            $opportunity->increment('saves_count');
            $saved = true;
        }
        $opportunity->refresh();
        return response()->json(['saved' => $saved, 'saves_count' => $opportunity->saves_count]);
    }

    public function saved(Request $request)
    {
        $user = $request->user();
        $opps = $user->savedOpportunities()->with(['user:id,name,avatar', 'comments'])->latest('opportunity_user_saves.created_at')->paginate(20);
        $likedIds = $user->likedOpportunities()->pluck('opportunities.id')->toArray();
        $savedIds = $user->savedOpportunities()->pluck('opportunities.id')->toArray();
        $data = $opps->getCollection()->map(fn($o) => $this->serialize($o, $likedIds, $savedIds));
        return response()->json(['data' => $data, 'meta' => ['total' => $opps->total()]]);
    }

    private function serialize(Opportunity $o, array $likedIds, array $savedIds): array
    {
        return [
            'id' => $o->id,
            'authorId' => $o->user_id,
            'user' => $o->relationLoaded('user') && $o->user ? [
                'id' => $o->user->id,
                'name' => $o->user->name,
                'avatar' => $o->user->avatar,
            ] : null,
            'brandName' => $o->brand_name,
            'brandAvatar' => $o->brand_avatar,
            'brandId' => $o->brand_id,
            'type' => $o->type,
            'category' => $o->category,
            'headline' => $o->headline,
            'capitalRequired' => $o->capital_required,
            'roi' => $o->roi,
            'description' => $o->description,
            'image' => $o->image,
            'mediaType' => $o->media_type,
            'videoUrl' => $o->video_url,
            'featured' => (bool) $o->featured,
            'verified' => (bool) $o->verified,
            'likes' => (int) $o->likes_count,
            'saves' => (int) $o->saves_count,
            'isNew' => (bool) $o->is_new,
            'liked' => in_array($o->id, $likedIds),
            'saved' => in_array($o->id, $savedIds),
            'createdAt' => $o->created_at,
            'comments' => $o->relationLoaded('comments') ? $o->comments->map(fn($c) => [
                'id' => $c->id,
                'postId' => $c->opportunity_id,
                'author' => $c->author,
                'avatar' => $c->avatar,
                'text' => $c->text,
                'timestamp' => $c->created_at?->diffForHumans(),
                'isSellerReply' => (bool) $c->is_seller_reply,
            ])->values() : [],
        ];
    }
}
