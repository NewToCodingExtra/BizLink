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
        'username',
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

    protected static function booted(): void
    {
        static::creating(function (User $user) {
            if (empty($user->username)) {
                $user->username = static::makeUsername($user->name ?? '');
            }
        });

        // Never silently orphan posts/stories: deleting a user that still owns
        // content is blocked. Reassign or delete their posts first.
        static::deleting(function (User $user) {
            if ($user->opportunities()->exists() || Story::where('user_id', $user->id)->exists()) {
                throw new \RuntimeException(
                    "Cannot delete user {$user->id} ({$user->email}): they still own posts/stories. Reassign or delete them first."
                );
            }
        });
    }

    public static function makeUsername(string $name, ?int $ignoreId = null): string
    {
        $reserved = ['me', 'edit', 'login', 'register', 'feed', 'admin', 'api'];
        $base = \Illuminate\Support\Str::slug($name);
        if ($base === '') {
            $base = 'user';
        }
        $base = substr($base, 0, 40);
        if (in_array($base, $reserved, true)) {
            $base .= '-u';
        }
        $candidate = $base;
        $i = 2;
        while (static::where('username', $candidate)
            ->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))
            ->exists()) {
            $candidate = substr($base, 0, 45) . '-' . $i;
            $i++;
        }
        return $candidate;
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

    public function likedStories()
    {
        return $this->belongsToMany(Story::class, 'story_user_likes')->withTimestamps();
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
