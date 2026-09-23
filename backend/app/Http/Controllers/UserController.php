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

        // Canonical profile slug: username (e.g. /profile/sparklewash-auto).
        if ($id !== 'me' && !is_numeric($id) && !str_starts_with($id, 'brand-')) {
            $user = User::where('username', $id)->first();
        }

        if (!$user && is_numeric($id)) {
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

        $opportunities = \App\Models\Opportunity::with(['user:id,name,username,avatar', 'comments.user:id,username'])
            ->where('user_id', $user->id)
            ->latest()
            ->get()
            ->map(fn($o) => [
                'id' => $o->id,
                'authorId' => $o->user_id,
                'authorUsername' => $o->user?->username,
                'user' => $o->user ? ['id' => $o->user->id, 'name' => $o->user->name, 'username' => $o->user->username, 'avatar' => $o->user->avatar] : null,
                'brandName' => $o->brand_name,
                'brandAvatar' => $o->brand_avatar,
                'brandId' => $o->brand_id,
                'slug' => $o->slug,
                'type' => $o->type,
                'category' => $o->category,
                'headline' => $o->headline,
                'capitalRequired' => $o->capital_required,
                'capitalAmount' => $o->capital_amount !== null ? (int) $o->capital_amount : null,
                'roi' => $o->roi,
                'roiPercent' => $o->roi_percent !== null ? (float) $o->roi_percent : null,
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
                'commentsCount' => $o->comments->count(),
                'comments' => $o->comments->map(fn($c) => [
                    'id' => $c->id,
                    'postId' => $c->opportunity_id,
                    'parentId' => $c->parent_id,
                    'userId' => $c->user_id,
                    'username' => $c->user?->username,
                    'author' => $c->author,
                    'avatar' => $c->avatar,
                    'text' => $c->text,
                    'mediaUrl' => $c->media_url,
                    'mediaType' => $c->media_type,
                    'timestamp' => $c->created_at?->diffForHumans(),
                    'isSellerReply' => (bool) $c->is_seller_reply,
                    'edited' => $c->edited_at !== null,
                    'deleted' => (bool) $c->trashed(),
                    'reactions' => [],
                    'myReaction' => null,
                    'replies' => [],
                    'repliesCount' => 0,
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
                'authorUsername' => $user->username,
                'brandId' => $s->brand_id,
                'brandName' => $s->brand_name,
                'slug' => $s->slug,
                'avatar' => $s->avatar,
                'mediaUrl' => $s->media_url,
                'caption' => $s->caption,
                'expiresAt' => $s->expires_at?->toISOString(),
                'seen' => (bool) $s->seen,
            ])->values();

        $following = false;
        if ($viewer) {
            // Follows are keyed by author ("brand-{userId}"), so check the
            // resolved owner — not the raw slug, which may be shared.
            $following = DB::table('follows')->where('user_id', $viewer->id)->where('brand_id', 'brand-' . $user->id)->exists();
            if (!$following && !is_numeric($id) && !str_starts_with($id, 'brand-')) {
                $following = DB::table('follows')->where('user_id', $viewer->id)->where('brand_id', $id)->exists();
            }
        }

        return response()->json([
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'avatar' => $user->avatar,
                    'bio' => $user->bio,
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
