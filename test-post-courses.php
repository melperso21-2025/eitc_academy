<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Http\Request;
use App\Models\User;

echo "\n=== TEST: POST /api/courses ===\n";
echo str_repeat("=", 70) . "\n";

// Obtener admin user para generar token
$admin = User::where('email', 'admin@eitcacademy.com')->first();

if (!$admin) {
    echo "❌ Admin no encontrado\n";
    exit(1);
}

// Generar token
$token = $admin->createToken('test-token')->plainTextToken;
echo "✅ Token generado: " . substr($token, 0, 30) . "...\n";

// Crear request POST
$request = Request::create('/api/courses', 'POST', [], [], [], [
    'HTTP_AUTHORIZATION' => "Bearer $token",
    'HTTP_CONTENT_TYPE' => 'application/json',
], json_encode([
    'name' => 'Test Curso ' . time(),
    'description' => 'Test Description',
    'slug' => 'test-curso-' . time(),
    'category_id' => 1,
    'price' => 100,
    'modality' => 'virtual',
    'level' => 'basico',
    'certificate' => 'Test Certificate',
    'duration_hours' => 30,
    'is_published' => false
]));

echo "\nRequest details:\n";
echo "  Path: " . $request->path() . "\n";
echo "  Method: " . $request->method() . "\n";
echo "  Header Authorization: " . $request->header('Authorization') . "\n";
echo "  Content-Type: " . $request->header('Content-Type') . "\n";

// Dispatch
$response = app('router')->dispatch($request);

echo "\nResponse:\n";
echo "  Status: " . $response->getStatusCode() . "\n";
echo "  Content-Type: " . $response->headers->get('Content-Type') . "\n";

$content = $response->getContent();

if (strpos($content, '<!DOCTYPE') === 0) {
    echo "  Body: HTML (❌ PROBLEMA)\n";
    echo "  Primeros 200 chars: " . substr($content, 0, 200) . "\n";
} elseif (strpos($content, '{') === 0) {
    echo "  Body: JSON (✅ OK)\n";
    $data = json_decode($content, true);
    echo "  Data: " . json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
} else {
    echo "  Body: DESCONOCIDO\n";
    echo "  Primeros 100 chars: " . substr($content, 0, 100) . "\n";
}

echo "\n";
