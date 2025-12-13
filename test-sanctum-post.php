<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Http;

$user = User::where('email', 'admin@eitcacademy.com')->first();
if (!$user) {
    echo "Admin not found"; exit;
}
$token = $user->createToken('script-test')->plainTextToken;

$response = Http::withToken($token)->post('http://127.0.0.1:8000/api/courses', [
    'name' => 'CLI Test '.time(),
    'description' => 'desc',
    'category_id' => 1,
    'price' => 100,
    'modality' => 'virtual',
    'level' => 'basico',
    'certificate' => 'cert',
    'duration_hours' => 30,
    'syllabus' => 'syllabus',
    'is_published' => false,
]);

echo "Status: ".$response->status()."\n";
print_r($response->json());
