<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class OpportunityResource extends JsonResource
{
    public function toArray($request)
    {
        // NOTE: $this->additional is the resource's own meta bag (always
        // empty here). Per-item data attached by the controller lives on the
        // underlying model, so read it from there.
        $attached = ($this->resource instanceof \App\Models\Opportunity)
            ? ($this->resource->getAttribute('additional') ?? [])
            : [];
        $likedIds = $attached['likedIds'] ?? [];
        $savedIds = $attached['savedIds'] ?? [];
        $preferredIds = $attached['preferredIds'] ?? [];

        $image = $this->image;
        if ($image && str_contains($image, '/storage/bizlink/')) {
            $image = substr($image, strpos($image, '/storage/bizlink/'));
        } elseif ($image && str_contains($image, '/storage/')) {
            $image = substr($image, strpos($image, '/storage/'));
        }

        $videoUrl = $this->video_url;
        if ($videoUrl && str_contains($videoUrl, '/storage/bizlink/')) {
            $videoUrl = substr($videoUrl, strpos($videoUrl, '/storage/bizlink/'));
        } elseif ($videoUrl && str_contains($videoUrl, '/storage/')) {
            $videoUrl = substr($videoUrl, strpos($videoUrl, '/storage/'));
        }

        return [
            'id' => $this->id,
            'slug' => $this->slug ?: (string) $this->id,
            'user_id' => $this->user_id,
            'authorId' => $this->user_id,
            'authorUsername' => $this->relationLoaded('user') && $this->user ? $this->user->username : null,
            'user' => $this->relationLoaded('user') && $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'username' => $this->user->username,
                'avatar' => $this->user->avatar,
                'role' => $this->user->role ?? null,
            ] : null,
            // Author account type for the role badge (brand vs entrepreneur).
            // Derived from the `role` column only (no extra queries).
            'authorRole' => $this->relationLoaded('user') && $this->user
                ? (in_array($this->user->role ?? 'entrepreneur', ['brand', 'admin'], true) ? 'brand' : 'entrepreneur')
                : null,
            'brandName' => $this->brand_name,
            'brandAvatar' => $this->brand_avatar,
            'brandId' => $this->brand_id,
            'type' => $this->type,
            'category' => $this->category,
            'headline' => $this->headline,
            'capitalRequired' => $this->capital_required,
            'capitalAmount' => $this->capital_amount !== null ? (int) $this->capital_amount : null,
            'roi' => $this->roi,
            'roiPercent' => $this->roi_percent !== null ? (float) $this->roi_percent : null,
            'description' => $this->description,
            'image' => $image,
            'mediaType' => $this->media_type,
            'videoUrl' => $videoUrl,
            'featured' => (bool) $this->featured,
            'verified' => (bool) $this->verified,
            'likes' => (int) $this->likes_count,
            'saves' => (int) $this->saves_count,
            'isNew' => (bool) $this->is_new,
            'liked' => in_array($this->id, $likedIds),
            'saved' => in_array($this->id, $savedIds),
            'preferred' => in_array($this->id, $preferredIds),
            'reasons' => $attached['reasons'] ?? [],
            'createdAt' => $this->created_at,
            'commentsCount' => $this->relationLoaded('comments') ? $this->comments->count() : (int) ($this->comments_count ?? 0),
            'comments' => $this->relationLoaded('comments') ? $this->comments->map(fn($c) => [
                'id' => $c->id,
                'postId' => $c->opportunity_id,
                'parentId' => $c->parent_id,
                'userId' => $c->user_id,
                'username' => $c->relationLoaded('user') && $c->user ? $c->user->username : null,
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
            ])->values() : [],
        ];
    }
}
