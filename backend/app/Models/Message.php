<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Message extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'conversation_id',
        'reply_to_id',
        'sender_id',
        'from_side',
        'text',
        'edited_at',
        'media_url',
        'media_type',
        'media_name',
        'media_size',
        'attachment_id',
        'attachment_type',
        'poll_id',
        'insight',
        'meet_status',
        'meet_event_id',
        'meet_url',
        'meet_start_at',
        'meet_end_at',
        'meet_title',
    ];

    protected $casts = [
        'insight' => 'array',
        'media_size' => 'integer',
        'edited_at' => 'datetime',
        'meet_start_at' => 'datetime',
        'meet_end_at' => 'datetime',
    ];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function replyTo()
    {
        return $this->belongsTo(Message::class, 'reply_to_id');
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function attachment()
    {
        return $this->morphTo();
    }

    public function poll()
    {
        return $this->belongsTo(Poll::class);
    }

    public function reactions()
    {
        return $this->hasMany(MessageReaction::class);
    }
}

