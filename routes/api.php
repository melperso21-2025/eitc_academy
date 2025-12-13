<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ExchangeRateController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\EnrollmentController;
use App\Http\Controllers\Api\ImageUploadController;
use App\Http\Controllers\Api\CompanyAssetController;

// Rutas públicas (sin autenticación)

// Autenticación
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Cursos (solo lectura pública)
Route::get('/courses', [CourseController::class, 'index']);
Route::get('/courses/{course}', [CourseController::class, 'show']);

// Categorías
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{category}', [CategoryController::class, 'show']);

// Comentarios (solo lectura)
Route::get('/comments/{courseId}', [CommentController::class, 'index']);

// Exchange Rates
Route::get('/exchange-rates', [ExchangeRateController::class, 'index']);
Route::get('/exchange-rates/{currency}', [ExchangeRateController::class, 'show']);
Route::get('/exchange-rates/convert', [ExchangeRateController::class, 'convert']);

// Upload genérico (público)
Route::post('/upload-image', [ImageUploadController::class, 'uploadImage']);

// Activos corporativos (público, solo lectura)
Route::get('/company-assets', [CompanyAssetController::class, 'index']);

// Rutas que requieren autenticación (Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    // Autenticación autenticada
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Cursos (CRUD - solo admin puede crear/editar/eliminar)
    Route::post('/courses', [CourseController::class, 'store']);
    Route::put('/courses/{course}', [CourseController::class, 'update']);
    Route::delete('/courses/{course}', [CourseController::class, 'destroy']);
    Route::post('/courses/{course}/upload-image', [ImageUploadController::class, 'uploadCourseImage']);

    // Categorías (solo admin)
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{category}', [CategoryController::class, 'update']);
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

    // Favoritos
    Route::get('/favorites', [FavoriteController::class, 'index']);
    Route::post('/favorites', [FavoriteController::class, 'store']); // Toggle
    Route::delete('/favorites/{courseId}', [FavoriteController::class, 'destroy']);

    // Comentarios
    Route::post('/comments', [CommentController::class, 'store']);
    Route::put('/comments/{comment}', [CommentController::class, 'update']);
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy']);

    // Enrollments (Inscripciones)
    Route::get('/enrollments', [EnrollmentController::class, 'index']);
    Route::post('/enrollments', [EnrollmentController::class, 'store']);
    Route::get('/enrollments/{courseId}', [EnrollmentController::class, 'show']);
    Route::delete('/enrollments/{courseId}', [EnrollmentController::class, 'destroy']);

    // Exchange Rates (admin)
    Route::post('/exchange-rates/refresh', [ExchangeRateController::class, 'refresh']);

    // Activos corporativos (solo admin)
    Route::post('/company-assets', [CompanyAssetController::class, 'store']);
    Route::put('/company-assets/{companyAsset}', [CompanyAssetController::class, 'update']);
    Route::delete('/company-assets/{companyAsset}', [CompanyAssetController::class, 'destroy']);
});
