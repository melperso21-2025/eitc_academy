<?php
// Router personalizado para desarrollo local
// Reemplazar a index.php para que funcione correctamente

if (php_sapi_name() == 'cli-server') {
    $_SERVER['SCRIPT_FILENAME'] = __DIR__ . '/index.php';
    
    // No redirigir archivos estáticos
    $file = __DIR__ . parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
    if (is_file($file)) {
        return false; // Servir el archivo estático
    }
}

// Cargar y ejecutar Laravel normalmente
require_once __DIR__ . '/index.php';
