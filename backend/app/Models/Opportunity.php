<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Opportunity extends Model
{
    use HasFactory, \Laravel\Scout\Searchable;

    protected $fillable = [
        'slug',
        'user_id',
        'brand_name',
        'brand_avatar',
        'brand_id',
        'type',
        'category',
        'headline',
        'capital_required',
        'capital_amount',
        'roi',
        'roi_percent',
        'description',
        'image',
        'media_type',
        'video_url',
        'featured',
        'verified',
        'likes_count',
        'saves_count',
        'is_new',
    ];

    public function toSearchableArray()
    {
        return [
            'id' => $this->id,
            'brand_name' => $this->brand_name,
            'headline' => $this->headline,
            'description' => $this->description,
            'category' => $this->category,
        ];
    }

    protected $casts = [
        'featured' => 'boolean',
        'verified' => 'boolean',
        'is_new' => 'boolean',
        'likes_count' => 'integer',
        'saves_count' => 'integer',
        'capital_amount' => 'integer',
        'roi_percent' => 'float',
    ];

    protected static function booted(): void
    {
        // Posts must always have a real owner — the column is NOT NULL +
        // RESTRICT at the DB level, this is the app-level second net.
        static::saving(function (Opportunity $opp) {
            if (empty($opp->user_id) || ! User::whereKey($opp->user_id)->exists()) {
                throw new \RuntimeException('Opportunity requires a valid user_id owner.');
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class)->latest();
    }

    public function likedBy()
    {
        return $this->belongsToMany(User::class, 'opportunity_user_likes')->withTimestamps();
    }

    public function savedBy()
    {
        return $this->belongsToMany(User::class, 'opportunity_user_saves')->withTimestamps();
    }
}
