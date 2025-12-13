<?php

// ============================================
// SOLUCIÓN SSL PARA WINDOWS (Desarrollo)
// ============================================
if (strtolower(PHP_OS_FAMILY) === 'windows') {
    // Deshabilitar verificación SSL para cURL (desarrollo local)
    // Esto permite trabajar con Google Cloud Storage en Windows sin certificados
    if (!getenv('CURL_CA_BUNDLE')) {
        putenv('CURL_CA_BUNDLE=');
    }
    
    // Para OpenSSL también
    if (!getenv('OPENSSL_CONF')) {
        $certPath = __DIR__ . '/../storage/app/cacert.pem';
        if (file_exists($certPath)) {
            ini_set('curl.cainfo', $certPath);
            ini_set('openssl.cafile', $certPath);
        }
    }
}

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
(require_once __DIR__.'/../bootstrap/app.php')
    ->handleRequest(Request::capture());
