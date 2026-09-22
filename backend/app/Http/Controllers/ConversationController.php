<?php

namespace App\Http\Controllers;

use App\Models\AppNotification;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Opportunity;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function index(Request $request)
    {
        $convos = $request->user()->conversations()->with('messages')->latest()->get();
        return response()->json(['data' => $convos->map(fn($c) => $this->serialize($c))]);
    }

    public function show(Request $request, Conversation $conversation)
    {
        if ((int) $conversation->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $conversation->load('messages.sender:id,name,avatar');
        $conversation->update(['unread' => 0]);
        return response()->json(['data' => $this->serialize($conversation, true)]);
    }

    public function inquire(Request $request)
    {
        $data = $request->validate([
            'opportunity_id' => 'required|exists:opportunities,id',
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255',
            'message' => 'required|string|max:2000',
        ]);

        $user = $request->user();
        $opp = Opportunity::findOrFail($data['opportunity_id']);

        $convo = Conversation::where('user_id', $user->id)
            ->where('brand_id', $opp->brand_id)
            ->first();

        if (!$convo) {
            $convo = Conversation::create([
                'user_id' => $user->id,
                'with_name' => $opp->brand_name,
                'avatar' => $opp->brand_avatar,
                'last_message' => $data['message'],
                'unread' => 0,
                'brand_id' => $opp->brand_id,
                'opportunity_id' => $opp->id,
            ]);
        } else {
            $convo->update(['last_message' => $data['message']]);
        }

        $message = Message::create([
            'conversation_id' => $convo->id,
            'sender_id' => $user->id,
            'from_side' => 'me',
            'text' => 'Inquiry: ' . $data['message'],
        ]);

        AppNotification::create([
            'user_id' => $user->id,
            'type' => 'inquiry',
            'message' => "You inquired on {$opp->headline}",
            'link' => "/messages/{$convo->id}",
            'read' => false,
        ]);

        return response()->json([
            'conversation' => $this->serialize($convo->fresh('messages')),
            'message' => [
                'id' => $message->id,
                'conversationId' => $message->conversation_id,
                'from' => 'me',
                'text' => $message->text,
                'time' => $message->created_at?->diffForHumans(),
            ],
        ], 201);
    }

    public function send(Request $request, Conversation $conversation)
    {
        if ((int) $conversation->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $data = $request->validate(['text' => 'required|string|max:2000']);
        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $request->user()->id,
            'from_side' => 'me',
            'text' => $data['text'],
        ]);
        $conversation->update(['last_message' => $data['text']]);
        return response()->json(['data' => [
            'id' => $message->id,
            'conversationId' => $message->conversation_id,
            'from' => 'me',
            'text' => $message->text,
            'time' => $message->created_at?->diffForHumans(),
        ]], 201);
    }

    private function serialize(Conversation $c, bool $withMessages = false): array
    {
        $payload = [
            'id' => $c->id,
            'with' => $c->with_name,
            'avatar' => $c->avatar,
            'lastMessage' => $c->last_message,
            'unread' => (int) $c->unread,
            'brandId' => $c->brand_id,
        ];
        if ($withMessages || $c->relationLoaded('messages')) {
            $payload['messages'] = $c->messages->map(fn($m) => [
                'id' => $m->id,
                'conversationId' => $m->conversation_id,
                'from' => $m->from_side === 'them' ? 'them' : 'me',
                'text' => $m->text,
                'time' => $m->created_at?->diffForHumans(),
            ])->values();
        }
        return $payload;
    }
}
