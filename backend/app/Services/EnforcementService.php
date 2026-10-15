<?php

namespace App\Services;

use App\Models\Comment;
use App\Models\Message;
use App\Models\Opportunity;
use App\Models\Story;
use App\Models\User;

/**
 * Account-level + content-level enforcement.
 * Suspend = timed login/mutation block, ban = permanent.
 */
class EnforcementService
{
    public function __construct(private NotificationService $notifications) {}

    public function warn(int $userId, string $reason): void
    {
        $user = User::findOrFail($userId);
        $user->increment('warning_count');
    }

    public function suspend(int $userId, int $days, string $reason): void
    {
        $user = User::findOrFail($userId);
        $user->forceFill([
            'status' => 'suspended',
            'suspended_until' => now()->addDays($days),
            'ban_reason' => $reason,
        ])->save();
        $user->tokens()->delete();
    }

    public function ban(int $userId, string $reason): void
    {
        $user = User::findOrFail($userId);
        $user->forceFill([
            'status' => 'banned',
            'banned_at' => now(),
            'ban_reason' => $reason,
        ])->save();
        $user->tokens()->delete();
    }

    public function unsuspend(int $userId): void
    {
        $user = User::findOrFail($userId);
        $user->forceFill([
            'status' => 'active',
            'suspended_until' => null,
            'ban_reason' => null,
        ])->save();
    }

    public function unban(int $userId): void
    {
        $user = User::findOrFail($userId);
        $user->forceFill([
            'status' => 'active',
            'banned_at' => null,
            'ban_reason' => null,
        ])->save();
    }

    public function clearWarnings(int $userId): void
    {
        $user = User::findOrFail($userId);
        $user->forceFill(['warning_count' => 0])->save();
    }

    public function isBlocked(?User $user): ?string
    {
        if (! $user) {
            return null;
        }
        $user->refresh();
        if (($user->status ?? 'active') === 'banned') {
            return 'This account has been banned.' . ($user->ban_reason ? ' Reason: ' . $user->ban_reason : '');
        }
        if (($user->status ?? 'active') === 'suspended') {
            if ($user->suspended_until && $user->suspended_until->isPast()) {
                $user->forceFill(['status' => 'active', 'suspended_until' => null, 'ban_reason' => null])->save();
                return null;
            }
            $until = $user->suspended_until?->diffForHumans() ?? 'temporarily';
            return "Account suspended {$until}." . ($user->ban_reason ? ' Reason: ' . $user->ban_reason : '');
        }
        return null;
    }

    /**
     * Hide/delete the reported content. Returns true when something was hidden.
     */
    public function removeContent(string $type, mixed $target): bool
    {
        return match ($type) {
            'opportunity_feed', 'opportunity_reel' => tap($target, function (Opportunity $o) {
                $o->forceFill(['hidden_by_moderation' => true])->save();
            }) && true,
            'comment' => tap($target, function (Comment $c) {
                if (! $c->trashed()) {
                    $c->delete();
                }
            }) && true,
            'story' => tap($target, function (Story $s) {
                $s->forceFill(['hidden_by_moderation' => true])->save();
            }) && true,
            'message' => tap($target, function (Message $m) {
                $m->forceFill(['is_hidden' => true, 'text' => '[Removed by moderation]'])->save();
            }) && true,
            default => false,
        };
    }
}
