<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    use HasFactory, \Illuminate\Database\Eloquent\SoftDeletes;

    protected $fillable = [
        'opportunity_id',
        'parent_id',
        'user_id',
        'author',
        'avatar',
        'text',
        'media_url',
        'media_type',
        'is_seller_reply',
        'edited_at',
    ];

    protected $casts = [
        'is_seller_reply' => 'boolean',
        'edited_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        // New comments must belong to a real post + (post-restore) a real user.
        // Legacy snapshot rows with NULL user_id predate this guard and are
        // rendered read-only by the frontend; never NULL-out an existing owner.
        static::saving(function (Comment $comment) {
            if (empty($comment->opportunity_id) || ! Opportunity::whereKey($comment->opportunity_id)->exists()) {
                throw new \RuntimeException('Comment requires a valid opportunity_id.');
            }
            if (empty($comment->user_id) || ! User::whereKey($comment->user_id)->exists()) {
                throw new \RuntimeException('Comment requires a valid user_id.');
            }
        });
    }

    public function opportunity()
    {
        return $this->belongsTo(Opportunity::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parent()
    {
        return $this->belongsTo(Comment::class, 'parent_id');
    }

    public function replies()
    {
        return $this->hasMany(Comment::class, 'parent_id')->oldest();
    }

    public function reactions()
    {
        return $this->hasMany(CommentReaction::class);
    }

    public function reports()
    {
        return $this->hasMany(CommentReport::class);
    }
}
