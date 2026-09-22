<?php

namespace App\Http\Controllers;

use App\Models\Story;
use Illuminate\Http\Request;

class StoryController extends Controller
{
    public function index()
    {
        $stories = Story::where(function ($q) {
            $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
        })->latest()->get();

        return response()->json(['data' => $stories->map(fn($s) => $this->serialize($s))]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'brand_name' => 'sometimes|string|max:255',
            'media_url' => 'required|string|max:2048',
            'caption' => 'nullable|string|max:1024',
            'duration' => 'nullable|numeric|max:60', // max 60 seconds
        ]);

        $user = $request->user();

        $story = Story::create([
            'user_id' => $user?->id,
            'brand_id' => 'brand-' . ($user?->id ?? 'guest'),
            'brand_name' => $data['brand_name'] ?? ($user?->name ?? 'Brand'),
            'avatar' => $user?->avatar ?? 'https://i.pravatar.cc/100?u=story',
            'media_url' => $data['media_url'],
            'caption' => $data['caption'] ?? null,
            'expires_at' => now()->addHours(24),
            'seen' => false,
        ]);

        return response()->json(['data' => $this->serialize($story)], 201);
    }

    public function markSeen(Story $story)
    {
        $story->update(['seen' => true]);
        return response()->json(['data' => $this->serialize($story)]);
    }

    private function serialize(Story $s): array
    {
        return [
            'id' => $s->id,
            'authorId' => $s->user_id,
            'brandId' => $s->brand_id,
            'brandName' => $s->brand_name,
            'avatar' => $s->avatar,
            'mediaUrl' => $s->media_url,
            'caption' => $s->caption,
            'expiresAt' => $s->expires_at?->toISOString(),
            'seen' => (bool) $s->seen,
        ];
    }
}
