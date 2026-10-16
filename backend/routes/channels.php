<?php

use App\Models\Conversation;
use App\Models\Opportunity;
use App\Models\Story;
use Illuminate\Support\Facades\Broadcast;

// Thread channel: buyer or the brand owner on the other side.
Broadcast::channel('conversation.{id}', function ($user, $id) {
    $conversation = Conversation::find($id);
    if (!$conversation || !$user) {
        return false;
    }
    return $conversation->isParticipant((int) $user->id);
});

// Personal channel: self only (notification + badge fan-out).
Broadcast::channel('user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});
