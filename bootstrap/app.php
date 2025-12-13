<?php

// Solucionar problemas de SSL en Windows para desarrollo
if (env('APP_ENV') === 'local' && strtolower(PHP_OS_FAMILY) === 'windows') {
    // Desactivar verificación SSL para desarrollo (necesario para Firebase en Windows)
    ini_set('curl.cainfo', '');
    ini_set('openssl.cafile', '');
}

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Sin middleware especial - Laravel 11 maneja automáticamente
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Manejar excepciones de autenticación
        $exceptions->renderable(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No autorizado',
                ], 401);
            }
        });
    })->create();
