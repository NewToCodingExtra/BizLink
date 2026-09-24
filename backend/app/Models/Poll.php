<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Poll extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'user_id',
        'question',
        'options',
        'closes_at',
        'closed',
    ];

    protected $casts = [
        'options' => 'array',
        'closed' => 'boolean',
        'closes_at' => 'datetime',
    ];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function votes()
    {
        return $this->hasMany(PollVote::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function isExpired(): bool
    {
        return $this->closes_at !== null && $this->closes_at->isPast();
    }

    public function isClosed(): bool
    {
        return (bool) $this->closed || $this->isExpired();
    }
}
