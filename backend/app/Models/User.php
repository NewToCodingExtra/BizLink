<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id',
        'facebook_id',
        'avatar',
        'bio',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function opportunities()
    {
        return $this->hasMany(Opportunity::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function likedOpportunities()
    {
        return $this->belongsToMany(Opportunity::class, 'opportunity_user_likes')->withTimestamps();
    }

    public function savedOpportunities()
    {
        return $this->belongsToMany(Opportunity::class, 'opportunity_user_saves')->withTimestamps();
    }

    public function conversations()
    {
        return $this->hasMany(Conversation::class);
    }

    public function notifications()
    {
        return $this->hasMany(AppNotification::class)->latest();
    }

    public function preference()
    {
        return $this->hasOne(Preference::class);
    }
}
