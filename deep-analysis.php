<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Http\Request;

echo "\n=== ANÁLISIS PROFUNDO DEL PROBLEMA ===\n";
echo str_repeat("=", 70) . "\n";

// 1. Verificar qué rutas están registradas
echo "\n1️⃣  VERIFICAR RUTAS REGISTRADAS:\n";
echo str_repeat("-", 70) . "\n";

$routeCollection = app('router')->getRoutes();
$webRoutes = [];
$apiRoutes = [];

foreach ($routeCollection as $route) {
    if (strpos($route->uri, 'api/') === 0) {
        $apiRoutes[$route->uri] = $route;
    } else {
        $webRoutes[$route->uri] = $route;
    }
}

echo "Rutas WEB: " . count($webRoutes) . "\n";
echo "Rutas API: " . count($apiRoutes) . "\n";

echo "\nRutas API encontradas:\n";
foreach ($apiRoutes as $uri => $route) {
    echo "  ✓ $uri\n";
}

// 2. Simular petición HTTP a /api/categories
echo "\n2️⃣  SIMULAR PETICIÓN HTTP A /api/categories:\n";
echo str_repeat("-", 70) . "\n";

$request = Request::create('/api/categories', 'GET');

echo "Request path: " . $request->path() . "\n";
echo "Request URI: " . $request->getRequestUri() . "\n";
echo "Request URL: " . $request->url() . "\n";

// Hacer dispatch
$response = app('router')->dispatch($request);

echo "\nRESPUESTA:\n";
echo "  Status: " . $response->getStatusCode() . "\n";
echo "  Content-Type: " . $response->headers->get('Content-Type') . "\n";

$content = $response->getContent();

// Verificar si es JSON o HTML
if (strpos($content, '<!DOCTYPE') === 0) {
    echo "  Tipo: HTML ❌\n";
    echo "  Primeros 150 chars:\n";
    echo "  " . substr($content, 0, 150) . "\n";
} elseif (strpos($content, '{') === 0) {
    echo "  Tipo: JSON ✅\n";
    $data = json_decode($content, true);
    if ($data) {
        echo "  Datos: " . count($data) . " elementos\n";
        if (isset($data['success'])) {
            echo "  Success: " . ($data['success'] ? 'true' : 'false') . "\n";
        }
    }
} else {
    echo "  Tipo: DESCONOCIDO\n";
    echo "  Primeros 100 chars: " . substr($content, 0, 100) . "\n";
}

// 3. Revisar web.php fallback
echo "\n3️⃣  REVISAR CONFIGURACIÓN DE web.php:\n";
echo str_repeat("-", 70) . "\n";

$webPhpPath = base_path('routes/web.php');
$webPhpContent = file_get_contents($webPhpPath);

if (strpos($webPhpContent, 'strpos($path, \'api/\')') !== false) {
    echo "✅ Fallback TIENE el check para /api/\n";
    echo "   El fallback debería devolver JSON para rutas API\n";
} else {
    echo "❌ Fallback NO TIENE el check para /api/\n";
    echo "   El fallback devuelve HTML para TODO\n";
}

// 4. Test directo del fallback logic
echo "\n4️⃣  TEST DIRECTO DEL FALLBACK LOGIC:\n";
echo str_repeat("-", 70) . "\n";

$testPaths = [
    '/api/categories',
    '/api/courses',
    '/admin.html',
    '/index.html',
    '/some-other-path'
];

foreach ($testPaths as $testPath) {
    $testRequest = Request::create($testPath, 'GET');
    $testPath = $testRequest->path();
    $shouldBeJson = strpos($testPath, 'api/') === 0;
    
    echo "Path: $testPath\n";
    echo "  Should be JSON? " . ($shouldBeJson ? "YES ✅" : "NO ❌") . "\n";
}

echo "\n";
