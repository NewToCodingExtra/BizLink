<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\Comment;
use App\Models\Opportunity;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Threading, fan-out, and moderation for opportunity comments.
 * Controllers validate; this service orchestrates (transaction + notify).
 */
class CommentService
{
    public const ALLOWED_EMOJI = ['👍', '❤️', '😮', '😂', '🙏'];
    public const ALLOWED_REASONS = ['spam', 'harassment', 'scam', 'other'];
    public const REPORT_HIDE_THRESHOLD = 3;
    public const EDIT_WINDOW_MINUTES = 15;

    public function store(?User $user, Opportunity $opportunity, array $data): Comment
    {
        return DB::transaction(function () use ($user, $opportunity, $data) {
            $parent = null;
            if (!empty($data['parent_id'])) {
                $parent = Comment::findOrFail($data['parent_id']);
                abort_if((int) $parent->opportunity_id !== (int) $opportunity->id, 422, 'Reply target belongs to another post.');
            }

            // Depth cap 2: replies to a reply attach to the top-level ancestor.
            $parentId = $parent ? ((int) ($parent->parent_id ?? 0) ?: (int) $parent->id) : null;

            $isSeller = $opportunity->user_id && ((int) $opportunity->user_id === (int) $user->id);

            $comment = Comment::create([
                'opportunity_id' => $opportunity->id,
                'parent_id' => $parentId,
                'user_id' => $user->id,
                'author' => $user->name ?? 'Guest',
                'avatar' => $user->avatar ?? 'https://i.pravatar.cc/100?u=guest',
                'text' => $data['text'] ?? '',
                'media_url' => $data['media_url'] ?? null,
                'media_type' => $data['media_type'] ?? null,
                'is_seller_reply' => (bool) $isSeller,
            ]);

            $this->notifyThread($user, $opportunity, $comment, $parent);

            return $comment;
        });
    }

    /**
     * Full thread tree for an opportunity in 3 queries (top + replies + users),
     * nested in PHP. Includes tombstones (withTrashed) so reply context survives.
     */
    public function treeFor(Opportunity $opportunity, ?int $viewerId): array
    {
        $tops = Comment::withTrashed()
            ->with(['user:id,name,username,avatar', 'reactions'])
            ->withCount(['replies' => fn($q) => $q->withTrashed()])
            ->where('opportunity_id', $opportunity->id)
            ->whereNull('parent_id')
            ->latest()
            ->get();

        $replies = Comment::withTrashed()
            ->with(['user:id,name,username,avatar', 'reactions'])
            ->where('opportunity_id', $opportunity->id)
            ->whereIn('parent_id', $tops->pluck('id')->all())
            ->oldest()
            ->get()
            ->groupBy('parent_id');

        foreach ($tops as $top) {
            $top->setRelation('replies', $replies->get($top->id, collect()));
        }

        return $tops->map(
            fn($c) => (new \App\Http\Resources\CommentResource($c))->withViewer($viewerId)->toArray(request())
        )->all();
    }

    /**
     * Notify post owner + (for replies) parent-comment owner. Dedupe, skip self.
     */
    private function notifyThread(?User $author, Opportunity $opp, Comment $comment, ?Comment $parent): void
    {
        if (!$author) {
            return;
        }
        $targets = [];
        if ($opp->user_id) {
            $targets[$opp->user_id] = 'comment';
        }
        if ($parent && $parent->user_id) {
            $targets[$parent->user_id] = 'comment_reply';
        }
        unset($targets[$author->id]);

        foreach ($targets as $userId => $type) {
            $message = $type === 'comment_reply'
                ? "{$author->name} replied to your comment on {$opp->headline}"
                : "{$author->name} commented on {$opp->headline}";
            AppNotification::create([
                'user_id' => $userId,
                'type' => $type,
                'message' => $message,
                'link' => "/post/{$opp->slug}#comment-{$comment->id}",
                'read' => false,
            ]);
        }
    }

    /**
     * Toggle a reaction. Returns ['added' => bool].
     */
    public function toggleReaction(User $user, Comment $comment, string $emoji): array
    {
        $existing = $comment->reactions()->where('user_id', $user->id)->where('emoji', $emoji)->first();
        if ($existing) {
            $existing->delete();
            return ['added' => false];
        }
        $comment->reactions()->create(['user_id' => $user->id, 'emoji' => $emoji]);

        $opp = $comment->opportunity;
        $targets = array_unique(array_filter([(int) $opp->user_id, (int) $comment->user_id]));
        foreach ($targets as $userId) {
            if ($userId === (int) $user->id) {
                continue;
            }
            AppNotification::create([
                'user_id' => $userId,
                'type' => 'comment_reaction',
                'message' => "{$user->name} reacted {$emoji} to a comment on {$opp->headline}",
                'link' => "/post/{$opp->slug}#comment-{$comment->id}",
                'read' => false,
            ]);
        }

        return ['added' => true];
    }

    /**
     * Record a report. Auto-hides (soft-delete tombstone) at threshold.
     * Returns ['hidden' => bool].
     */
    public function report(User $user, Comment $comment, string $reason): array
    {
        $comment->reports()->firstOrCreate(
            ['user_id' => $user->id],
            ['reason' => $reason]
        );
        if ($comment->reports()->count() >= self::REPORT_HIDE_THRESHOLD && !$comment->trashed()) {
            $comment->delete();
            return ['hidden' => true];
        }
        return ['hidden' => false];
    }
}
