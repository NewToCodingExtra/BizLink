<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAction;
use App\Models\LoginAttempt;
use App\Models\Opportunity;
use App\Models\Report;
use App\Models\Setting;
use App\Models\User;
use App\Services\EnforcementService;
use App\Services\NotificationService;
use App\Services\ReportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;

class UserAdminController extends Controller
{
    public function __construct(
        private EnforcementService $enforcement,
        private NotificationService $notifications,
        private ReportService $reports
    ) {}

    public function index(Request $request)
    {
        abort_unless($request->user()?->can('users.manage'), 403, 'Admin access only.');

        $data = $request->validate([
            'search' => 'nullable|string|max:100',
            'status' => 'nullable|string|in:all,active,suspended,banned,locked',
            'role' => 'nullable|string|in:all,Admin,Manager,User',
            'verified' => 'nullable|string|in:all,1,0',
            'sort' => 'nullable|string|in:newest,strikes,warnings,posts,name',
            'order' => 'nullable|string|in:asc,desc',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:50',
        ]);

        $search = $data['search'] ?? null;
        $status = $data['status'] ?? 'all';
        $role = $data['role'] ?? 'all';
        $verified = $data['verified'] ?? 'all';
        $sort = $data['sort'] ?? 'newest';
        $order = $data['order'] ?? 'desc';
        $perPage = $data['per_page'] ?? 15;
        $maxAttempts = (int) Setting::get('login_rate_limit', 5);
        $lockoutWindow = now()->subMinutes(15);

        // Subquery for locked user IDs
        $lockedEmails = LoginAttempt::where('successful', false)
            ->where('created_at', '>=', $lockoutWindow)
            ->groupBy('email')
            ->havingRaw('COUNT(*) >= ?', [$maxAttempts])
            ->pluck('email')
            ->toArray();

        // Count stats for quick filter tabs
        $stats = [
            'total' => User::count(),
            'active' => User::where(fn($q) => $q->whereNull('status')->orWhere('status', 'active'))->count(),
            'suspended' => User::where('status', 'suspended')->count(),
            'banned' => User::where('status', 'banned')->count(),
            'locked' => User::whereIn('email', $lockedEmails)->count(),
        ];

        $q = User::query()->withCount('opportunities');

        if ($search) {
            $cleanSearch = ltrim(trim($search), '@#');
            $q->where(function ($sub) use ($search, $cleanSearch) {
                $sub->where('name', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$cleanSearch}%")
                    ->orWhere('email', 'like', "%{$search}%");

                if (is_numeric($cleanSearch)) {
                    $sub->orWhere('id', (int) $cleanSearch);
                }

                $lower = strtolower(trim($search));
                if (str_contains($lower, 'admin')) {
                    $sub->orWhereHas('roles', fn($rq) => $rq->where('name', 'Admin'));
                }
                if (str_contains($lower, 'brand') || str_contains($lower, 'manager')) {
                    $sub->orWhereHas('roles', fn($rq) => $rq->where('name', 'Manager'));
                }
                if (str_contains($lower, 'entrepreneur') || str_contains($lower, 'user')) {
                    $sub->orWhereHas('roles', fn($rq) => $rq->where('name', 'User'));
                }

                if ($lower === 'active') {
                    $sub->orWhere(fn($sq) => $sq->whereNull('status')->orWhere('status', 'active'));
                } elseif (in_array($lower, ['suspended', 'banned'])) {
                    $sub->orWhere('status', $lower);
                }

                if (str_contains($lower, 'verified')) {
                    $sub->orWhere('is_brand_verified', true);
                }
            });
        }

        if ($status === 'active') {
            $q->where(fn($sub) => $sub->whereNull('status')->orWhere('status', 'active'));
        } elseif ($status === 'suspended') {
            $q->where('status', 'suspended');
        } elseif ($status === 'banned') {
            $q->where('status', 'banned');
        } elseif ($status === 'locked') {
            $q->whereIn('email', $lockedEmails);
        }

        if ($role !== 'all') {
            $q->role($role);
        }

        if ($verified === '1') {
            $q->where('is_brand_verified', true);
        } elseif ($verified === '0') {
            $q->where('is_brand_verified', false);
        }

        // Sorting
        if ($sort === 'warnings') {
            $q->orderBy('warning_count', $order);
        } elseif ($sort === 'posts') {
            $q->orderBy('opportunities_count', $order);
        } elseif ($sort === 'name') {
            $q->orderBy('name', $order);
        } else {
            $q->orderBy('id', $order);
        }

        $paginated = $q->paginate($perPage)->withQueryString();

        // Get strikes counts for the current page users
        $userIds = $paginated->pluck('id')->all();
        $strikesMap = [];
        if (! empty($userIds)) {
            // Count accepted reports targeting these users directly or their content
            $userReports = Report::where('status', 'accepted')
                ->where('reportable_type', 'user')
                ->whereIn('reportable_id', $userIds)
                ->groupBy('reportable_id')
                ->selectRaw('reportable_id, count(*) as cnt')
                ->pluck('cnt', 'reportable_id')
                ->toArray();

            $oppReports = DB::table('reports as r')
                ->join('opportunities as o', 'o.id', '=', 'r.reportable_id')
                ->where('r.status', 'accepted')
                ->whereIn('r.reportable_type', ['opportunity_feed', 'opportunity_reel'])
                ->whereIn('o.user_id', $userIds)
                ->groupBy('o.user_id')
                ->selectRaw('o.user_id, count(*) as cnt')
                ->pluck('cnt', 'o.user_id')
                ->toArray();

            $commentReports = DB::table('reports as r')
                ->join('comments as c', 'c.id', '=', 'r.reportable_id')
                ->where('r.status', 'accepted')
                ->where('r.reportable_type', 'comment')
                ->whereIn('c.user_id', $userIds)
                ->groupBy('c.user_id')
                ->selectRaw('c.user_id, count(*) as cnt')
                ->pluck('cnt', 'c.user_id')
                ->toArray();

            foreach ($userIds as $uid) {
                $strikesMap[$uid] = ($userReports[$uid] ?? 0) + ($oppReports[$uid] ?? 0) + ($commentReports[$uid] ?? 0);
            }
        }

        $users = $paginated->through(function ($u) use ($lockedEmails, $strikesMap) {
            $isLocked = in_array($u->email, $lockedEmails, true);
            $roles = $u->getRoleNames()->all();
            $mainRole = !empty($roles) ? $roles[0] : ($u->role === 'brand' ? 'Manager' : ($u->role === 'admin' ? 'Admin' : 'User'));

            return [
                'id' => $u->id,
                'name' => $u->name,
                'username' => $u->username ?? "user-{$u->id}",
                'email' => $u->email,
                'avatar' => $u->avatar,
                'role' => $mainRole,
                'status' => $u->status ?? 'active',
                'isBrandVerified' => (bool) $u->is_brand_verified,
                'warningCount' => (int) ($u->warning_count ?? 0),
                'strikesCount' => (int) ($strikesMap[$u->id] ?? 0),
                'opportunitiesCount' => (int) ($u->opportunities_count ?? 0),
                'suspendedUntil' => $u->suspended_until?->toIso8601String(),
                'suspendedUntilHuman' => $u->suspended_until?->diffForHumans(),
                'bannedAt' => $u->banned_at?->toIso8601String(),
                'banReason' => $u->ban_reason,
                'isLocked' => $isLocked,
                'createdAt' => $u->created_at?->toIso8601String(),
                'createdAtHuman' => $u->created_at?->diffForHumans(),
            ];
        });

        if ($request->wantsJson() || $request->query('ajax') == '1') {
            return response()->json([
                'users' => $users,
                'stats' => $stats,
                'filters' => [
                    'search' => $search,
                    'status' => $status,
                    'role' => $role,
                    'verified' => $verified,
                    'sort' => $sort,
                    'order' => $order,
                ],
            ]);
        }

        return Inertia::render('Admin/Users', [
            'users' => $users,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'role' => $role,
                'verified' => $verified,
                'sort' => $sort,
                'order' => $order,
            ],
            'stats' => $stats,
        ]);
    }

    public function show(User $user)
    {
        abort_unless(request()->user()?->can('users.manage'), 403, 'Admin access only.');

        $offenderHistory = $this->reports->offenderHistory((int) $user->id);

        $loginAttempts = LoginAttempt::where('email', $user->email)
            ->latest('created_at')
            ->limit(10)
            ->get()
            ->map(fn($a) => [
                'id' => $a->id,
                'ip' => $a->ip,
                'successful' => (bool) $a->successful,
                'userAgent' => $a->user_agent,
                'createdAt' => $a->created_at?->toIso8601String(),
                'createdAtHuman' => $a->created_at?->diffForHumans(),
            ]);

        $auditLogs = AdminAction::with('admin:id,name,username')
            ->where('target_type', 'User')
            ->where('target_id', $user->id)
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn($l) => [
                'id' => $l->id,
                'action' => $l->action,
                'adminName' => $l->admin?->name ?? 'System',
                'reason' => $l->reason,
                'meta' => $l->meta,
                'createdAt' => $l->created_at?->toIso8601String(),
                'createdAtHuman' => $l->created_at?->diffForHumans(),
            ]);

        $opportunities = Opportunity::where('user_id', $user->id)
            ->latest()
            ->limit(6)
            ->get(['id', 'slug', 'brand_name', 'headline', 'type', 'likes_count', 'verified', 'hidden_by_moderation'])
            ->map(fn($o) => [
                'id' => $o->id,
                'slug' => $o->slug ?: (string) $o->id,
                'headline' => $o->headline,
                'type' => $o->type,
                'likes' => (int) $o->likes_count,
                'verified' => (bool) $o->verified,
                'hidden' => (bool) ($o->hidden_by_moderation ?? false),
            ]);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'role' => $user->getRoleNames()->first() ?? $user->role,
                'status' => $user->status ?? 'active',
                'isBrandVerified' => (bool) $user->is_brand_verified,
                'warningCount' => (int) ($user->warning_count ?? 0),
                'suspendedUntil' => $user->suspended_until?->toIso8601String(),
                'bannedAt' => $user->banned_at?->toIso8601String(),
                'banReason' => $user->ban_reason,
                'createdAt' => $user->created_at?->toIso8601String(),
            ],
            'offenderHistory' => $offenderHistory,
            'loginAttempts' => $loginAttempts,
            'auditLogs' => $auditLogs,
            'opportunities' => $opportunities,
        ]);
    }

    public function warn(Request $request, User $user)
    {
        abort_unless($request->user()?->can('users.manage'), 403, 'Admin access only.');
        abort_if($user->id === $request->user()->id, 422, 'You cannot warn your own account.');
        $data = $request->validate(['reason' => 'required|string|min:5|max:1000']);

        $this->enforcement->warn($user->id, $data['reason']);

        AdminAction::log(
            adminId: $request->user()->id,
            action: 'user.warn',
            targetType: 'User',
            targetId: $user->id,
            reason: $data['reason']
        );

        $this->notifications->push(
            $user->id,
            'moderation_warning',
            'You received an official moderation warning: ' . $data['reason'],
            '/notifications'
        );

        return back()->with('success', "Warning issued to {$user->name}.");
    }

    public function suspend(Request $request, User $user)
    {
        abort_unless($request->user()?->can('users.manage'), 403, 'Admin access only.');
        abort_if($user->id === $request->user()->id, 422, 'You cannot suspend your own account.');
        $data = $request->validate([
            'days' => 'required|integer|in:1,3,7,14,30,90',
            'reason' => 'required|string|min:5|max:1000',
        ]);

        $this->enforcement->suspend($user->id, (int) $data['days'], $data['reason']);

        AdminAction::log(
            adminId: $request->user()->id,
            action: 'user.suspend',
            targetType: 'User',
            targetId: $user->id,
            reason: $data['reason'],
            meta: ['duration_days' => $data['days']]
        );

        $this->notifications->push(
            $user->id,
            'moderation_suspend',
            "Your account has been suspended for {$data['days']} days. Reason: {$data['reason']}",
            '/notifications'
        );

        return back()->with('success', "User {$user->name} suspended for {$data['days']} days.");
    }

    public function unsuspend(Request $request, User $user)
    {
        abort_unless($request->user()?->can('users.manage'), 403, 'Admin access only.');

        $this->enforcement->unsuspend($user->id);

        AdminAction::log(
            adminId: $request->user()->id,
            action: 'user.unsuspend',
            targetType: 'User',
            targetId: $user->id,
            reason: 'Suspension lifted by admin.'
        );

        $this->notifications->push(
            $user->id,
            'moderation_lift',
            'Your account suspension has been lifted by an administrator.',
            '/notifications'
        );

        return back()->with('success', "Suspension lifted for {$user->name}.");
    }

    public function ban(Request $request, User $user)
    {
        abort_unless($request->user()?->can('users.manage'), 403, 'Admin access only.');
        abort_if($user->id === $request->user()->id, 422, 'You cannot ban your own account.');

        $data = $request->validate(['reason' => 'required|string|min:5|max:1000']);

        $this->enforcement->ban($user->id, $data['reason']);

        AdminAction::log(
            adminId: $request->user()->id,
            action: 'user.ban',
            targetType: 'User',
            targetId: $user->id,
            reason: $data['reason']
        );

        $this->notifications->push(
            $user->id,
            'moderation_ban',
            'Your account has been permanently banned. Reason: ' . $data['reason'],
            '/notifications'
        );

        return back()->with('success', "User {$user->name} permanently banned.");
    }

    public function unban(Request $request, User $user)
    {
        abort_unless($request->user()?->can('users.manage'), 403, 'Admin access only.');

        $this->enforcement->unban($user->id);

        AdminAction::log(
            adminId: $request->user()->id,
            action: 'user.unban',
            targetType: 'User',
            targetId: $user->id,
            reason: 'Ban removed by admin.'
        );

        return back()->with('success', "Ban removed for {$user->name}.");
    }

    public function changeRole(Request $request, User $user)
    {
        abort_unless($request->user()?->can('users.manage'), 403, 'Admin access only.');
        
        $data = $request->validate([
            'role' => 'required|string|in:Admin,Manager,User',
        ]);

        abort_if($user->id === $request->user()->id, 422, 'You cannot change the role of your own account.');

        $newRole = $data['role'];

        $user->syncRoles([$newRole]);
        $user->forceFill([
            'role' => match ($newRole) {
                'Admin' => 'admin',
                'Manager' => 'brand',
                default => 'entrepreneur',
            },
        ])->save();

        AdminAction::log(
            adminId: $request->user()->id,
            action: 'user.role_change',
            targetType: 'User',
            targetId: $user->id,
            reason: "Role updated to {$newRole}."
        );

        $this->notifications->push(
            $user->id,
            'role_change',
            "Your platform role has been updated to {$newRole}.",
            '/profile/edit'
        );

        return back()->with('success', "Role for {$user->name} updated to {$newRole}.");
    }

    public function resetPassword(Request $request, User $user)
    {
        abort_unless($request->user()?->can('users.manage'), 403, 'Admin access only.');

        $tempPassword = Str::random(12);

        $user->forceFill(['password' => Hash::make($tempPassword)])->save();
        $user->tokens()->delete();

        AdminAction::log(
            adminId: $request->user()->id,
            action: 'user.reset_password',
            targetType: 'User',
            targetId: $user->id,
            reason: 'Admin generated temporary password.'
        );

        return response()->json([
            'tempPassword' => $tempPassword,
            'message' => "Temporary password generated for {$user->name}.",
        ]);
    }

    public function unlock(Request $request, User $user)
    {
        abort_unless($request->user()?->can('users.manage'), 403, 'Admin access only.');

        LoginAttempt::where('email', $user->email)
            ->orWhere('user_id', $user->id)
            ->delete();

        AdminAction::log(
            adminId: $request->user()->id,
            action: 'user.unlock',
            targetType: 'User',
            targetId: $user->id,
            reason: 'Login lockout records cleared.'
        );

        return back()->with('success', "Lockout cleared for {$user->name}.");
    }
}
