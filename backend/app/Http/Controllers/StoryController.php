<?php

namespace App\Http\Controllers;

use App\Models\Story;
use App\Models\AppNotification;
use Illuminate\Http\Request;

class StoryController extends Controller
{
    public function index()
    {
        $stories = Story::where(function ($q) {
            $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
        })->latest()->get();

        $usernames = \App\Models\User::whereIn('id', $stories->pluck('user_id')->filter()->unique())
            ->pluck('username', 'id');

        return response()->json(['data' => $stories->map(fn($s) => $this->serialize($s, $usernames[$s->user_id] ?? null))]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'brand_name' => 'sometimes|nullable|string|max:255',
            'media_url' => 'required|string|max:2048',
            'caption' => 'nullable|string|max:1024',
            'duration' => 'nullable|numeric|max:60', // max 60 seconds
        ]);

        $user = $request->user();
        abort_if(! $user, 401, 'Log in to post a story.');

        $story = Story::create([
            'user_id' => $user->id,
            'brand_id' => 'brand-' . $user->id,
            'brand_name' => $data['brand_name'] ?? ($user->name ?? 'Brand'),
            'avatar' => $user->avatar ?? 'https://i.pravatar.cc/100?u=story',
            'media_url' => $data['media_url'],
            'caption' => $data['caption'] ?? null,
            'expires_at' => now()->addHours(24),
            'seen' => false,
        ]);

        $base = \Illuminate\Support\Str::slug($story->brand_name);
        if (empty($base)) $base = 'story';
        
        $slug = $base;
        $count = 1;
        while (Story::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $count;
            $count++;
        }
        $story->slug = $slug;
        $story->save();

        return response()->json(['data' => $this->serialize($story)], 201);
    }

    public function destroy(Request $request, string $identifier)
    {
        // Accept either numeric id or slug (route binds by slug, viewer sends both).
        $story = is_numeric($identifier)
            ? Story::find($identifier)
            : Story::where('slug', $identifier)->first();
        abort_if(! $story, 404, 'Story not found.');

        $user = $request->user();
        $isOwner = $user && (int) $story->user_id === (int) $user->id;
        $isAdmin = $user && method_exists($user, 'hasRole') && $user->hasRole('Admin');
        abort_if(!$isOwner && !$isAdmin, 403, 'You cannot delete this story.');

        // Detach likes pivot, then delete the row.
        try {
            $story->likes()->detach();
        } catch (\Throwable $e) {
            // Pivot may not exist on older installs — still delete the story.
        }

        // Best-effort cleanup of locally stored uploads (GCS URLs untouched).
        if ($story->media_url && str_contains($story->media_url, '/storage/bizlink/')) {
            $relative = ltrim(substr($story->media_url, strpos($story->media_url, '/storage/bizlink/') + strlen('/storage/')), '/');
            try {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($relative);
            } catch (\Throwable $e) {
            }
        }

        $story->delete();

        if ($request->wantsJson() || $request->header('X-Inertia')) {
            return response()->json(['deleted' => true]);
        }
        return redirect('/feed')->with('success', 'Story deleted.');
    }

    public function markSeen(Story $story)
    {
        $story->update(['seen' => true]);
        return response()->json(['data' => $this->serialize($story)]);
    }

    public function toggleLike(Request $request, Story $story)
    {
        $user = $request->user();
        $exists = $user->likedStories()->where('story_id', $story->id)->exists();
        
        if ($exists) {
            $user->likedStories()->detach($story->id);
            $story->decrement('likes_count');
            $liked = false;
        } else {
            $user->likedStories()->attach($story->id);
            $story->increment('likes_count');
            $liked = true;
            
            if ($story->user_id !== $user->id && $story->user_id) {
                AppNotification::create([
                    'user_id' => $story->user_id,
                    'type' => 'like',
                    'message' => "{$user->name} reacted to your story",
                    'link' => "/",
                    'read' => false,
                ]);
            }
        }
        $story->refresh();
        return response()->json(['liked' => $liked, 'likes_count' => $story->likes_count]);
    }

    private function serialize(Story $s, ?string $username = null): array
    {
        return [
            'id' => $s->id,
            'slug' => $s->slug,
            'authorId' => $s->user_id,
            'authorUsername' => $username ?? \App\Models\User::where('id', $s->user_id)->value('username'),
            'brandId' => $s->brand_id,
            'brandName' => $s->brand_name,
            'avatar' => $s->avatar,
            'mediaUrl' => $s->media_url,
            'caption' => $s->caption,
            'expiresAt' => $s->expires_at?->toISOString(),
            'createdAt' => $s->created_at?->toISOString(),
            'seen' => (bool) $s->seen,
            'likesCount' => $s->likes_count ?? 0,
            'liked' => request()->user() ? request()->user()->likedStories()->where('story_id', $s->id)->exists() : false,
        ];
    }
}
