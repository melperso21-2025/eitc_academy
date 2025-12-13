<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

echo "\n=== TEST: Verificar rutas API ===\n";
echo str_repeat("-", 70) . "\n";

// Obtener todas las rutas
$routeCollection = app('router')->getRoutes();

echo "Total de rutas: " . count($routeCollection) . "\n\n";

echo "Rutas API:\n";
$apiRoutes = [];
foreach ($routeCollection as $route) {
    if (strpos($route->uri, 'api/') === 0) {
        $methods = implode('|', $route->methods);
        echo "  ✓ {$route->uri} -> {$methods}\n";
        $apiRoutes[$route->uri] = $methods;
    }
}

echo "\nTotal rutas API: " . count($apiRoutes) . "\n";

// Verificar si /api/categories está registrada
if (isset($apiRoutes['api/categories'])) {
    echo "\n✅ RUTA /api/categories: REGISTRADA\n";
} else {
    echo "\n❌ RUTA /api/categories: NO REGISTRADA\n";
}

// Ahora simular una petición
echo "\n" . str_repeat("-", 70) . "\n";
echo "=== TEST: Simular petición a /api/categories ===\n";
echo str_repeat("-", 70) . "\n";

try {
    // Crear request manual
    $request = Request::create('/api/categories', 'GET');
    
    // Hacer dispatch manual
    $response = app('router')->dispatch($request);
    
    echo "Status: " . $response->getStatusCode() . "\n";
    echo "Content-Type: " . $response->headers->get('Content-Type') . "\n";
    
    $content = $response->getContent();
    
    // Verificar si es JSON o HTML
    if (strpos($content, '<!DOCTYPE') === 0) {
        echo "⚠️  RESPUESTA: HTML (¡PROBLEMA!)\n";
        echo "Primeros 100 chars: " . substr($content, 0, 100) . "\n";
    } else if (strpos($content, '{') === 0) {
        echo "✅ RESPUESTA: JSON (CORRECTO)\n";
        $data = json_decode($content, true);
        echo "Contenido: " . json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
    } else {
        echo "⚠️  RESPUESTA: Desconocida\n";
        echo "Primeros 100 chars: " . substr($content, 0, 100) . "\n";
    }
    
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}

echo "\n";
