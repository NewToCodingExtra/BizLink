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
            'opportunity_id' => 'nullable|exists:opportunities,id',
            'story_id' => 'nullable|exists:stories,id',
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255',
            'message' => 'required|string|max:2000',
        ]);

        if (empty($data['opportunity_id']) && empty($data['story_id'])) {
            return response()->json(['message' => 'Must provide opportunity_id or story_id'], 422);
        }

        $user = $request->user();
        
        $attachmentId = null;
        $attachmentType = null;
        $brandId = null;
        $brandName = null;
        $brandAvatar = null;
        $headline = 'Story';
        
        if (!empty($data['opportunity_id'])) {
            $opp = Opportunity::findOrFail($data['opportunity_id']);
            $attachmentId = $opp->id;
            $attachmentType = Opportunity::class;
            $brandId = $opp->brand_id;
            $brandName = $opp->brand_name;
            $brandAvatar = $opp->brand_avatar;
            $headline = $opp->headline;
        } else {
            $story = \App\Models\Story::findOrFail($data['story_id']);
            $attachmentId = $story->id;
            $attachmentType = \App\Models\Story::class;
            $brandId = $story->brand_id;
            $brandName = $story->brand_name;
            $brandAvatar = $story->avatar;
        }

        $convo = Conversation::where('user_id', $user->id)
            ->where('brand_id', $brandId)
            ->first();

        if (!$convo) {
            $convo = Conversation::create([
                'user_id' => $user->id,
                'with_name' => $brandName,
                'avatar' => $brandAvatar,
                'last_message' => $data['message'],
                'unread' => 0,
                'brand_id' => $brandId,
                'opportunity_id' => $data['opportunity_id'] ?? null,
            ]);
        } else {
            $convo->update(['last_message' => $data['message']]);
        }

        $message = Message::create([
            'conversation_id' => $convo->id,
            'sender_id' => $user->id,
            'from_side' => 'me',
            'text' => $data['message'], // Do not prefix with Inquiry:, let UI handle it based on attachment
            'attachment_id' => $attachmentId,
            'attachment_type' => $attachmentType,
        ]);

        // Notify the sender
        AppNotification::create([
            'user_id' => $user->id,
            'type' => 'inquiry',
            'message' => "You inquired on {$headline}",
            'link' => "/messages/{$convo->id}",
            'read' => false,
        ]);

        // Notify the receiver (owner of opportunity/story)
        $ownerId = null;
        if (!empty($data['opportunity_id']) && isset($opp)) {
            $ownerId = $opp->user_id;
        } elseif (!empty($data['story_id']) && isset($story)) {
            $ownerId = $story->user_id;
        }

        if ($ownerId && $ownerId !== $user->id) {
            AppNotification::create([
                'user_id' => $ownerId,
                'type' => 'inquiry',
                'message' => "{$user->name} inquired about {$headline}",
                'link' => "/messages/{$convo->id}",
                'read' => false,
            ]);
        }

        return response()->json([
            'conversation' => $this->serialize($convo->fresh('messages')),
            'message' => [
                'id' => $message->id,
                'conversationId' => $message->conversation_id,
                'from' => 'me',
                'text' => $message->text,
                'time' => $message->created_at?->diffForHumans(),
                'attachment' => $message->attachment ? [
                    'id' => $message->attachment->id,
                    'type' => class_basename($message->attachment_type),
                    'mediaUrl' => $message->attachment->image ?? $message->attachment->media_url ?? null,
                    'videoUrl' => $message->attachment->video_url ?? null,
                    'headline' => $message->attachment->headline ?? $message->attachment->caption ?? 'Story',
                ] : null,
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
            'attachment' => null,
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
            $c->loadMissing('messages.attachment');
            $payload['messages'] = $c->messages->map(fn($m) => [
                'id' => $m->id,
                'conversationId' => $m->conversation_id,
                'from' => $m->from_side === 'them' ? 'them' : 'me',
                'text' => $m->text,
                'time' => $m->created_at?->diffForHumans(),
                'attachment' => $m->attachment ? [
                    'id' => $m->attachment->id,
                    'type' => class_basename($m->attachment_type),
                    'mediaUrl' => $m->attachment->image ?? $m->attachment->media_url ?? null,
                    'videoUrl' => $m->attachment->video_url ?? null,
                    'headline' => $m->attachment->headline ?? $m->attachment->caption ?? 'Story',
                ] : null,
            ])->values();
        }
        return $payload;
    }
}
