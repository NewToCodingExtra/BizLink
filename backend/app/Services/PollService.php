<?php

namespace App\Services;

use App\Events\MessageSent;
use App\Events\PollClosed;
use App\Events\PollUpdated;
use App\Http\Resources\PollResource;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Poll;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class PollService
{
    public function __construct(private NotificationService $notifications) {}

    public function create(User $user, Conversation $conversation, array $data): Poll
    {
        $options = array_values(array_filter(array_map(
            fn ($o) => trim((string) $o),
            $data['options'] ?? []
        ), fn ($o) => $o !== ''));

        abort_if(count($options) < 2 || count($options) > 5, 422, 'Polls need 2–5 options.');

        Poll::where('conversation_id', $conversation->id)
            ->where('closed', false)
            ->whereNotNull('closes_at')
            ->where('closes_at', '<=', now())
            ->update(['closed' => true]);

        abort_if(
            Poll::where('conversation_id', $conversation->id)->where('closed', false)->exists(),
            422,
            'This conversation already has an open poll. Close it first.'
        );

        return DB::transaction(function () use ($user, $conversation, $data, $options) {
            $poll = Poll::create([
                'conversation_id' => $conversation->id,
                'user_id' => $user->id,
                'question' => trim($data['question']),
                'options' => $options,
                'closes_at' => $data['closes_at'] ?? null,
                'closed' => false,
            ]);

            $message = Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $user->id,
                'from_side' => 'me',
                'text' => '',
                'poll_id' => $poll->id,
            ]);

            $conversation->update(['last_message' => 'Poll: '.$poll->question]);
            $poll->load('votes');
            broadcast(new MessageSent($message));
            broadcast(new PollUpdated($poll, $user->id));

            return $poll;
        });
    }

    public function vote(User $user, Poll $poll, int $option): Poll
    {
        $this->autoCloseIfExpired($poll);
        abort_if($poll->isClosed(), 422, 'This poll is closed.');

        $options = array_values($poll->options ?? []);
        abort_if($option < 0 || $option >= count($options), 422, 'That option does not exist.');

        $poll->votes()->updateOrCreate(
            ['user_id' => $user->id],
            ['option_index' => $option]
        );

        $poll->load('votes');
        broadcast(new PollUpdated($poll, $user->id));

        return $poll;
    }

    public function close(User $user, Poll $poll): Poll
    {
        $this->autoCloseIfExpired($poll);
        abort_if((int) $poll->user_id !== (int) $user->id, 403, 'Only the poll creator can close it.');
        abort_if($poll->closed, 422, 'This poll is already closed.');

        $poll->update(['closed' => true]);
        $poll->load('votes');

        $note = Message::create([
            'conversation_id' => $poll->conversation_id,
            'sender_id' => $user->id,
            'from_side' => 'me',
            'text' => 'Poll closed.',
            'poll_id' => $poll->id,
        ]);

        $poll->conversation?->update(['last_message' => 'Poll closed.']);
        broadcast(new MessageSent($note));
        broadcast(new PollClosed($poll, $user->id));

        $otherId = $this->otherParticipantId($poll, $user->id);
        if ($otherId) {
            $this->notifications->push(
                $otherId,
                'poll_closed',
                "{$user->name} closed a poll",
                $this->threadLink($poll)
            );
        }

        return $poll;
    }

    public function autoCloseIfExpired(Poll $poll): void
    {
        if (!$poll->closed && $poll->isExpired()) {
            $poll->update(['closed' => true]);
        }
    }

    public function payload(Poll $poll, ?int $viewerId): array
    {
        $this->autoCloseIfExpired($poll);
        $poll->loadMissing('votes');
        return (new PollResource($poll))->withViewer($viewerId)->toArray(request());
    }

    private function otherParticipantId(Poll $poll, int $actorId): ?int
    {
        $c = $poll->conversation ?? Conversation::find($poll->conversation_id);
        if (!$c) {
            return null;
        }
        if ((int) $c->user_id === $actorId) {
            $ownerId = \App\Models\Opportunity::where('brand_id', $c->brand_id)->value('user_id')
                ?? \App\Models\Story::where('brand_id', $c->brand_id)->value('user_id');
            return $ownerId && (int) $ownerId !== $actorId ? (int) $ownerId : null;
        }
        return (int) $c->user_id !== $actorId ? (int) $c->user_id : null;
    }

    private function threadLink(Poll $poll): string
    {
        $c = $poll->conversation ?? Conversation::find($poll->conversation_id);
        if (!$c) {
            return '/messages';
        }
        $owner = \App\Models\User::find(
            \App\Models\Opportunity::where('brand_id', $c->brand_id)->value('user_id')
            ?? \App\Models\Story::where('brand_id', $c->brand_id)->value('user_id')
        );
        $buyer = \App\Models\User::find($c->user_id);
        $identifier = $owner?->username ?: ($buyer?->username ?: $c->brand_id);

        return '/messages/'.$identifier;
    }
}
