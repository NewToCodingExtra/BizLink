<?php

namespace App\Events;

use App\Models\Message;

class MessageCreated extends MessageSent
{
    public function broadcastAs(): string
    {
        return 'message.created';
    }
}
