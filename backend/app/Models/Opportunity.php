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
        'roi',
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
    ];

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
