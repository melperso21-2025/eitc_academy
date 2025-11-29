<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExchangeRate extends Model
{
    protected $fillable = [
        'from_currency',
        'to_currency',
        'rate',
        'expires_at',
    ];

    protected $casts = [
        'rate' => 'decimal:4',
        'expires_at' => 'datetime',
    ];

    public function isExpired()
    {
        return $this->expires_at < now();
    }
}
