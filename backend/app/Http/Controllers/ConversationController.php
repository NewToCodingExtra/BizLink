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
            ->orWhereHas('opportunity', fn($q) => $q->where('user_id', $user->id))
            ->with('messages')
            ->latest()
            ->get();
            
        return response()->json(['data' => $convos->map(fn($c) => $this->serialize($c))]);
    }

    public function show(Request $request, Conversation $conversation)
    {
        $user = $request->user();
        if (!$conversation->isParticipant($user?->id)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $conversation->load(['messages.sender:id,name,avatar', 'messages.attachment', 'messages.poll.votes', 'messages.replyTo.sender:id,name', 'messages.reactions']);
        $conversation->update(['unread' => 0]);

        if ($user) {
            \Illuminate\Support\Facades\DB::table('conversation_reads')->updateOrInsert(
                ['conversation_id' => $conversation->id, 'user_id' => $user->id],
                ['read_at' => now(), 'updated_at' => now()]
            );
        }

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
        if (!$conversation->isParticipant($user?->id)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $otherId = $conversation->getOtherParticipantId($user->id);
        if ($otherId) {
            $isBlocked = \Illuminate\Support\Facades\DB::table('user_blocks')
                ->where(function ($q) use ($user, $otherId) {
                    $q->where('blocker_id', $otherId)->where('blocked_id', $user->id);
                })
                ->orWhere(function ($q) use ($user, $otherId) {
                    $q->where('blocker_id', $user->id)->where('blocked_id', $otherId);
                })
                ->exists();
            if ($isBlocked) {
                return response()->json(['message' => 'Cannot send messages in this conversation.'], 403);
            }
        }

        $data = $request->validate([
            'text' => 'nullable|string|max:2000',
            'media_url' => 'nullable|string|max:2048',
            'media_type' => 'nullable|in:image,video,file',
            'media_name' => 'nullable|string|max:255',
            'media_size' => 'nullable|integer|min:0',
            'reply_to_id' => 'nullable|integer|exists:messages,id',
            'attachment.type' => 'nullable|in:opportunity,story',
            'attachment.id' => 'nullable|integer',
        ]);

        $text = trim((string) ($data['text'] ?? ''));
        if ($text === '' && empty($data['media_url'])) {
            return response()->json(['message' => 'Write something or attach a file.'], 422);
        }

        $replyToId = null;
        if (!empty($data['reply_to_id'])) {
            $parentMsg = Message::where('conversation_id', $conversation->id)->find($data['reply_to_id']);
            if ($parentMsg) {
                $replyToId = $parentMsg->id;
            }
        }

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
            'reply_to_id' => $replyToId,
            'sender_id' => $request->user()->id,
            'from_side' => 'me',
            'text' => $text,
            'media_url' => $data['media_url'] ?? null,
            'media_type' => $data['media_type'] ?? null,
            'media_name' => $data['media_name'] ?? null,
            'media_size' => $data['media_size'] ?? null,
            'attachment_id' => $attachmentId,
            'attachment_type' => $attachmentType,
        ]);
        $preview = $text !== '' ? $text : ($data['media_type'] === 'file' ? 'Sent a file' : 'Sent media');
        $conversation->update(['last_message' => $preview]);
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

    public function insights(Request $request, Conversation $conversation)
    {
        $user = $request->user();
        if (!$conversation->isSeller($user?->id)) {
            return response()->json(['message' => 'Only the brand can share insights.'], 403);
        }

        $posts = Opportunity::where('user_id', $user->id)->get(['id', 'headline', 'likes_count', 'brand_id']);
        $brandIds = $posts->pluck('brand_id')->filter()->unique()->values()->all();
        $inquiries = empty($brandIds) ? 0 : Conversation::whereIn('brand_id', $brandIds)->count();
        $likes = (int) $posts->sum('likes_count');
        $top = $posts->sortByDesc('likes_count')->first();

        $snapshot = [
            'asOf' => now()->toIso8601String(),
            'postsCount' => $posts->count(),
            'inquiriesCount' => $inquiries,
            'likesTotal' => $likes,
            'topPost' => $top ? ['headline' => $top->headline, 'likes' => (int) $top->likes_count] : null,
        ];

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'from_side' => 'me',
            'text' => '',
            'insight' => $snapshot,
        ]);
        $conversation->update(['last_message' => 'Shared sales insights']);
        broadcast(new \App\Events\MessageSent($message));

        return response()->json(['data' => $this->serializeMessage($message)], 201);
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

    public function serializeForBroadcast(Message $message): array
    {
        return $this->serializeMessage($message);
    }

    private function serializeMessage(Message $message): array
    {
        $message->loadMissing(['attachment', 'poll.votes', 'replyTo.sender:id,name', 'reactions']);
        $viewerId = auth()->id() ?: request()->user()?->id;

        $reactions = $message->relationLoaded('reactions') ? $message->reactions : $message->reactions()->get();
        $reactionCounts = [];
        $myReactions = [];
        foreach ($reactions as $r) {
            $reactionCounts[$r->emoji] = ($reactionCounts[$r->emoji] ?? 0) + 1;
            if ($viewerId && (int) $r->user_id === (int) $viewerId) {
                $myReactions[] = $r->emoji;
            }
        }

        $replyTo = null;
        if ($message->reply_to_id) {
            $rep = $message->replyTo ?? Message::with('sender:id,name')->find($message->reply_to_id);
            if ($rep) {
                $replyTo = [
                    'id' => $rep->id,
                    'senderName' => $rep->sender?->name ?? 'User',
                    'text' => $rep->is_hidden ? '[Removed by moderation]' : $rep->text,
                    'mediaType' => $rep->media_type,
                ];
            }
        }

        return [
            'id' => $message->id,
            'conversationId' => $message->conversation_id,
            'senderId' => $message->sender_id,
            'from' => (int) $message->sender_id === (int) $viewerId ? 'me' : 'them',
            'text' => $message->is_hidden ? '[Removed by moderation]' : $message->text,
            'time' => $message->created_at?->diffForHumans(),
            'rawTime' => $message->created_at?->toIso8601String(),
            'editedAt' => $message->edited_at?->diffForHumans(),
            'isEdited' => (bool) $message->edited_at,
            'reactions' => $reactionCounts,
            'myReactions' => $myReactions,
            'replyTo' => $replyTo,
            'mediaUrl' => $message->media_url,
            'mediaType' => $message->media_type,
            'mediaName' => $message->media_name,
            'mediaSize' => $message->media_size,
            'insight' => $message->insight,
            'poll' => $message->poll ? $this->pollPayload($message->poll, $viewerId) : null,
            'meetStatus' => $message->meet_status,
            'meetEventId' => $message->meet_event_id,
            'meetUrl' => $message->meet_url,
            'meetStartAt' => $message->meet_start_at?->toIso8601String(),
            'meetEndAt' => $message->meet_end_at?->toIso8601String(),
            'meetTitle' => $message->meet_title,
            'attachment' => $message->attachment
                ? $this->attachmentCard($message->attachment, class_basename($message->attachment_type))
                : null,
        ];
    }

    private function pollPayload(\App\Models\Poll $poll, ?int $viewerId): array
    {
        return app(\App\Services\PollService::class)->payload($poll, $viewerId);
    }

    private function serialize(Conversation $c, bool $withMessages = false): array
    {
        $viewerId = (int) (auth()->id() ?: request()->user()?->id);
        $isBuyer = (int) $c->user_id === $viewerId;
        
        $owner = $this->resolveOwner($c);
        $buyer = \App\Models\User::find($c->user_id);
        
        $otherUserId = $c->getOtherParticipantId($viewerId);
        $peerReadAt = $otherUserId ? $c->lastReadBy($otherUserId) : null;
        $isMuted = $viewerId ? $c->isMutedBy($viewerId) : false;

        $isBlocked = false;
        if ($viewerId && $otherUserId) {
            $isBlocked = \Illuminate\Support\Facades\DB::table('user_blocks')
                ->where(function ($q) use ($viewerId, $otherUserId) {
                    $q->where('blocker_id', $viewerId)->where('blocked_id', $otherUserId);
                })
                ->orWhere(function ($q) use ($viewerId, $otherUserId) {
                    $q->where('blocker_id', $otherUserId)->where('blocked_id', $viewerId);
                })
                ->exists();
        }

        $payload = [
            'id' => $c->id,
            'with' => $isBuyer ? $c->with_name : ($buyer?->name ?? 'User'),
            'withId' => $isBuyer ? $owner?->id : $buyer?->id,
            'withUsername' => $isBuyer ? $owner?->username : $buyer?->username,
            'avatar' => $isBuyer ? $c->avatar : $buyer?->avatar,
            'lastMessage' => $c->last_message,
            'unread' => (int) $c->unread,
            'brandId' => $c->brand_id,
            'isSeller' => !$isBuyer,
            'isMuted' => $isMuted,
            'peerReadAt' => $peerReadAt,
            'isBlocked' => $isBlocked,
        ];
        if ($withMessages || $c->relationLoaded('messages')) {
            $c->loadMissing('messages.attachment');
            $c->loadMissing('messages.poll.votes');
            $c->loadMissing('messages.replyTo.sender:id,name');
            $payload['messages'] = $c->messages->map(fn($m) => $this->serializeMessage($m))->values();
            $payload['isSeller'] = !((int) $c->user_id === $viewerId);
        }
        return $payload;
    }

    /**
     * Search messages inside this conversation.
     */
    public function searchMessages(Request $request, Conversation $conversation)
    {
        $user = $request->user();
        if (!$conversation->isParticipant($user?->id)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $q = trim((string) $request->query('q', ''));
        if (strlen($q) < 2) {
            return response()->json(['data' => []]);
        }

        $results = Message::where('conversation_id', $conversation->id)
            ->where('is_hidden', false)
            ->where('text', 'like', "%{$q}%")
            ->with('sender:id,name')
            ->latest()
            ->limit(30)
            ->get();

        return response()->json([
            'data' => $results->map(function ($m) {
                return [
                    'id' => $m->id,
                    'text' => $m->text,
                    'senderName' => $m->sender?->name ?? 'User',
                    'time' => $m->created_at?->diffForHumans(),
                    'rawTime' => $m->created_at?->toIso8601String(),
                ];
            }),
        ]);
    }

    /**
     * Media, files, and links browser for this conversation.
     */
    public function media(Request $request, Conversation $conversation)
    {
        $user = $request->user();
        if (!$conversation->isParticipant($user?->id)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $type = $request->query('type', 'all'); // photo, video, file, link, all

        $query = Message::where('conversation_id', $conversation->id)->where('is_hidden', false);

        if ($type === 'photo') {
            $query->where('media_type', 'image');
        } elseif ($type === 'video') {
            $query->where('media_type', 'video');
        } elseif ($type === 'file') {
            $query->where('media_type', 'file');
        } elseif ($type === 'link') {
            $query->where(function ($q) {
                $q->where('text', 'like', '%http://%')
                  ->orWhere('text', 'like', '%https://%');
            });
        } else {
            // Default: any media, file or link
            $query->where(function ($q) {
                $q->whereNotNull('media_url')
                  ->orWhere('text', 'like', '%http://%')
                  ->orWhere('text', 'like', '%https://%');
            });
        }

        $messages = $query->latest()->limit(50)->get();
        $previewService = app(\App\Services\LinkPreviewService::class);

        $items = [];
        foreach ($messages as $m) {
            $base = [
                'id' => $m->id,
                'mediaUrl' => $m->media_url,
                'mediaType' => $m->media_type,
                'mediaName' => $m->media_name,
                'mediaSize' => $m->media_size,
                'time' => $m->created_at?->diffForHumans(),
                'rawTime' => $m->created_at?->toIso8601String(),
            ];

            if ($m->media_url && ($type === 'all' || $type === 'photo' || $type === 'video' || $type === 'file')) {
                if ($type === 'all' || ($type === 'photo' && $m->media_type === 'image') || ($type === 'video' && $m->media_type === 'video') || ($type === 'file' && $m->media_type === 'file')) {
                    $items[] = $base;
                }
            }

            if (($type === 'all' || $type === 'link') && preg_match_all('/https?:\/\/[^\s]+/i', $m->text ?? '', $matches)) {
                foreach (array_slice($matches[0], 0, 3) as $url) {
                    $cleanUrl = rtrim($url, '.,!?;:');
                    $preview = $previewService->getPreview($cleanUrl);
                    $items[] = [
                        'id' => $m->id,
                        'mediaType' => 'link',
                        'url' => $cleanUrl,
                        'title' => $preview['title'] ?? parse_url($cleanUrl, PHP_URL_HOST),
                        'description' => $preview['description'] ?? null,
                        'image' => $preview['image'] ?? null,
                        'siteName' => $preview['siteName'] ?? parse_url($cleanUrl, PHP_URL_HOST),
                        'time' => $m->created_at?->diffForHumans(),
                        'rawTime' => $m->created_at?->toIso8601String(),
                    ];
                }
            }
        }

        return response()->json(['data' => $items]);
    }

    /**
     * Toggle mute on a conversation.
     */
    public function toggleMute(Request $request, Conversation $conversation)
    {
        $user = $request->user();
        if (!$conversation->isParticipant($user?->id)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $existing = \Illuminate\Support\Facades\DB::table('conversation_mutes')
            ->where('conversation_id', $conversation->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existing) {
            \Illuminate\Support\Facades\DB::table('conversation_mutes')
                ->where('conversation_id', $conversation->id)
                ->where('user_id', $user->id)
                ->delete();
            $muted = false;
        } else {
            \Illuminate\Support\Facades\DB::table('conversation_mutes')->insert([
                'conversation_id' => $conversation->id,
                'user_id' => $user->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $muted = true;
        }

        return response()->json(['muted' => $muted]);
    }

    /**
     * Explicit read receipt ping.
     */
    public function markRead(Request $request, Conversation $conversation)
    {
        $user = $request->user();
        if (!$conversation->isParticipant($user?->id)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        \Illuminate\Support\Facades\DB::table('conversation_reads')->updateOrInsert(
            ['conversation_id' => $conversation->id, 'user_id' => $user->id],
            ['read_at' => now(), 'updated_at' => now()]
        );

        $conversation->update(['unread' => 0]);

        return response()->json(['readAt' => now()->toIso8601String()]);
    }

    /**
     * Block the user on the other side of this conversation.
     */
    public function blockUser(Request $request, Conversation $conversation)
    {
        $user = $request->user();
        if (!$conversation->isParticipant($user?->id)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $otherId = $conversation->getOtherParticipantId($user->id);
        if (!$otherId) {
            return response()->json(['message' => 'Cannot resolve user to block.'], 422);
        }

        \Illuminate\Support\Facades\DB::table('user_blocks')->updateOrInsert(
            ['blocker_id' => $user->id, 'blocked_id' => $otherId],
            ['created_at' => now(), 'updated_at' => now()]
        );

        return response()->json(['blocked' => true, 'message' => 'User blocked successfully.']);
    }

    /**
     * Extract rich link preview metadata.
     */
    public function linkPreview(Request $request)
    {
        $url = $request->input('url');
        if (!$url || !is_string($url) || strlen($url) > 2048) {
            return response()->json(['data' => null]);
        }
        $preview = app(\App\Services\LinkPreviewService::class)->getPreview(trim($url));
        return response()->json(['data' => $preview]);
    }

    public function updateMessage(Request $request, Conversation $conversation, Message $message)
    {
        $user = $request->user();
        if ((int) $message->sender_id !== (int) $user->id || (int) $message->conversation_id !== (int) $conversation->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'text' => 'required|string|max:2000',
        ]);

        $message->update([
            'text' => $validated['text'],
            'edited_at' => now(),
        ]);

        broadcast(new \App\Events\MessageSent($message));

        return response()->json(['data' => $this->serializeMessage($message)]);
    }

    public function destroyMessage(Request $request, Conversation $conversation, Message $message)
    {
        $user = $request->user();
        if ((int) $message->sender_id !== (int) $user->id || (int) $message->conversation_id !== (int) $conversation->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $messageId = $message->id;
        $message->delete();

        broadcast(new \App\Events\MessageDeleted($conversation->id, $messageId));

        return response()->json(['success' => true]);
    }

    public function bumpMessage(Request $request, Conversation $conversation, Message $message)
    {
        $user = $request->user();
        if (!$conversation->isParticipant($user?->id) || (int) $message->conversation_id !== (int) $conversation->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $bumped = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'from_side' => 'me',
            'text' => $message->text,
            'media_url' => $message->media_url,
            'media_type' => $message->media_type,
            'media_name' => $message->media_name,
            'media_size' => $message->media_size,
            'attachment_id' => $message->attachment_id,
            'attachment_type' => $message->attachment_type,
        ]);

        $preview = $bumped->text ?: 'Bumped message';
        $conversation->update(['last_message' => $preview]);
        broadcast(new \App\Events\MessageSent($bumped));

        return response()->json(['data' => $this->serializeMessage($bumped)], 201);
    }

    public function reactMessage(Request $request, Conversation $conversation, Message $message)
    {
        $user = $request->user();
        if (!$conversation->isParticipant($user?->id) || (int) $message->conversation_id !== (int) $conversation->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'emoji' => 'required|string|max:16',
        ]);

        $emoji = $validated['emoji'];
        $existing = \App\Models\MessageReaction::where('message_id', $message->id)
            ->where('user_id', $user->id)
            ->where('emoji', $emoji)
            ->first();

        if ($existing) {
            $existing->delete();
        } else {
            \App\Models\MessageReaction::create([
                'message_id' => $message->id,
                'user_id' => $user->id,
                'emoji' => $emoji,
            ]);
        }

        $message->load('reactions');
        broadcast(new \App\Events\MessageSent($message));

        return response()->json(['data' => $this->serializeMessage($message)]);
    }

    /**
     * The brand owner on the other side of the thread. Prefers the linked
     * opportunity's actual author over the ambiguous brand_id slug.
     */
    private function resolveOwner(Conversation $c): ?\App\Models\User
    {
        $ownerId = $c->getOwnerId();
        return $ownerId ? \App\Models\User::select('id', 'username')->find($ownerId) : null;
    }
}

