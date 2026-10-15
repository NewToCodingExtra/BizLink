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

    public function resolveRouteBinding($value, $field = null)
    {
        return is_numeric($value)
            ? $this->where('id', $value)->first()
            : $this->where('slug', $value)->first();
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
            if (empty($story->slug)) {
                $base = \Illuminate\Support\Str::slug($story->brand_name ?: 'story');
                if (empty($base)) {
                    $base = 'story';
                }
                $slug = $base;
                $count = 1;
                while (static::where('slug', $slug)->where('id', '!=', $story->id ?? 0)->exists()) {
                    $slug = $base . '-' . $count++;
                }
                $story->slug = $slug;
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
