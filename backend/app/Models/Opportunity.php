<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Opportunity extends Model
{
    use HasFactory;

    protected $fillable = [
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
