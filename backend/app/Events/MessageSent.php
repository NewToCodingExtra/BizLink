<?php

namespace App\Events;

use App\Http\Controllers\ConversationController;
use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Message $message) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel("conversation.{$this->message->conversation_id}")];
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    public function broadcastWith(): array
    {
        $this->message->loadMissing('attachment');
        $payload = [
            'id' => $this->message->id,
            'conversationId' => $this->message->conversation_id,
            'senderId' => $this->message->sender_id,
            'text' => $this->message->text,
            'time' => $this->message->created_at?->diffForHumans(),
            'attachment' => null,
        ];
        if ($this->message->attachment) {
            $payload['attachment'] = app(ConversationController::class)
                ->attachmentCard($this->message->attachment, class_basename($this->message->attachment_type));
        }
        return ['message' => $payload];
    }
}
