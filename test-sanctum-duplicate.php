<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Http;

$user = User::where('email', 'admin@eitcacademy.com')->first();
$token = $user->createToken('dup-test')->plainTextToken;

$name = 'Curso Duplicado Demo';

$response1 = Http::withToken($token)->post('http://127.0.0.1:8000/api/courses', [
    'name' => $name,
    'description' => 'desc',
    'category_id' => 1,
    'price' => 50,
    'modality' => 'virtual',
    'level' => 'basico',
    'certificate' => 'cert',
    'duration_hours' => 20,
    'syllabus' => 'syllabus',
    'is_published' => false,
]);

echo "Primera creación status: ".$response1->status()."\n";

$response2 = Http::withToken($token)->post('http://127.0.0.1:8000/api/courses', [
    'name' => $name,
    'description' => 'desc',
    'category_id' => 1,
    'price' => 50,
    'modality' => 'virtual',
    'level' => 'basico',
    'certificate' => 'cert',
    'duration_hours' => 20,
    'syllabus' => 'syllabus',
    'is_published' => false,
]);

echo "Segunda creación status: ".$response2->status()."\n";
print_r($response2->json());
