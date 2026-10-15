<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    use HasFactory;

    public const TYPES = [
        'opportunity_feed',
        'opportunity_reel',
        'comment',
        'story',
        'message',
        'conversation',
        'user',
    ];

    public const STATUSES = ['pending', 'accepted', 'rejected'];

    protected $fillable = [
        'reporter_id',
        'reportable_type',
        'reportable_id',
        'category_id',
        'details',
        'status',
        'priority_score',
        'admin_id',
        'admin_note',
        'action_taken',
        'resolved_at',
    ];

    protected $casts = [
        'priority_score' => 'integer',
        'resolved_at' => 'datetime',
    ];

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function category()
    {
        return $this->belongsTo(ReportCategory::class, 'category_id');
    }

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function actions()
    {
        return $this->hasMany(ModerationAction::class, 'report_id');
    }

    public function scopePending($q)
    {
        return $q->where('status', 'pending');
    }
}
