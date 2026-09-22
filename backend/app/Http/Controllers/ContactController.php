<?php

namespace App\Http\Controllers;

use App\Models\AppNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ContactController extends Controller
{
    public function submit(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'message' => 'required|string|max:2000',
            'opportunity_id' => 'sometimes|nullable|exists:opportunities,id',
        ]);

        Log::channel('stack')->info('Contact form', $data);

        if ($request->user()) {
            AppNotification::create([
                'user_id' => $request->user()->id,
                'type' => 'contact',
                'message' => 'Thanks ' . $data['name'] . ' — we received your message and will reply to ' . $data['email'],
                'read' => false,
            ]);
        }

        return response()->json(['message' => 'Message received. We will reply shortly.'], 201);
    }
}
