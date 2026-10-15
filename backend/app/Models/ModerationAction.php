<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ModerationAction extends Model
{
    use HasFactory;

    public const ACTIONS = ['dismiss', 'remove_content', 'warn', 'restrict', 'suspend', 'ban'];

    protected $fillable = [
        'report_id',
        'admin_id',
        'action',
        'reason',
        'duration_days',
        'removed_content',
    ];

    protected $casts = [
        'duration_days' => 'integer',
        'removed_content' => 'boolean',
    ];

    public function report()
    {
        return $this->belongsTo(Report::class, 'report_id');
    }

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
