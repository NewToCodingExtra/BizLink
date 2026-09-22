<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'with_name',
        'avatar',
        'last_message',
        'unread',
        'brand_id',
        'opportunity_id',
    ];

    protected $casts = [
        'unread' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class)->orderBy('created_at', 'asc');
    }

    public function opportunity()
    {
        return $this->belongsTo(Opportunity::class);
    }
}
