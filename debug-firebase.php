<?php

// Cargar autoloader
require_once 'vendor/autoload.php';

// Cargar configuración de Laravel
$app = require_once 'bootstrap/app.php';

// 1. Verificar archivo de credenciales
echo "=== STEP 1: Verificando archivo de credenciales ===\n";
$credentialsPath = base_path(env('FIREBASE_CREDENTIALS', 'storage/app/firebase-credentials.json'));
echo "Ruta esperada: {$credentialsPath}\n";
echo "¿Existe el archivo? " . (file_exists($credentialsPath) ? "SÍ\n" : "NO\n");

if (file_exists($credentialsPath)) {
    $content = file_get_contents($credentialsPath);
    $decoded = json_decode($content, true);
    
    if ($decoded) {
        echo "✓ JSON válido\n";
        echo "  Project ID: " . $decoded['project_id'] . "\n";
        echo "  Type: " . $decoded['type'] . "\n";
        echo "  Client Email: " . $decoded['client_email'] . "\n";
    } else {
        echo "✗ JSON inválido: " . json_last_error_msg() . "\n";
    }
}

// 2. Verificar variables de entorno
echo "\n=== STEP 2: Verificando variables de entorno ===\n";
echo "FIREBASE_PROJECT_ID: " . env('FIREBASE_PROJECT_ID') . "\n";
echo "FIREBASE_STORAGE_BUCKET: " . env('FIREBASE_STORAGE_BUCKET') . "\n";
echo "FIREBASE_CREDENTIALS: " . env('FIREBASE_CREDENTIALS') . "\n";

// 3. Intentar instanciar el servicio
echo "\n=== STEP 3: Intentando instanciar FirebaseStorageService ===\n";
try {
    $firebaseService = app(\App\Services\FirebaseStorageService::class);
    echo "✓ Servicio instanciado exitosamente\n";
} catch (\Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
    exit(1);
}

// 4. Verificar Google Cloud Storage Client
echo "\n=== STEP 4: Verificando Google Cloud Storage Client ===\n";
try {
    $credentialsPath = base_path(env('FIREBASE_CREDENTIALS', 'storage/app/firebase-credentials.json'));
    $credentials = json_decode(file_get_contents($credentialsPath), true);
    
    $storageClient = new \Google\Cloud\Storage\StorageClient([
        'projectId' => env('FIREBASE_PROJECT_ID'),
        'keyFile' => $credentials,
    ]);
    
    echo "✓ StorageClient instanciado exitosamente\n";
    
    $bucket = $storageClient->bucket(env('FIREBASE_STORAGE_BUCKET'));
    echo "✓ Bucket accesible: " . env('FIREBASE_STORAGE_BUCKET') . "\n";
    
} catch (\Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
}

echo "\n=== DEBUG COMPLETADO ===\n";
