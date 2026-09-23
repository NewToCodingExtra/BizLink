<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Story extends Model
{
    use HasFactory, \Laravel\Scout\Searchable;

    public function getRouteKeyName()
    {
        return 'slug';
    }

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

    protected static function booted(): void
    {
        static::saving(function (Story $story) {
            if (empty($story->user_id) || ! User::whereKey($story->user_id)->exists()) {
                throw new \RuntimeException('Story requires a valid user_id owner.');
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function likes()
    {
        return $this->belongsToMany(User::class, 'story_user_likes')->withTimestamps();
    }
}
