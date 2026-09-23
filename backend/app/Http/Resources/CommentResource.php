<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Single shape for comments over HTTP and (later) broadcast.
 * Use ->withViewer($id) so myReaction resolves per viewer.
 */
class CommentResource extends JsonResource
{
    protected ?int $viewerId = null;

    public function withViewer(?int $id): self
    {
        $this->viewerId = $id;
        return $this;
    }

    public function toArray($request)
    {
        $deleted = method_exists($this->resource, 'trashed') && $this->resource->trashed();
        $reactions = $this->relationLoaded('reactions') ? $this->resource->getRelation('reactions') : collect();
        $counts = [];
        foreach ($reactions as $r) {
            $counts[$r->emoji] = ($counts[$r->emoji] ?? 0) + 1;
        }
        $mine = $this->viewerId
            ? ($reactions->firstWhere('user_id', $this->viewerId)?->emoji)
            : null;

        $children = [];
        if ($this->relationLoaded('replies')) {
            foreach ($this->resource->getRelation('replies') as $reply) {
                $children[] = (new self($reply))->withViewer($this->viewerId)->toArray($request);
            }
        }

        return [
            'id' => $this->id,
            'postId' => $this->opportunity_id,
            'parentId' => $this->parent_id,
            'userId' => $this->user_id,
            'username' => $this->relationLoaded('user') && $this->user ? $this->user->username : null,
            'author' => $this->author,
            'avatar' => $this->avatar,
            'text' => $deleted ? 'This comment was deleted.' : $this->text,
            'mediaUrl' => $deleted ? null : $this->media_url,
            'mediaType' => $deleted ? null : $this->media_type,
            'timestamp' => $this->created_at?->diffForHumans() ?? 'now',
            'isSellerReply' => (bool) $this->is_seller_reply,
            'edited' => $this->edited_at !== null,
            'deleted' => (bool) $deleted,
            'reactions' => $counts,
            'myReaction' => $mine,
            'replies' => $children,
            'repliesCount' => $this->relationLoaded('repliesCount') ? (int) $this->replies_count : count($children),
        ];
    }
}
