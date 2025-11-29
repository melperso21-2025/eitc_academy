<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ExchangeRateController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\CategoryController;

// Rutas públicas (sin autenticación)
Route::prefix('api')->group(function () {
    // Autenticación
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    // Cursos (solo lectura pública)
    Route::get('/courses', [CourseController::class, 'index']);
    Route::get('/courses/{course}', [CourseController::class, 'show']);

    // Categorías
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{category}', [CategoryController::class, 'show']);

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

    // Cursos (CRUD - solo admin puede crear/editar/eliminar)
    Route::post('/courses', [CourseController::class, 'store']);
    Route::put('/courses/{course}', [CourseController::class, 'update']);
    Route::delete('/courses/{course}', [CourseController::class, 'destroy']);

    // Categorías (solo admin)
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{category}', [CategoryController::class, 'update']);
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

    // Exchange Rates (admin)
    Route::post('/exchange-rates/refresh', [ExchangeRateController::class, 'refresh']);
});
