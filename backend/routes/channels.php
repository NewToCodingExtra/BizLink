<?php

use App\Models\Conversation;
use App\Models\Opportunity;
use App\Models\Story;
use Illuminate\Support\Facades\Broadcast;

// Thread channel: buyer or the brand owner on the other side.
Broadcast::channel('conversation.{id}', function ($user, $id) {
    $conversation = Conversation::find($id);
    if (!$conversation) {
        return false;
    }
    if ((int) $conversation->user_id === (int) $user->id) {
        return true;
    }
    $ownerId = Opportunity::where('brand_id', $conversation->brand_id)->value('user_id')
        ?? Story::where('brand_id', $conversation->brand_id)->value('user_id');
    return $ownerId && (int) $ownerId === (int) $user->id;
});

// Personal channel: self only (notification + badge fan-out).
Broadcast::channel('user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});
