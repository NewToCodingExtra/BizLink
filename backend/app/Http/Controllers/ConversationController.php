<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\Opportunity;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $myBrandIds = \App\Models\Opportunity::where('user_id', $user->id)->pluck('brand_id')->toArray();
        $myStoryBrandIds = \App\Models\Story::where('user_id', $user->id)->pluck('brand_id')->toArray();
        $allMyBrands = array_unique(array_merge($myBrandIds, $myStoryBrandIds));

        $convos = Conversation::where('user_id', $user->id)
            ->orWhereIn('brand_id', $allMyBrands)
            ->with('messages')
            ->latest()
            ->get();
            
        return response()->json(['data' => $convos->map(fn($c) => $this->serialize($c))]);
    }

    public function show(Request $request, Conversation $conversation)
    {
        $user = $request->user();
        $isBuyer = (int) $conversation->user_id === (int) $user->id;
        $isSeller = false;
        
        if (!$isBuyer) {
            $ownerId = Opportunity::where('brand_id', $conversation->brand_id)->value('user_id')
                ?? \App\Models\Story::where('brand_id', $conversation->brand_id)->value('user_id');
            $isSeller = (int) $ownerId === (int) $user->id;
        }

        if (!$isBuyer && !$isSeller) {
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

        $ownerId = null;
        if (!empty($data['opportunity_id']) && isset($opp)) {
            $ownerId = $opp->user_id;
        } elseif (!empty($data['story_id']) && isset($story)) {
            $ownerId = $story->user_id;
        }

        $ownerUsername = null;
        if ($ownerId) {
            $ownerUsername = \App\Models\User::find($ownerId)?->username;
        }

        // Notify the sender
        app(\App\Services\NotificationService::class)->push(
            $user->id,
            'inquiry',
            "You inquired on {$headline}",
            "/messages/" . ($ownerUsername ?: $brandId)
        );

        if ($ownerId && $ownerId !== $user->id) {
            app(\App\Services\NotificationService::class)->push(
                $ownerId,
                'inquiry',
                "{$user->name} inquired about {$headline}",
                "/messages/" . ($user->username ?: $user->id)
            );
        }

        broadcast(new \App\Events\MessageSent($message));

        return response()->json([
            'conversation' => $this->serialize($convo->fresh('messages')),
            'message' => [
                'id' => $message->id,
                'conversationId' => $message->conversation_id,
                'from' => 'me',
                'text' => $message->text,
                'time' => $message->created_at?->diffForHumans(),
                'attachment' => $message->attachment ? $this->attachmentCard($message->attachment, class_basename($message->attachment_type)) : null,
            ],
        ], 201);
    }

    public function send(Request $request, Conversation $conversation)
    {
        $user = $request->user();
        $isBuyer = (int) $conversation->user_id === (int) $user->id;
        $isSeller = false;

        if (!$isBuyer) {
            $ownerId = Opportunity::where('brand_id', $conversation->brand_id)->value('user_id')
                ?? \App\Models\Story::where('brand_id', $conversation->brand_id)->value('user_id');
            $isSeller = (int) $ownerId === (int) $user->id;
        }

        if (!$isBuyer && !$isSeller) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $data = $request->validate([
            'text' => 'required|string|max:2000',
            'attachment.type' => 'nullable|in:opportunity,story',
            'attachment.id' => 'nullable|integer',
        ]);

        $attachmentId = null;
        $attachmentType = null;
        if (!empty($data['attachment']['type']) && !empty($data['attachment']['id'])) {
            $model = $data['attachment']['type'] === 'opportunity'
                ? Opportunity::find($data['attachment']['id'])
                : \App\Models\Story::find($data['attachment']['id']);
            if (!$model) {
                return response()->json(['message' => 'Quoted post no longer exists.'], 422);
            }
            $attachmentId = $model->id;
            $attachmentType = $data['attachment']['type'] === 'opportunity' ? Opportunity::class : \App\Models\Story::class;
        }

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $request->user()->id,
            'from_side' => 'me',
            'text' => $data['text'],
            'attachment_id' => $attachmentId,
            'attachment_type' => $attachmentType,
        ]);
        $conversation->update(['last_message' => $data['text']]);
        broadcast(new \App\Events\MessageSent($message));
        return response()->json(['data' => $this->serializeMessage($message)], 201);
    }

    /**
     * Find-or-create the 1:1 thread for an inquire tap WITHOUT posting.
     * Returns the thread URL (with ?inquiry= quote) for client redirect.
     */
    public function resolve(Request $request)
    {
        $data = $request->validate([
            'type' => 'required|in:opportunity,story',
            'id' => 'required|integer',
        ]);

        $user = $request->user();
        $model = $data['type'] === 'opportunity'
            ? Opportunity::findOrFail($data['id'])
            : \App\Models\Story::findOrFail($data['id']);

        $convo = Conversation::where('user_id', $user->id)
            ->where('brand_id', $model->brand_id)
            ->first();

        if (!$convo) {
            $convo = Conversation::create([
                'user_id' => $user->id,
                'with_name' => $data['type'] === 'opportunity' ? $model->brand_name : $model->brand_name,
                'avatar' => $data['type'] === 'opportunity' ? $model->brand_avatar : $model->avatar,
                'last_message' => '',
                'unread' => 0,
                'brand_id' => $model->brand_id,
                'opportunity_id' => $data['type'] === 'opportunity' ? $model->id : null,
            ]);
        }

        $ownerUsername = \App\Models\User::find($model->user_id)?->username;
        $identifier = $ownerUsername ?: $model->brand_id;

        return response()->json(['url' => "/messages/{$identifier}?inquiry={$data['type']}:{$model->id}"]);
    }

    /**
     * Clickable quote-card payload shared by thread props, send, and inquire.
     */
    public function attachmentCard($model, string $type): array
    {
        $isOpp = $type === 'Opportunity';
        $kind = !$isOpp ? 'story' : (($model->media_type ?? 'image') === 'video' ? 'reel' : 'post');
        return [
            'id' => $model->id,
            'type' => $type,
            'kind' => $kind,
            'slug' => $model->slug ?? null,
            'mediaUrl' => $model->image ?? $model->media_url ?? null,
            'videoUrl' => $model->video_url ?? null,
            'headline' => $model->headline ?? $model->caption ?? 'Story',
        ];
    }

    private function serializeMessage(Message $message): array
    {
        $message->loadMissing('attachment');
        return [
            'id' => $message->id,
            'conversationId' => $message->conversation_id,
            'from' => (int) $message->sender_id === (int) request()->user()?->id ? 'me' : 'them',
            'text' => $message->text,
            'time' => $message->created_at?->diffForHumans(),
            'attachment' => $message->attachment
                ? $this->attachmentCard($message->attachment, class_basename($message->attachment_type))
                : null,
        ];
    }

    private function serialize(Conversation $c, bool $withMessages = false): array
    {
        $viewerId = (int) request()->user()?->id;
        $isBuyer = (int) $c->user_id === $viewerId;
        
        $owner = $this->resolveOwner($c);
        $buyer = \App\Models\User::find($c->user_id);
        
        $payload = [
            'id' => $c->id,
            'with' => $isBuyer ? $c->with_name : ($buyer?->name ?? 'User'),
            'withId' => $isBuyer ? $owner?->id : $buyer?->id,
            'withUsername' => $isBuyer ? $owner?->username : $buyer?->username,
            'avatar' => $isBuyer ? $c->avatar : $buyer?->avatar,
            'lastMessage' => $c->last_message,
            'unread' => (int) $c->unread,
            'brandId' => $c->brand_id,
        ];
        if ($withMessages || $c->relationLoaded('messages')) {
            $c->loadMissing('messages.attachment');
            $payload['messages'] = $c->messages->map(fn($m) => [
                'id' => $m->id,
                'conversationId' => $m->conversation_id,
                'from' => (int) $m->sender_id === (int) request()->user()?->id ? 'me' : 'them',
                'text' => $m->text,
                'time' => $m->created_at?->diffForHumans(),
                'attachment' => $m->attachment ? $this->attachmentCard($m->attachment, class_basename($m->attachment_type)) : null,
            ])->values();
        }
        return $payload;
    }

    /**
     * The brand owner on the other side of the thread. Prefers the linked
     * opportunity's actual author over the ambiguous brand_id slug.
     */
    private function resolveOwner(Conversation $c): ?\App\Models\User
    {
        if ($c->opportunity_id) {
            $ownerId = Opportunity::where('id', $c->opportunity_id)->value('user_id');
            if ($ownerId) {
                $owner = \App\Models\User::select('id', 'username')->find($ownerId);
                if ($owner) {
                    return $owner;
                }
            }
        }
        $ownerId = Opportunity::where('brand_id', $c->brand_id)->value('user_id')
            ?? \App\Models\Story::where('brand_id', $c->brand_id)->value('user_id');
        return $ownerId ? \App\Models\User::select('id', 'username')->find($ownerId) : null;
    }
}
