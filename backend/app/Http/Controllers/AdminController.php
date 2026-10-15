<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Opportunity;
use App\Models\Story;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * Platform administration console (role:Admin only — see routes/web.php).
 *
 * Read-only today: aggregates the live counts an operator actually needs
 * (who is on the platform, what content exists, what needs moderation).
 * Destructive actions stay on the individual resources where ownership is
 * already enforced (OpportunityPolicy, StoryController@destroy).
 */
class AdminController extends Controller
{
    public function index(Request $request)
    {
        // Permission-based, not role-name-based: this is the granular check
        // Spatie exists for. Only the Admin role holds 'users.manage'.
        abort_unless($request->user()?->can('users.manage'), 403, 'Admin access only.');

        $now = now();

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
                    'pendingReports' => \App\Models\Report::where('status', 'pending')->count(),
                    'highSeverity' => \App\Models\Report::where('status', 'pending')
                        ->whereHas('category', fn ($c) => $c->where('severity', '>=', 70))->count(),
                ],
            ],

            // Newest sign-ups — the first thing an operator wants to check.
            'recentUsers' => User::query()
                ->latest()
                ->limit(8)
                ->get(['id', 'name', 'email', 'avatar', 'role', 'created_at'])
                ->map(function ($u) {
                    return [
                        'id' => $u->id,
                        'name' => $u->name,
                        'email' => $u->email,
                        'avatar' => $u->avatar,
                        'role' => $u->role,
                        'roles' => $u->getRoleNames(),
                        'createdAt' => $u->created_at?->diffForHumans(),
                    ];
                }),

            // Top posts by likes — moderators scan this for quality/abuse.
            'topPosts' => Opportunity::query()
                ->orderByDesc('likes_count')
                ->limit(6)
                ->get(['id', 'slug', 'brand_name', 'headline', 'type', 'likes_count', 'verified', 'user_id'])
                ->map(fn($o) => [
                    'id' => $o->id,
                    'slug' => $o->slug,
                    'brandName' => $o->brand_name,
                    'headline' => $o->headline,
                    'type' => $o->type,
                    'likes' => (int) $o->likes_count,
                    'verified' => (bool) $o->verified,
                    'ownerId' => $o->user_id,
                ]),

            // Flagged comments live in their own pivot table (one row per
            // reporter), so GROUP BY the comment to keep the list unique.
            'reportedComments' => DB::table('comment_reports as r')
                ->join('comments as c', 'c.id', '=', 'r.comment_id')
                ->leftJoin('opportunities as o', 'o.id', '=', 'c.opportunity_id')
                ->groupBy('r.comment_id', 'c.author', 'c.text', 'o.slug', 'o.headline')
                ->select([
                    'r.comment_id as id',
                    'c.author',
                    'c.text',
                    'o.slug',
                    'o.headline as postHeadline',
                    DB::raw('COUNT(*) as reports'),
                    DB::raw('MAX(r.created_at) as createdAt'),
                ])
                ->orderByDesc('reports')
                ->limit(8)
                ->get()
                ->map(fn($r) => [
                    'id' => $r->id,
                    'author' => $r->author,
                    'text' => $r->text,
                    'reports' => (int) $r->reports,
                    'postSlug' => $r->slug,
                    'postHeadline' => $r->postHeadline,
                ]),
        ]);
    }
}
