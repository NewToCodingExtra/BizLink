<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Story extends Model
{
    use HasFactory, \Laravel\Scout\Searchable;

    protected $fillable = [
        'slug',
        'user_id',
        'brand_id',
        'brand_name',
        'avatar',
        'media_url',
        'caption',
        'expires_at',
        'seen',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'seen' => 'boolean',
    ];

    public function likes()
    {
        return $this->belongsToMany(User::class, 'story_user_likes')->withTimestamps();
    }
}
