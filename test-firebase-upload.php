<?php

use Illuminate\Contracts\Console\Kernel;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use App\Services\FirebaseStorageService;

require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';

$app->make(Kernel::class)->bootstrap();

$path = storage_path('app/test-image.jpg');

if (!file_exists($path)) {
    echo "Test image not found at {$path}\n";
    exit(1);
}

$uploadedFile = new UploadedFile(
    $path,
    'test-image.jpg',
    'image/jpeg',
    null,
    true
);

/** @var FirebaseStorageService $service */
$service = app(FirebaseStorageService::class);

$result = $service->uploadImage($uploadedFile, 'testing');

print_r($result);
