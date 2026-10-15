<?php

namespace App\Http\Controllers;

use App\Services\ReportService;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(private ReportService $reports) {}

    public function categories()
    {
        return response()->json(['data' => $this->reports->categories()]);
    }

    private function file(Request $request, string $type, int $id)
    {
        $data = $request->validate([
            'category_key' => 'required|string|max:64',
            'details' => 'nullable|string|max:2000',
        ]);

        $report = $this->reports->file(
            $request->user(),
            $type,
            $id,
            $data['category_key'],
            $data['details'] ?? null
        );

        return response()->json([
            'data' => $report,
            'message' => 'Thanks — our moderation team will review this.',
        ], 201);
    }

    public function reportOpportunity(Request $request, \App\Models\Opportunity $opportunity)
    {
        $type = ($opportunity->media_type ?? 'image') === 'video' ? 'opportunity_reel' : 'opportunity_feed';
        return $this->file($request, $type, (int) $opportunity->id);
    }

    public function reportComment(Request $request, \App\Models\Comment $comment)
    {
        return $this->file($request, 'comment', (int) $comment->id);
    }

    public function reportStory(Request $request, \App\Models\Story $story)
    {
        return $this->file($request, 'story', (int) $story->id);
    }

    public function reportMessage(Request $request, \App\Models\Message $message)
    {
        return $this->file($request, 'message', (int) $message->id);
    }

    public function reportConversation(Request $request, \App\Models\Conversation $conversation)
    {
        return $this->file($request, 'conversation', (int) $conversation->id);
    }

    public function reportUser(Request $request, \App\Models\User $user)
    {
        abort_if((int) $user->id === (int) $request->user()->id, 422, 'You cannot report yourself.');
        return $this->file($request, 'user', (int) $user->id);
    }
}
