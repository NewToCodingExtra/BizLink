<?php

namespace App\Services;

use App\Models\Comment;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\ModerationAction;
use App\Models\Opportunity;
use App\Models\Report;
use App\Models\ReportCategory;
use App\Models\Story;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Single choke point for filing + resolving reports.
 * No auto-hide: filing only bumps priority_score so repeat
 * reports bubble to the top of the admin queue.
 */
class ReportService
{
    public const VALID_TYPES = [
        'opportunity_feed',
        'opportunity_reel',
        'comment',
        'story',
        'message',
        'conversation',
        'user',
    ];

    public function __construct(
        private NotificationService $notifications,
        private EnforcementService $enforcement
    ) {}

    public function categories()
    {
        return ReportCategory::where('active', true)->orderByDesc('severity')->get();
    }

    /**
     * File a report. Idempotent per reporter+target+category.
     */
    public function file(User $reporter, string $type, int $targetId, string $categoryKey, ?string $details = null): Report
    {
        abort_unless(in_array($type, self::VALID_TYPES, true), 422, 'Invalid report target.');
        $category = ReportCategory::where('key', $categoryKey)->where('active', true)->first();
        abort_if(! $category, 422, 'Invalid report category.');

        $target = $this->resolveTarget($type, $targetId);
        $offenderId = $this->offenderIdFor($type, $target);
        abort_if($offenderId && (int) $offenderId === (int) $reporter->id && $type !== 'conversation', 422, 'You cannot report your own content.');

        $report = Report::firstOrCreate(
            [
                'reporter_id' => $reporter->id,
                'reportable_type' => $type,
                'reportable_id' => $targetId,
                'category_id' => $category->id,
            ],
            [
                'details' => $details,
                'status' => 'pending',
            ]
        );

        if ($details && ! $report->wasRecentlyCreated) {
            // Keep the freshest context on duplicates.
            $report->forceFill(['details' => $details])->save();
        }

        $this->recalcPriority($type, $targetId);

        return $report->fresh(['category']);
    }

    public function reject(User $admin, Report $report, string $reason): Report
    {
        abort_if($report->status !== 'pending', 422, 'Report already resolved.');
        abort_if(mb_strlen(trim($reason)) < 10, 422, 'Rejection reason is required (min 10 characters).');

        return DB::transaction(function () use ($admin, $report, $reason) {
            $report->forceFill([
                'status' => 'rejected',
                'admin_id' => $admin->id,
                'admin_note' => trim($reason),
                'action_taken' => 'dismiss',
                'resolved_at' => now(),
            ])->save();

            ModerationAction::create([
                'report_id' => $report->id,
                'admin_id' => $admin->id,
                'action' => 'dismiss',
                'reason' => trim($reason),
                'removed_content' => false,
            ]);

            $this->recalcPriority($report->reportable_type, $report->reportable_id);

            $label = $this->targetLabel($report);
            $this->notifications->push(
                (int) $report->reporter_id,
                'report_rejected',
                "Your report on {$label} was reviewed and not actioned: " . trim($reason),
                $this->targetLink($report)
            );

            return $report->fresh(['category', 'reporter', 'actions']);
        });
    }

    /**
     * @param string $action warn|remove_content|suspend|ban (remove via $removeContent flag for warn combos)
     */
    public function accept(User $admin, Report $report, string $action, string $reason, ?int $durationDays = null, bool $removeContent = false): Report
    {
        abort_if($report->status !== 'pending', 422, 'Report already resolved.');
        abort_unless(in_array($action, ['warn', 'remove_content', 'suspend', 'ban'], true), 422, 'Invalid moderation action.');
        abort_if(mb_strlen(trim($reason)) < 10, 422, 'Action reason is required (min 10 characters).');
        if ($action === 'suspend') {
            abort_if(! $durationDays || $durationDays < 1 || $durationDays > 365, 422, 'Suspension needs 1-365 days.');
        }

        return DB::transaction(function () use ($admin, $report, $action, $reason, $durationDays, $removeContent) {
            $target = $this->resolveTarget($report->reportable_type, $report->reportable_id);
            $offenderId = $this->offenderIdFor($report->reportable_type, $target);
            $reason = trim($reason);

            $didRemove = false;
            if ($removeContent || $action === 'remove_content') {
                $didRemove = $this->enforcement->removeContent($report->reportable_type, $target);
            }

            if ($offenderId) {
                match ($action) {
                    'warn' => $this->enforcement->warn((int) $offenderId, $reason),
                    'suspend' => $this->enforcement->suspend((int) $offenderId, (int) $durationDays, $reason),
                    'ban' => $this->enforcement->ban((int) $offenderId, $reason),
                    default => null,
                };
            }

            $report->forceFill([
                'status' => 'accepted',
                'admin_id' => $admin->id,
                'admin_note' => $reason,
                'action_taken' => $action,
                'resolved_at' => now(),
            ])->save();

            ModerationAction::create([
                'report_id' => $report->id,
                'admin_id' => $admin->id,
                'action' => $action,
                'reason' => $reason,
                'duration_days' => $action === 'suspend' ? (int) $durationDays : null,
                'removed_content' => $didRemove,
            ]);

            // Auto-resolve sibling pendings on the same target as accepted/duplicate so the queue drains.
            Report::where('reportable_type', $report->reportable_type)
                ->where('reportable_id', $report->reportable_id)
                ->where('status', 'pending')
                ->where('id', '!=', $report->id)
                ->update([
                    'status' => 'accepted',
                    'admin_id' => $admin->id,
                    'admin_note' => 'Grouped with report #' . $report->id . ': ' . $reason,
                    'action_taken' => $action,
                    'resolved_at' => now(),
                ]);

            $this->recalcPriority($report->reportable_type, $report->reportable_id);

            $label = $this->targetLabel($report);
            $actionPast = match ($action) {
                'warn' => 'a warning was issued',
                'remove_content' => 'the content was removed',
                'suspend' => "the account was suspended ({$durationDays}d)",
                'ban' => 'the account was banned',
                default => 'action was taken',
            };

            $this->notifications->push(
                (int) $report->reporter_id,
                'report_accepted',
                "Thanks — we reviewed your report on {$label}: {$actionPast}.",
                $this->targetLink($report)
            );

            if ($offenderId) {
                $offenderMsg = match ($action) {
                    'warn' => "Your {$label} received a warning: {$reason}",
                    'remove_content' => "Your {$label} was removed by moderation: {$reason}",
                    'suspend' => "Your account was suspended for {$durationDays} day(s): {$reason}",
                    'ban' => "Your account was banned: {$reason}",
                    default => "Moderation action on your {$label}: {$reason}",
                };
                if ($didRemove && in_array($action, ['warn', 'suspend', 'ban'], true)) {
                    $offenderMsg .= ' The reported content was also removed.';
                }
                $this->notifications->push((int) $offenderId, 'moderation_action', $offenderMsg, '/notifications');
            }

            return $report->fresh(['category', 'reporter', 'actions']);
        });
    }

