<?php

namespace App\Events;

use App\Http\Resources\PollResource;
use App\Models\Poll;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PollClosed implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Poll $poll, public ?int $viewerId = null) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel("conversation.{$this->poll->conversation_id}")];
    }

    public function broadcastAs(): string
    {
        return 'poll.closed';
    }

    public function broadcastWith(): array
    {
        $this->poll->loadMissing('votes');
        return ['poll' => (new PollResource($this->poll))->withViewer($this->viewerId)->toArray(request())];
    }
}
