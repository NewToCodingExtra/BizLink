<?php

namespace App\Http\Controllers;

use App\Models\AppNotification;
use App\Models\Comment;
use App\Models\Opportunity;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function index(Opportunity $opportunity)
    {
        $comments = $opportunity->comments()->with('user:id,name,avatar')->latest()->get();
        return response()->json(['data' => $comments->map(fn($c) => $this->serialize($c))]);
    }

    public function store(Request $request, Opportunity $opportunity)
    {
        $data = $request->validate([
            'text' => 'required|string|max:1000',
        ]);

        $user = $request->user();
        $isSeller = $opportunity->user_id && $user && ((int) $opportunity->user_id === (int) $user->id);

        $comment = Comment::create([
            'opportunity_id' => $opportunity->id,
            'user_id' => $user?->id,
            'author' => $user?->name ?? 'Guest',
            'avatar' => $user?->avatar ?? 'https://i.pravatar.cc/100?u=guest',
            'text' => $data['text'],
            'is_seller_reply' => (bool) $isSeller,
        ]);

        if ($user) {
            AppNotification::create([
                'user_id' => $user->id,
                'type' => 'comment',
                'message' => "New comment on {$opportunity->headline}",
                'link' => "/post/{$opportunity->id}",
                'read' => false,
            ]);
        }

        return response()->json(['data' => $this->serialize($comment)], 201);
    }

    private function serialize(Comment $c): array
    {
        return [
            'id' => $c->id,
            'postId' => $c->opportunity_id,
            'userId' => $c->user_id,
            'author' => $c->author,
            'avatar' => $c->avatar,
            'text' => $c->text,
            'timestamp' => $c->created_at?->diffForHumans() ?? 'now',
            'isSellerReply' => (bool) $c->is_seller_reply,
        ];
    }
}
