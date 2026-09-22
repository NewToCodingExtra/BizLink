<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    use HasFactory;

    protected $fillable = [
        'opportunity_id',
        'user_id',
        'author',
        'avatar',
        'text',
        'is_seller_reply',
    ];

    protected $casts = [
        'is_seller_reply' => 'boolean',
    ];

    public function opportunity()
    {
        return $this->belongsTo(Opportunity::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
