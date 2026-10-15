<?php

namespace App\Http\Controllers;

use App\Models\AdminAction;
use App\Models\Comment;
use App\Models\Conversation;
use App\Models\LoginAttempt;
use App\Models\Message;
use App\Models\Opportunity;
use App\Models\Report;
use App\Models\Setting;
use App\Models\Story;
use App\Models\User;
use App\Models\VerificationRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * Platform administration console (role:Admin only — see routes/web.php).
 */
class AdminController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()?->can('users.manage'), 403, 'Admin access only.');

        $now = now();
        $maxAttempts = (int) Setting::get('login_rate_limit', 5);
        $lockoutWindow = $now->copy()->subMinutes(15);

        // Find locked accounts count
        $lockedEmails = LoginAttempt::where('successful', false)
            ->where('created_at', '>=', $lockoutWindow)
            ->groupBy('email')
            ->havingRaw('COUNT(*) >= ?', [$maxAttempts])
            ->pluck('email');
        $lockedCount = User::whereIn('email', $lockedEmails)->count();

        // Pending verifications
        $pendingVerificationsCount = VerificationRequest::where('status', 'pending')->count();

        // Pending and high-severity reports
        $pendingReportsCount = Report::where('status', 'pending')->count();
        $highSeverityCount = Report::where('status', 'pending')
            ->whereHas('category', fn ($c) => $c->where('severity', '>=', 70))
            ->count();

        // Recent admin audit actions
        $recentActivity = AdminAction::with('admin:id,name,username,avatar')
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn($a) => [
                'id' => $a->id,
                'action' => $a->action,
                'admin' => $a->admin ? [
                    'id' => $a->admin->id,
                    'name' => $a->admin->name,
                    'username' => $a->admin->username,
                    'avatar' => $a->admin->avatar,
                ] : null,
                'targetType' => $a->target_type,
                'targetId' => $a->target_id,
                'reason' => $a->reason,
                'createdAtHuman' => $a->created_at?->diffForHumans(),
            ]);

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'users' => [
                    'total' => User::count(),
                    'admins' => User::role('Admin')->count(),
                    'managers' => User::role('Manager')->count(),
                    'entrepreneurs' => User::role('User')->count(),
                    'newThisWeek' => User::where('created_at', '>=', $now->copy()->subDays(7))->count(),
                ],
                'content' => [
                    'opportunities' => Opportunity::count(),
                    'liveStories' => Story::where(function ($q) use ($now) {
                        $q->whereNull('expires_at')->orWhere('expires_at', '>', $now);
                    })->count(),
                    'franchise' => Opportunity::where('type', 'Franchise')->count(),
                    'wholesale' => Opportunity::where('type', 'Wholesale')->count(),
                    'resell' => Opportunity::where('type', 'Resell')->count(),
                    'inquiries' => Conversation::count(),
                    'messages' => Message::count(),
                ],
                'engagement' => [
                    'comments' => Comment::count(),
                    'likes' => DB::table('opportunity_user_likes')->count(),
                    'saves' => DB::table('opportunity_user_saves')->count(),
                    'follows' => DB::table('follows')->count(),
                ],
                'moderation' => [
                    'reportedComments' => DB::table('comment_reports')->count(),
                    'deletedComments' => Comment::onlyTrashed()->count(),
                    'pendingReports' => $pendingReportsCount,
                    'highSeverity' => $highSeverityCount,
                ],
            ],

            'needsAttention' => [
                'pendingReports' => $pendingReportsCount,
                'highSeverity' => $highSeverityCount,
                'pendingVerifications' => $pendingVerificationsCount,
                'lockedAccounts' => $lockedCount,
            ],

            'navBadges' => [
                'reports' => $pendingReportsCount,
                'verifications' => $pendingVerificationsCount,
                'users' => $lockedCount,
            ],

            'recentActivity' => $recentActivity,

            'recentUsers' => User::query()
                ->latest()
                ->limit(8)
                ->get(['id', 'name', 'username', 'email', 'avatar', 'role', 'status', 'is_brand_verified', 'created_at'])
                ->map(fn($u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'username' => $u->username,
                    'email' => $u->email,
                    'avatar' => $u->avatar,
                    'role' => $u->role,
                    'roles' => $u->getRoleNames(),
                    'status' => $u->status ?? 'active',
                    'isBrandVerified' => (bool) $u->is_brand_verified,
                    'createdAt' => $u->created_at?->diffForHumans(),
                ]),

            'topPosts' => Opportunity::query()
                ->orderByDesc('likes_count')
                ->limit(6)
                ->get(['id', 'slug', 'brand_name', 'headline', 'type', 'likes_count', 'verified', 'user_id'])
                ->map(fn($o) => [
                    'id' => $o->id,
                    'slug' => $o->slug ?: (string) $o->id,
                    'brandName' => $o->brand_name,
                    'headline' => $o->headline,
                    'type' => $o->type,
                    'likes' => (int) $o->likes_count,
                    'verified' => (bool) $o->verified,
                    'ownerId' => $o->user_id,
                ]),
        ]);
    }
}
