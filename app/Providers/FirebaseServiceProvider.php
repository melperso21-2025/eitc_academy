<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\FirebaseStorageService;

class FirebaseServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Registrar FirebaseStorageService como singleton en el contenedor de servicios
        // Esto permite inyectarlo en cualquier controlador o clase
        $this->app->singleton(FirebaseStorageService::class, function ($app) {
            return new FirebaseStorageService();
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
