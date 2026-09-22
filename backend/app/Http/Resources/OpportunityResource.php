<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class OpportunityResource extends JsonResource
{
    public function toArray($request)
    {
        $likedIds = $this->additional['likedIds'] ?? [];
        $savedIds = $this->additional['savedIds'] ?? [];
        $preferredIds = $this->additional['preferredIds'] ?? [];

        return [
            'id' => $this->id,
            'authorId' => $this->user_id,
            'user' => $this->relationLoaded('user') && $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'avatar' => $this->user->avatar,
            ] : null,
            'brandName' => $this->brand_name,
            'brandAvatar' => $this->brand_avatar,
            'brandId' => $this->brand_id,
            'type' => $this->type,
            'category' => $this->category,
            'headline' => $this->headline,
            'capitalRequired' => $this->capital_required,
            'roi' => $this->roi,
            'description' => $this->description,
            'image' => $this->image,
            'mediaType' => $this->media_type,
            'videoUrl' => $this->video_url,
            'featured' => (bool) $this->featured,
            'verified' => (bool) $this->verified,
            'likes' => (int) $this->likes_count,
            'saves' => (int) $this->saves_count,
            'isNew' => (bool) $this->is_new,
            'liked' => in_array($this->id, $likedIds),
            'saved' => in_array($this->id, $savedIds),
            'preferred' => in_array($this->id, $preferredIds),
            'createdAt' => $this->created_at,
            'commentsCount' => $this->relationLoaded('comments') ? $this->comments->count() : (int) ($this->comments_count ?? 0),
            'comments' => $this->relationLoaded('comments') ? $this->comments->map(fn($c) => [
                'id' => $c->id,
                'postId' => $c->opportunity_id,
                'userId' => $c->user_id,
                'author' => $c->author,
                'avatar' => $c->avatar,
                'text' => $c->text,
                'timestamp' => $c->created_at?->diffForHumans(),
                'isSellerReply' => (bool) $c->is_seller_reply,
            ])->values() : [],
        ];
    }
}
