<?php

namespace App\Http\Controllers;

use App\Models\AppNotification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notes = $request->user()->notifications()->latest()->paginate(30);
        return response()->json([
            'data' => $notes->getCollection()->map(fn($n) => [
                'id' => $n->id,
                'type' => $n->type,
                'message' => $n->message,
                'link' => $n->link,
                'read' => (bool) $n->read,
                'timestamp' => $n->created_at?->diffForHumans(),
            ]),
            'meta' => ['total' => $notes->total(), 'unread' => $request->user()->notifications()->where('read', false)->count()],
        ]);
    }

    public function markRead(Request $request, AppNotification $notification)
    {
        if ((int) $notification->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $notification->update(['read' => true]);
        return response()->json(['message' => 'Marked read']);
    }

    public function markAllRead(Request $request)
    {
        $request->user()->notifications()->where('read', false)->update(['read' => true]);
        return response()->json(['message' => 'All marked read']);
    }
}
