<?php

use Illuminate\Support\Facades\Route;

// Ruta dummy para redirect a login (requerida por Laravel auth)
Route::get('/login', function () {
    return response(file_get_contents(public_path('index.html')), 200, [
        'Content-Type' => 'text/html; charset=utf-8'
    ]);
})->name('login');

Route::get('/', function () {
    return response(file_get_contents(public_path('index.html')), 200, [
        'Content-Type' => 'text/html; charset=utf-8'
    ]);
});

// Para cualquier otra ruta (SPA) que no sea API, devolver index.html
// Pero SOLO si no empieza con "api/" o ".well-known/" o "storage/"
Route::fallback(function () {
    return response(file_get_contents(public_path('index.html')), 200, [
        'Content-Type' => 'text/html; charset=utf-8'
    ]);
});
