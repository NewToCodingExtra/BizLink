<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Preference extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'categories',
        'budget_min',
        'budget_max',
    ];

    protected $casts = [
        'categories' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
