<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReportCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'label',
        'severity',
        'description',
        'active',
    ];

    protected $casts = [
        'severity' => 'integer',
        'active' => 'boolean',
    ];

    public function reports()
    {
        return $this->hasMany(Report::class, 'category_id');
    }
}
