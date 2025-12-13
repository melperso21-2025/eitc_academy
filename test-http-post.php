<?php

require 'vendor/autoload.php';

// Boot the application
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Http;

// Test 1: Get all courses
echo "=== TEST 1: GET /api/courses ===\n";
$response = Http::get('http://localhost:8000/api/courses');
echo "Status: " . $response->status() . "\n";
echo "Cursos actuales: " . count($response->json()) . "\n";
echo "\n";

// Test 2: Create a course
echo "=== TEST 2: POST /api/courses ===\n";
$response = Http::post('http://localhost:8000/api/courses', [
    'name' => 'Curso de PHP Avanzado - ' . date('YmdHis'),
    'description' => 'Aprende PHP 8.1 con mejores prácticas',
    'slug' => 'curso-php-' . date('YmdHis'),
    'modality' => 'virtual',
    'start_date' => '2024-02-15',
    'end_date' => '2024-03-15',
    'instructor_id' => 1,
    'max_students' => 30
]);

echo "Status: " . $response->status() . "\n";
if ($response->successful()) {
    $course = $response->json();
    echo "✓ Curso creado con ID: " . $course['id'] . "\n";
    echo "  Nombre: " . $course['name'] . "\n";
    echo "  Slug: " . $course['slug'] . "\n";
} else {
    echo "✗ Error: " . $response->body() . "\n";
}
echo "\n";

// Test 3: Get single course
echo "=== TEST 3: GET /api/courses/{id} ===\n";
if ($response->successful()) {
    $courseId = $course['id'];
    $response = Http::get('http://localhost:8000/api/courses/' . $courseId);
    echo "Status: " . $response->status() . "\n";
    if ($response->successful()) {
        $data = $response->json();
        echo "✓ Curso recuperado: " . $data['name'] . "\n";
    }
}

echo "\n✅ Todos los tests completados\n";
