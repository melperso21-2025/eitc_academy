<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Auth\Middleware\Authenticate as Middleware;

class ApiAuthenticate extends Middleware
{
    /**
     * Handle an unauthenticated user.
     */
    protected function unauthenticated($request, array $guards)
    {
        // Para rutas API, retornar JSON en lugar de redirigir
        if ($request->is('api/*')) {
            abort(response()->json([
                'success' => false,
                'message' => 'No autorizado. Token inválido o ausente.',
            ], 401));
        }

        parent::unauthenticated($request, $guards);
    }
}
