<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'with_name',
        'avatar',
        'last_message',
        'unread',
        'brand_id',
        'opportunity_id',
    ];

    protected $casts = [
        'unread' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class)->orderBy('created_at', 'asc');
    }

    public function opportunity()
    {
        return $this->belongsTo(Opportunity::class);
    }

    public function polls()
    {
        return $this->hasMany(Poll::class);
    }

    public function getOwnerId(): ?int
    {
        if ($this->opportunity_id) {
            $oppOwner = Opportunity::where('id', $this->opportunity_id)->value('user_id');
            if ($oppOwner) {
                return (int) $oppOwner;
            }
        }

        foreach ($this->messages()->whereNotNull('attachment_id')->get(['attachment_type', 'attachment_id']) as $m) {
            if ($m->attachment_type === Opportunity::class) {
                $uid = Opportunity::where('id', $m->attachment_id)->value('user_id');
                if ($uid) return (int) $uid;
            }
            if ($m->attachment_type === Story::class) {
                $uid = Story::where('id', $m->attachment_id)->value('user_id');
                if ($uid) return (int) $uid;
            }
        }

        if ($this->with_name) {
            $owner = Opportunity::where('brand_name', $this->with_name)->value('user_id')
                ?? Story::where('brand_name', $this->with_name)->value('user_id');
            if ($owner) return (int) $owner;
        }

        if ($this->brand_id) {
            $owner = Opportunity::where('brand_id', $this->brand_id)->value('user_id')
                ?? Story::where('brand_id', $this->brand_id)->value('user_id');
            if ($owner) return (int) $owner;
        }

        return null;
    }

    public function isBuyer(?int $userId): bool
    {
        return $userId !== null && (int) $this->user_id === (int) $userId;
    }

    public function isSeller(?int $userId): bool
    {
        if (!$userId || $this->isBuyer($userId)) {
            return false;
        }

        $ownerId = $this->getOwnerId();
        if ($ownerId && (int) $ownerId === (int) $userId) {
            return true;
        }

        if ($this->brand_id) {
            $hasOpp = Opportunity::where('user_id', $userId)->where('brand_id', $this->brand_id)->exists();
            $hasStory = Story::where('user_id', $userId)->where('brand_id', $this->brand_id)->exists();
            if ($hasOpp || $hasStory) {
                return true;
            }
        }

        return false;
    }

    public function isParticipant(?int $userId): bool
    {
        return $this->isBuyer($userId) || $this->isSeller($userId);
    }

    public function getOtherParticipantId(?int $userId): ?int
    {
        if ((int) $this->user_id === (int) $userId) {
            return $this->getOwnerId();
        }
        return (int) $this->user_id;
    }
}
