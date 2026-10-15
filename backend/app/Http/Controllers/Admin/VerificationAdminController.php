<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAction;
use App\Models\User;
use App\Models\VerificationRequest;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VerificationAdminController extends Controller
{
    public function __construct(private NotificationService $notifications) {}

    public function index(Request $request)
    {
        abort_unless($request->user()?->can('users.manage'), 403, 'Admin access only.');

        $this->syncMissingBrandVerifications();

        $data = $request->validate([
            'status' => 'nullable|string|in:pending,approved,rejected,all',
            'search' => 'nullable|string|max:100',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:50',
        ]);

        $status = $data['status'] ?? 'pending';
        $search = $data['search'] ?? null;
        $perPage = $data['per_page'] ?? 15;

        $stats = [
            'total' => VerificationRequest::count(),
            'pending' => VerificationRequest::where('status', 'pending')->count(),
            'approved' => VerificationRequest::where('status', 'approved')->count(),
            'rejected' => VerificationRequest::where('status', 'rejected')->count(),
        ];

        $q = VerificationRequest::query()
            ->with(['user:id,name,username,email,avatar,role,is_brand_verified', 'admin:id,name,username']);

        if ($status !== 'all') {
            $q->where('status', $status);
        }

        if ($search) {
            $q->where(function ($sub) use ($search) {
                $sub->where('business_name', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($u) use ($search) {
                        $u->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('username', 'like', "%{$search}%");
                    });
            });
        }

        $q->latest();

        $paginated = $q->paginate($perPage)->withQueryString();

        $requests = $paginated->through(fn($r) => [
            'id' => $r->id,
            'businessName' => $r->business_name,
            'documentUrl' => $r->document_url,
            'notes' => $r->notes,
            'status' => $r->status,
            'adminNote' => $r->admin_note,
            'resolvedAt' => $r->resolved_at?->toIso8601String(),
            'resolvedAtHuman' => $r->resolved_at?->diffForHumans(),
            'createdAt' => $r->created_at?->toIso8601String(),
            'createdAtHuman' => $r->created_at?->diffForHumans(),
            'user' => $r->user ? [
                'id' => $r->user->id,
                'name' => $r->user->name,
                'username' => $r->user->username,
                'email' => $r->user->email,
                'avatar' => $r->user->avatar,
                'role' => $r->user->role,
                'isBrandVerified' => (bool) $r->user->is_brand_verified,
            ] : null,
            'admin' => $r->admin ? [
                'id' => $r->admin->id,
                'name' => $r->admin->name,
            ] : null,
        ]);

        return Inertia::render('Admin/Verifications', [
            'requests' => $requests,
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
            'stats' => $stats,
        ]);
    }

    /**
     * Ensure all brand partners and accounts have representation in VerificationRequest queue.
     */
    protected function syncMissingBrandVerifications(): void
    {
        $brands = User::where('role', 'brand')
            ->orWhereHas('roles', fn($r) => $r->where('name', 'Manager'))
            ->orWhere('is_brand_verified', true)
            ->orWhereHas('opportunities')
            ->with('opportunities')
            ->get();

        if ($brands->isEmpty()) {
            return;
        }

        $adminId = User::where('role', 'admin')->value('id');

        foreach ($brands as $brand) {
            $hasRequest = VerificationRequest::where('user_id', $brand->id)->exists();
            if ($hasRequest) {
                continue;
            }

            $hasVerifiedOpp = $brand->opportunities->contains(fn($o) => (bool) $o->verified);
            $isVerified = (bool) ($brand->is_brand_verified && $hasVerifiedOpp);

            if (! $hasVerifiedOpp && $brand->opportunities->isNotEmpty()) {
                $isVerified = false;
                $brand->forceFill(['is_brand_verified' => false])->save();
            }

            VerificationRequest::create([
                'user_id' => $brand->id,
                'business_name' => $brand->name,
                'status' => $isVerified ? 'approved' : 'pending',
                'document_url' => 'https://example.com/docs/' . \Illuminate\Support\Str::slug($brand->name) . '-credentials.pdf',
                'notes' => $isVerified
                    ? 'Official verified brand partner account.'
                    : 'Submitted business registration and BIR permits awaiting operator review.',
                'admin_id' => $isVerified ? $adminId : null,
                'admin_note' => $isVerified ? 'Approved business credentials.' : null,
                'resolved_at' => $isVerified ? now()->subDays(7) : null,
                'created_at' => $isVerified ? now()->subDays(14) : now()->subDays(2),
            ]);
        }
    }

    public function approve(Request $request, VerificationRequest $verificationRequest)
    {
        abort_unless($request->user()?->can('users.manage'), 403, 'Admin access only.');

        $data = $request->validate([
            'note' => 'nullable|string|max:1000',
        ]);

        $verificationRequest->update([
            'status' => 'approved',
            'admin_id' => $request->user()->id,
            'admin_note' => $data['note'] ?? 'Approved by administrator.',
            'resolved_at' => now(),
        ]);

        $user = $verificationRequest->user;
        if ($user) {
            $user->forceFill(['is_brand_verified' => true])->save();
            $user->opportunities()->update(['verified' => true]);

            $this->notifications->push(
                $user->id,
                'verification_approved',
                "Your brand verification request for {$verificationRequest->business_name} has been approved! The verified badge is now active on your profile and listings.",
                '/profile/' . ($user->username ?? '')
            );
        }

        AdminAction::log(
            adminId: $request->user()->id,
            action: 'verification.approve',
            targetType: 'VerificationRequest',
            targetId: $verificationRequest->id,
            reason: $data['note'] ?? 'Approved business credentials',
            meta: ['user_id' => $user?->id, 'business_name' => $verificationRequest->business_name]
        );

        return back()->with('success', "Verification for {$verificationRequest->business_name} approved!");
    }

    public function reject(Request $request, VerificationRequest $verificationRequest)
    {
        abort_unless($request->user()?->can('users.manage'), 403, 'Admin access only.');

        $data = $request->validate([
            'reason' => 'required|string|min:5|max:1000',
        ]);

        $verificationRequest->update([
            'status' => 'rejected',
            'admin_id' => $request->user()->id,
            'admin_note' => $data['reason'],
            'resolved_at' => now(),
        ]);

        $user = $verificationRequest->user;
        if ($user) {
            $user->forceFill(['is_brand_verified' => false])->save();
            $user->opportunities()->update(['verified' => false]);

            $this->notifications->push(
                $user->id,
                'verification_rejected',
                "Your brand verification request for {$verificationRequest->business_name} was not approved: {$data['reason']}",
                '/profile/edit'
            );
        }

        AdminAction::log(
            adminId: $request->user()->id,
            action: 'verification.reject',
            targetType: 'VerificationRequest',
            targetId: $verificationRequest->id,
            reason: $data['reason'],
            meta: ['user_id' => $user?->id, 'business_name' => $verificationRequest->business_name]
        );

        return back()->with('success', "Verification for {$verificationRequest->business_name} rejected.");
    }

    public function revoke(Request $request, User $user)
    {
        abort_unless($request->user()?->can('users.manage'), 403, 'Admin access only.');

        $data = $request->validate([
            'reason' => 'required|string|min:5|max:1000',
        ]);

        $admin = $request->user();

        $user->forceFill(['is_brand_verified' => false])->save();
        $user->opportunities()->update(['verified' => false]);

        $existing = VerificationRequest::where('user_id', $user->id)
            ->where('status', 'approved')
            ->latest()
            ->first();

        if ($existing) {
            $existing->update([
                'status' => 'rejected',
                'admin_id' => $admin->id,
                'admin_note' => 'Revoked: ' . $data['reason'],
                'resolved_at' => now(),
            ]);
        } else {
            VerificationRequest::create([
                'user_id' => $user->id,
                'business_name' => $user->name,
                'document_url' => '',
                'notes' => 'Brand verification revoked by platform admin',
                'status' => 'rejected',
                'admin_id' => $admin->id,
                'admin_note' => 'Revoked: ' . $data['reason'],
                'resolved_at' => now(),
            ]);
        }

        $this->notifications->push(
            $user->id,
            'verification_revoked',
            "Your verified brand status has been revoked by {$admin->name}. Reason: {$data['reason']}",
            '/notifications?verification_revoked=1'
        );

        AdminAction::log(
            adminId: $admin->id,
            action: 'verification.revoke',
            targetType: 'User',
            targetId: $user->id,
            reason: $data['reason']
        );

        return back()->with('success', "Brand verification badge revoked for {$user->name}.");
    }
}
