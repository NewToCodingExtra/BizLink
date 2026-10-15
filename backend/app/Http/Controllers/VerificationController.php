<?php

namespace App\Http\Controllers;

use App\Models\VerificationRequest;
use Illuminate\Http\Request;

class VerificationController extends Controller
{
    public function store(Request $request)
    {
        $user = $request->user();
        abort_unless($user, 401);

        $data = $request->validate([
            'business_name' => 'required|string|max:191',
            'document_url' => 'nullable|string|max:512',
            'notes' => 'nullable|string|max:1000',
        ]);

        $existingPending = VerificationRequest::where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if ($existingPending) {
            abort(422, 'You already have a pending verification request in review.');
        }

        $req = VerificationRequest::create([
            'user_id' => $user->id,
            'status' => 'pending',
            'business_name' => $data['business_name'],
            'document_url' => $data['document_url'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        return back()->with('success', 'Verification request submitted. Our admin team will review your business credentials.');
    }

    public function status(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['status' => 'unauthenticated']);
        }

        $latest = VerificationRequest::where('user_id', $user->id)->latest()->first();

        return response()->json([
            'isBrandVerified' => (bool) $user->is_brand_verified,
            'latestRequest' => $latest ? [
                'id' => $latest->id,
                'status' => $latest->status,
                'businessName' => $latest->business_name,
                'adminNote' => $latest->admin_note,
                'createdAt' => $latest->created_at?->diffForHumans(),
            ] : null,
        ]);
    }
}
