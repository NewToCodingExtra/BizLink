<?php

namespace App\Http\Controllers;

use App\Models\Opportunity;
use App\Models\HiddenOpportunity;
use App\Models\AppNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Services\OpportunityService;
use App\Http\Resources\OpportunityResource;

class OpportunityController extends Controller
{
    protected $service;

    public function __construct(OpportunityService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        $viewer = Auth::guard('sanctum')->user() ?? $request->user();
        $result = $this->service->getFeed($request, $viewer);
        
        $paginator = $result['paginator'];
        $preferredIds = $result['preferredIds'] ?? [];
        $reasons = $result['reasons'] ?? [];

        $likedIds = $viewer ? $viewer->likedOpportunities()->pluck('opportunities.id')->toArray() : [];
        $savedIds = $viewer ? $viewer->savedOpportunities()->pluck('opportunities.id')->toArray() : [];

        // Attach additional data for resource
        $paginator->getCollection()->transform(function ($o) use ($likedIds, $savedIds, $preferredIds, $reasons) {
            $o->additional = [
                'likedIds' => $likedIds,
                'savedIds' => $savedIds,
                'preferredIds' => $preferredIds,
                'reasons' => $reasons[$o->id] ?? [],
            ];
            return $o;
        });

        return OpportunityResource::collection($paginator);
    }

    public function show(Request $request, Opportunity $opportunity)
    {
        $opportunity->load(['user:id,name,username,avatar', 'comments.user:id,name,username,avatar']);
        $user = Auth::guard('sanctum')->user() ?? $request->user();
        
        $likedIds = $user ? [$opportunity->id => $user->likedOpportunities()->where('opportunity_id', $opportunity->id)->exists()] : [];
        $savedIds = $user ? [$opportunity->id => $user->savedOpportunities()->where('opportunity_id', $opportunity->id)->exists()] : [];
        $liked = $user ? $user->likedOpportunities()->where('opportunity_id', $opportunity->id)->exists() : false;
        $saved = $user ? $user->savedOpportunities()->where('opportunity_id', $opportunity->id)->exists() : false;

        $opportunity->additional = [
            'likedIds' => $liked ? [$opportunity->id] : [],
            'savedIds' => $saved ? [$opportunity->id] : [],
        ];

        $resource = new OpportunityResource($opportunity);
        $payload = $resource->resolve();
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

        $base = \Illuminate\Support\Str::slug($opp->headline ?: $opp->brand_name);
        if (empty($base)) $base = 'post';
        $opp->slug = $base . '-' . $opp->id;
        $opp->save();

        if ($user) {
            AppNotification::create([
                'user_id' => $user->id,
                'type' => 'new_post',
                'message' => "Your opportunity \"{$opp->headline}\" is live on the feed",
                'link' => "/post/{$opp->id}",
                'read' => false,
            ]);
        }
        
        $opp->additional = ['likedIds' => [], 'savedIds' => []];

        return response()->json(['data' => new OpportunityResource($opp)], 201);
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
            
            if ($opportunity->user_id !== $user->id) {
                AppNotification::create([
                    'user_id' => $opportunity->user_id,
                    'type' => 'like',
                    'message' => "{$user->name} liked your post \"{$opportunity->headline}\"",
                    'link' => "/post/{$opportunity->id}",
                    'read' => false,
                ]);
            }
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
        $opps = $user->savedOpportunities()->with(['user:id,name,username,avatar', 'comments.user:id,username'])->latest('opportunity_user_saves.created_at')->paginate(20);
        $likedIds = $user->likedOpportunities()->pluck('opportunities.id')->toArray();
        $savedIds = $user->savedOpportunities()->pluck('opportunities.id')->toArray();
        
        $opps->getCollection()->transform(function ($o) use ($likedIds, $savedIds) {
            $o->additional = [
                'likedIds' => $likedIds,
                'savedIds' => $savedIds,
            ];
            return $o;
        });
        
        return OpportunityResource::collection($opps);
    }
    
    public function hide(Request $request, Opportunity $opportunity)
    {
        $user = $request->user();
        HiddenOpportunity::firstOrCreate([
            'user_id' => $user->id,
            'opportunity_id' => $opportunity->id,
        ]);
        
        return response()->json(['hidden' => true]);
    }
}
