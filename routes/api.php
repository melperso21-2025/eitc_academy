<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ExchangeRateController;

// Rutas públicas (sin autenticación)
Route::prefix('api')->group(function () {
    // Autenticación
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    // Exchange Rates
    Route::get('/exchange-rates', [ExchangeRateController::class, 'index']);
    Route::get('/exchange-rates/{currency}', [ExchangeRateController::class, 'show']);
    Route::get('/exchange-rates/convert', [ExchangeRateController::class, 'convert']);
});

// Rutas que requieren autenticación (Sanctum)
Route::middleware('auth:sanctum')->prefix('api')->group(function () {
    // Autenticación autenticada
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Exchange Rates (admin)
    Route::post('/exchange-rates/refresh', [ExchangeRateController::class, 'refresh']);
});
