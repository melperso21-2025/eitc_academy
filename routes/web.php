<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response(file_get_contents(public_path('index.html')), 200, [
        'Content-Type' => 'text/html; charset=utf-8'
    ]);
});

Route::fallback(function () {
    return response(file_get_contents(public_path('index.html')), 200, [
        'Content-Type' => 'text/html; charset=utf-8'
    ]);
});