    public function recalcPriority(string $type, int $targetId): void
    {
        $rows = Report::where('reportable_type', $type)
            ->where('reportable_id', $targetId)
            ->where('status', 'pending')
            ->with('category:id,severity')
            ->get();

        $score = $rows->sum(fn ($r) => (int) ($r->category->severity ?? 10)) + $rows->count() * 10;

        Report::where('reportable_type', $type)
            ->where('reportable_id', $targetId)
            ->where('status', 'pending')
            ->update(['priority_score' => $score]);
    }

    public function offenderHistory(int $userId): array
    {
        $offenderTargets = $this->targetIdsForUser($userId);

        $asOffender = Report::where(function ($q) use ($userId, $offenderTargets) {
            foreach ($offenderTargets as $type => $ids) {
                if (! empty($ids)) {
                    $q->orWhere(fn ($w) => $w->where('reportable_type', $type)->whereIn('reportable_id', $ids));
                }
            }
            $q->orWhere(fn ($w) => $w->where('reportable_type', 'user')->where('reportable_id', $userId));
        });

        $total = (clone $asOffender)->count();
        $accepted = (clone $asOffender)->where('status', 'accepted')->count();
        $rejected = (clone $asOffender)->where('status', 'rejected')->count();
        $pending = (clone $asOffender)->where('status', 'pending')->count();

        $user = User::find($userId);

        return [
            'userId' => $userId,
            'totalReports' => $total,
            'accepted' => $accepted,
            'rejected' => $rejected,
            'pending' => $pending,
            'warningCount' => (int) ($user->warning_count ?? 0),
            'status' => $user->status ?? 'active',
            'suspendedUntil' => $user->suspended_until?->toIso8601String(),
            'bannedAt' => $user->banned_at?->toIso8601String(),
            'strikeScore' => $accepted * 25 + $pending * 5,
        ];
    }

    /** @return array<string, int[]> */
    private function targetIdsForUser(int $userId): array
    {
        return [
            'opportunity_feed' => Opportunity::where('user_id', $userId)->pluck('id')->all(),
            'opportunity_reel' => Opportunity::where('user_id', $userId)->where('media_type', 'video')->pluck('id')->all(),
            'comment' => Comment::where('user_id', $userId)->pluck('id')->all(),
            'story' => Story::where('user_id', $userId)->pluck('id')->all(),
            'message' => Message::where('sender_id', $userId)->pluck('id')->all(),
            'conversation' => Conversation::where('user_id', $userId)->pluck('id')->all(),
        ];
    }

    private function resolveTarget(string $type, int $id): mixed
    {
        return match ($type) {
            'opportunity_feed', 'opportunity_reel' => Opportunity::findOrFail($id),
            'comment' => Comment::withTrashed()->findOrFail($id),
            'story' => Story::findOrFail($id),
            'message' => Message::findOrFail($id),
            'conversation' => Conversation::findOrFail($id),
            'user' => User::findOrFail($id),
            default => abort(422, 'Invalid report target.'),
        };
    }

    private function offenderIdFor(string $type, mixed $target): ?int
    {
        return match ($type) {
            'opportunity_feed', 'opportunity_reel' => $target->user_id,
            'comment' => $target->user_id,
            'story' => $target->user_id,
            'message' => $target->sender_id,
            'conversation' => $target->user_id,
            'user' => $target->id,
            default => null,
        };
    }

    private function targetLabel(Report $report): string
    {
        return match ($report->reportable_type) {
            'opportunity_feed' => 'post #' . $report->reportable_id,
            'opportunity_reel' => 'reel #' . $report->reportable_id,
            'comment' => 'comment #' . $report->reportable_id,
            'story' => 'story #' . $report->reportable_id,
            'message' => 'message #' . $report->reportable_id,
            'conversation' => 'conversation #' . $report->reportable_id,
            'user' => 'user #' . $report->reportable_id,
            default => 'content',
        };
    }

    private function targetLink(Report $report): ?string
    {
        return match ($report->reportable_type) {
            'opportunity_feed', 'opportunity_reel' => null,
            'comment' => null,
            'story' => '/',
            'message', 'conversation' => '/messages',
            'user' => null,
            default => null,
        };
    }
}
