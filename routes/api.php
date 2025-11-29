<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ExchangeRateController;

// Rutas públicas (sin autenticación)
Route::prefix('api')->group(function () {
    // Exchange Rates - Rutas públicas
    Route::get('/exchange-rates', [ExchangeRateController::class, 'index']);
    Route::get('/exchange-rates/{currency}', [ExchangeRateController::class, 'show']);
    Route::get('/exchange-rates/convert', [ExchangeRateController::class, 'convert']);
});

// Rutas que requieren autenticación (se agregarán después con Sanctum)
Route::middleware('auth:sanctum')->prefix('api')->group(function () {
    Route::post('/exchange-rates/refresh', [ExchangeRateController::class, 'refresh']);
});
