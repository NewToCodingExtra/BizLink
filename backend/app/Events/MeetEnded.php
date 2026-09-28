<?php

namespace App\Events;

use App\Http\Controllers\ConversationController;
use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MeetEnded implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Message $message,
        public string $status = 'ended'
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel("conversation.{$this->message->conversation_id}")];
    }

    public function broadcastAs(): string
    {
        return 'meet.ended';
    }

    public function broadcastWith(): array
    {
        return [
            'eventId' => $this->message->meet_event_id,
            'status' => $this->status,
            'messageId' => $this->message->id,
            'message' => app(ConversationController::class)->serializeForBroadcast($this->message),
        ];
    }
}
