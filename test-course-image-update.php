<?php

use Illuminate\Contracts\Console\Kernel;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use App\Services\FirebaseStorageService;
use App\Models\Course;

require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$course = Course::first();

if (!$course) {
    echo "No hay cursos en la base de datos.\n";
    exit(1);
}

echo "Actualizando curso ID {$course->id} ({$course->name})\n";

$path = storage_path('app/test-image.jpg');
if (!file_exists($path)) {
    echo "Imagen de prueba no encontrada en {$path}\n";
    exit(1);
}

$uploadedFile = new UploadedFile(
    $path,
    'test-image.jpg',
    'image/jpeg',
    null,
    true
);

$service = app(FirebaseStorageService::class);
$result = $service->uploadImage($uploadedFile, 'courses');

if (!$result['success']) {
    echo "Error subiendo imagen: {$result['message']}\n";
    exit(1);
}

$oldUrl = $course->image_url;
$course->image_url = $result['url'];
$course->save();

echo "Imagen actualizada.\n";
if ($oldUrl) {
    echo "URL anterior: {$oldUrl}\n";
}

echo "Nueva URL: {$course->image_url}\n";
