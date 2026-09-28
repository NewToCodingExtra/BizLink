<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'sender_id',
        'from_side',
        'text',
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
        'meet_start_at' => 'datetime',
        'meet_end_at' => 'datetime',
    ];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
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
}
