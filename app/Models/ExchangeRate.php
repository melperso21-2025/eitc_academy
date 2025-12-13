<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Persiste tasas de cambio obtenidas de la API para reutilizar las conversiones.
 */
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
        // Permite invalidar entradas en caché usando la columna expires_at
        return $this->expires_at < now();
    }
}
