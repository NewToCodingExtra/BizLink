<?php

namespace App\Http\Controllers;

use App\Models\Story;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function show(Request $request, string $id)
    {
        $user = null;

        if (is_numeric($id)) {
            $user = User::find($id);
        }

        if (!$user && str_starts_with($id, 'brand-')) {
            $oppOwnerId = \App\Models\Opportunity::where('brand_id', $id)->value('user_id');
            if ($oppOwnerId) {
                $user = User::find($oppOwnerId);
            }
            if (!$user) {
                $storyOwnerId = Story::where('brand_id', $id)->value('user_id');
                if ($storyOwnerId) {
                    $user = User::find($storyOwnerId);
                }
            }
        }

        $viewer = \Illuminate\Support\Facades\Auth::guard('sanctum')->user() ?? $request->user();

        if (!$user && $id === 'me' && $viewer) {
            $user = $viewer;
        }

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }
        $likedIds = $viewer ? $viewer->likedOpportunities()->pluck('opportunities.id')->toArray() : [];
        $savedIds = $viewer ? $viewer->savedOpportunities()->pluck('opportunities.id')->toArray() : [];

        $opportunities = \App\Models\Opportunity::with(['user:id,name,avatar', 'comments'])
            ->where(function ($q) use ($user, $id) {
                $q->where('user_id', $user->id);
                if (str_starts_with($id, 'brand-')) {
                    $q->orWhere('brand_id', $id);
                }
            })
            ->latest()
            ->get()
            ->map(fn($o) => [
                'id' => $o->id,
                'authorId' => $o->user_id,
                'user' => $o->user ? ['id' => $o->user->id, 'name' => $o->user->name, 'avatar' => $o->user->avatar] : null,
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
                'comments' => $o->comments->map(fn($c) => [
                    'id' => $c->id,
                    'postId' => $c->opportunity_id,
                    'author' => $c->author,
                    'avatar' => $c->avatar,
                    'text' => $c->text,
                    'timestamp' => $c->created_at?->diffForHumans(),
                    'isSellerReply' => (bool) $c->is_seller_reply,
                ])->values(),
            ])->values();

        $stories = Story::where('user_id', $user->id)
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->latest()
            ->get()
            ->map(fn($s) => [
                'id' => $s->id,
                'authorId' => $s->user_id,
                'brandId' => $s->brand_id,
                'brandName' => $s->brand_name,
                'avatar' => $s->avatar,
                'mediaUrl' => $s->media_url,
                'caption' => $s->caption,
                'expiresAt' => $s->expires_at?->toISOString(),
                'seen' => (bool) $s->seen,
            ])->values();

        $following = false;
        if ($viewer) {
            $following = DB::table('follows')->where('user_id', $viewer->id)->where('brand_id', 'brand-' . $user->id)->exists()
                || DB::table('follows')->where('user_id', $viewer->id)->where('brand_id', $id)->exists();
        }

        return response()->json([
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'avatar' => $user->avatar,
                    'role' => $user->role,
                    'created_at' => $user->created_at,
                ],
                'stats' => [
                    'posts' => $opportunities->count(),
                    'stories' => $stories->count(),
                ],
                'following' => $following,
                'opportunities' => $opportunities,
                'stories' => $stories,
            ],
        ]);
    }
}
