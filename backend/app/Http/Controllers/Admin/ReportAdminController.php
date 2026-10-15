<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Opportunity;
use App\Models\Report;
use App\Models\ReportCategory;
use App\Models\Story;
use App\Models\User;
use App\Services\ReportService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportAdminController extends Controller
{
    public function __construct(private ReportService $reports) {}

    public function index(Request $request)
    {
        abort_unless($request->user()?->can('users.manage'), 403, 'Admin access only.');

        $data = $request->validate([
            'status' => 'nullable|in:pending,accepted,rejected,all',
            'types' => 'nullable|string',
            'category' => 'nullable|string|max:64',
            'severity_min' => 'nullable|integer|min:0|max:100',
            'search' => 'nullable|string|max:255',
            'sort' => 'nullable|in:priority,newest,reports,severity',
            'order' => 'nullable|in:asc,desc',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:50',
        ]);

        $status = $data['status'] ?? 'pending';
        $sort = $data['sort'] ?? 'priority';
        $order = $data['order'] ?? 'desc';
        $perPage = $data['per_page'] ?? 15;

        $q = Report::query()->with(['category:id,key,label,severity', 'reporter:id,name,username,avatar']);

        if ($status !== 'all') {
            $q->where('status', $status);
        }
        if (! empty($data['types'])) {
            $types = array_values(array_intersect(
                explode(',', (string) $data['types']),
                Report::TYPES
            ));
            if (! empty($types)) {
                $q->whereIn('reportable_type', $types);
            }
        }
        if (! empty($data['category'])) {
            $catId = ReportCategory::where('key', $data['category'])->value('id');
            if ($catId) {
                $q->where('category_id', $catId);
            }
        }
        if (! empty($data['severity_min'])) {
            $q->whereHas('category', fn ($c) => $c->where('severity', '>=', (int) $data['severity_min']));
        }
        if (! empty($data['search'])) {
            $s = '%' . trim((string) $data['search']) . '%';
            $q->where(function ($w) use ($s) {
                $w->where('details', 'like', $s)
                    ->orWhere('admin_note', 'like', $s)
                    ->orWhereHas('reporter', fn ($r) => $r->where('name', 'like', $s)->orWhere('username', 'like', $s));
            });
        }

        match ($sort) {
            'newest' => $q->orderBy('created_at', $order)->orderBy('id', $order),
            'severity' => $q->join('report_categories as rc', 'rc.id', '=', 'reports.category_id')
                ->orderBy('rc.severity', $order)->orderBy('reports.created_at', 'desc')
                ->select('reports.*'),
            'reports' => $q->orderBy('priority_score', $order)->orderBy('created_at', 'desc'),
            default => $q->orderBy('priority_score', $order)->orderBy('created_at', 'desc'),
        };

        $paginator = $q->paginate($perPage)->withQueryString();

        $items = collect($paginator->items())->map(fn (Report $r) => $this->serializeRow($r));

        return Inertia::render('Admin/Reports', [
            'filters' => [
                'status' => $status,
                'types' => $data['types'] ?? '',
                'category' => $data['category'] ?? '',
                'severityMin' => (int) ($data['severity_min'] ?? 0),
                'search' => $data['search'] ?? '',
                'sort' => $sort,
                'order' => $order,
            ],
            'categories' => ReportCategory::where('active', true)->orderByDesc('severity')->get(['key', 'label', 'severity']),
            'types' => Report::TYPES,
            'stats' => [
                'pending' => Report::where('status', 'pending')->count(),
                'acceptedToday' => Report::where('status', 'accepted')->whereDate('resolved_at', today())->count(),
                'rejectedToday' => Report::where('status', 'rejected')->whereDate('resolved_at', today())->count(),
                'highSeverity' => Report::where('status', 'pending')->whereHas('category', fn ($c) => $c->where('severity', '>=', 70))->count(),
            ],
            'reports' => [
                'data' => $items->values(),
                'meta' => [
                    'currentPage' => $paginator->currentPage(),
                    'lastPage' => $paginator->lastPage(),
                    'perPage' => $paginator->perPage(),
                    'total' => $paginator->total(),
                ],
            ],
        ]);
    }

    public function show(Request $request, Report $report)
    {
        abort_unless($request->user()?->can('users.manage'), 403, 'Admin access only.');
        $report->load(['category', 'reporter:id,name,username,avatar', 'admin:id,name,username', 'actions.admin:id,name']);

        $siblings = Report::where('reportable_type', $report->reportable_type)
            ->where('reportable_id', $report->reportable_id)
            ->with(['category:id,key,label,severity', 'reporter:id,name,username,avatar'])
            ->latest()
            ->limit(20)
            ->get();

        $target = $this->serializeTarget($report->reportable_type, $report->reportable_id);
        $offenderId = $target['offenderId'] ?? null;

        $serialized = $this->serializeRow($report->fresh(['category', 'reporter']));

        return response()->json([
            'report' => $serialized,
            'data' => $serialized,
            'target' => $target,
            'siblings' => $siblings->map(fn ($r) => $this->serializeRow($r))->values(),
            'history' => $offenderId ? $this->reports->offenderHistory((int) $offenderId) : null,
            'offender' => $offenderId ? User::find($offenderId)?->only(['id', 'name', 'username', 'avatar', 'status', 'warning_count']) : null,
        ]);
    }

    public function reject(Request $request, Report $report)
    {
        abort_unless($request->user()?->can('users.manage'), 403, 'Admin access only.');
        $data = $request->validate(['reason' => 'required|string|min:10|max:2000']);
        $result = $this->reports->reject($request->user(), $report, $data['reason']);
        if ($request->header('X-Inertia')) {
            return redirect()->back()->with('success', 'Report rejected and reporter notified.');
        }
        return response()->json(['data' => $result]);
    }

    public function accept(Request $request, Report $report)
    {
        abort_unless($request->user()?->can('users.manage'), 403, 'Admin access only.');
        $data = $request->validate([
            'action' => 'required|in:warn,remove_content,suspend,ban',
            'reason' => 'required|string|min:10|max:2000',
            'duration_days' => 'nullable|integer|min:1|max:365',
            'remove_content' => 'nullable|boolean',
        ]);
        $result = $this->reports->accept(
            $request->user(),
            $report,
            $data['action'],
            $data['reason'],
            $data['duration_days'] ?? null,
            (bool) ($data['remove_content'] ?? false)
        );
        if ($request->header('X-Inertia')) {
            return redirect()->back()->with('success', 'Action applied and both parties notified.');
        }
        return response()->json(['data' => $result]);
    }

    public function history(Request $request, User $user)
    {
        abort_unless($request->user()?->can('users.manage'), 403, 'Admin access only.');
        return response()->json(['data' => $this->reports->offenderHistory((int) $user->id)]);
    }

    private function serializeRow(Report $r): array
    {
        $siblingsCount = Report::where('reportable_type', $r->reportable_type)
            ->where('reportable_id', $r->reportable_id)
            ->count();

        $category = null;
        if ($r->category) {
            $category = [
                'id' => $r->category->id,
                'key' => $r->category->key,
                'label' => $r->category->label,
                'severity' => (int) $r->category->severity,
            ];
        } elseif ($r->category_id) {
            $cat = ReportCategory::find($r->category_id);
            if ($cat) {
                $category = [
                    'id' => $cat->id,
                    'key' => $cat->key,
                    'label' => $cat->label,
                    'severity' => (int) $cat->severity,
                ];
            }
        }
        if (! $category) {
            $category = [
                'id' => null,
                'key' => 'guidelines_violation',
                'label' => 'Community Guidelines Violation',
                'severity' => 20,
            ];
        }

        $reporter = null;
        if ($r->reporter) {
            $reporter = [
                'id' => $r->reporter->id,
                'name' => $r->reporter->name,
                'username' => $r->reporter->username,
                'avatar' => $r->reporter->avatar,
            ];
        } else {
            $reporter = [
                'id' => null,
                'name' => 'Community Member',
                'username' => 'anonymous',
                'avatar' => null,
            ];
        }

        return [
            'id' => $r->id,
            'type' => $r->reportable_type,
            'targetId' => $r->reportable_id,
            'status' => $r->status,
            'priority' => (int) $r->priority_score,
            'details' => $r->details,
            'adminNote' => $r->admin_note,
            'actionTaken' => $r->action_taken,
            'createdAt' => $r->created_at?->toIso8601String(),
            'createdAgo' => $r->created_at?->diffForHumans(),
            'resolvedAt' => $r->resolved_at?->toIso8601String(),
            'category' => $category,
            'reporter' => $reporter,
            'siblingsCount' => $siblingsCount,
        ];
    }

    private function serializeTarget(string $type, int $id): array
    {
        try {
            switch ($type) {
                case 'opportunity_feed':
                case 'opportunity_reel':
                    $o = Opportunity::find($id);
                    return $o ? [
                        'kind' => $type === 'opportunity_reel' ? 'reel' : 'post',
                        'headline' => $o->headline,
                        'preview' => $o->headline . ' — ' . mb_substr((string) $o->description, 0, 160),
                        'link' => '/post/' . $o->slug,
                        'image' => $o->image,
                        'offenderId' => $o->user_id,
                        'hidden' => (bool) ($o->hidden_by_moderation ?? false),
                    ] : ['kind' => 'post', 'preview' => '[deleted]', 'offenderId' => null];
                case 'comment':
                    $c = Comment::withTrashed()->find($id);
                    return $c ? [
                        'kind' => 'comment', 'preview' => mb_substr((string) $c->text, 0, 280),
                        'link' => null, 'offenderId' => $c->user_id, 'hidden' => (bool) $c->trashed(),
                    ] : ['kind' => 'comment', 'preview' => '[deleted]', 'offenderId' => null];
                case 'story':
                    $s = Story::find($id);
                    return $s ? [
                        'kind' => 'story', 'preview' => mb_substr((string) ($s->caption ?? 'Story'), 0, 280),
                        'link' => '/stories/' . ($s->slug ?? ''), 'image' => $s->media_url,
                        'offenderId' => $s->user_id, 'hidden' => (bool) ($s->hidden_by_moderation ?? false),
                    ] : ['kind' => 'story', 'preview' => '[deleted]', 'offenderId' => null];
                case 'message':
                    $m = Message::find($id);
                    return $m ? [
                        'kind' => 'message', 'preview' => mb_substr((string) ($m->is_hidden ? '[hidden]' : $m->text), 0, 280),
                        'link' => '/messages', 'offenderId' => $m->sender_id, 'hidden' => (bool) $m->is_hidden,
                    ] : ['kind' => 'message', 'preview' => '[deleted]', 'offenderId' => null];
                case 'conversation':
                    $cv = Conversation::find($id);
                    return $cv ? [
                        'kind' => 'conversation', 'preview' => mb_substr((string) $cv->last_message, 0, 280),
                        'link' => '/messages', 'offenderId' => $cv->user_id,
                    ] : ['kind' => 'conversation', 'preview' => '[deleted]', 'offenderId' => null];
                case 'user':
                    $u = User::find($id);
                    return $u ? [
                        'kind' => 'user', 'preview' => $u->name . ' (@' . ($u->username ?? $u->id) . ')',
                        'link' => null, 'offenderId' => $u->id,
                    ] : ['kind' => 'user', 'preview' => '[deleted]', 'offenderId' => null];
            }
        } catch (\Throwable $e) {
        }
        return ['kind' => $type, 'preview' => '[unavailable]', 'offenderId' => null];
    }
}
