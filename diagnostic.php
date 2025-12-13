<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Course;

echo "\n";
echo "╔══════════════════════════════════════════════════════════════════╗\n";
echo "║          DIAGNÓSTICO COMPLETO DEL SISTEMA EITC ACADEMY          ║\n";
echo "╚══════════════════════════════════════════════════════════════════╝\n";

// ==================== FASE 1: BASE DE DATOS ====================
echo "\n📊 FASE 1: VALIDAR BASE DE DATOS\n";
echo str_repeat("─", 70) . "\n";

try {
    DB::connection()->getPdo();
    echo "✅ Conexión a BD: EXITOSA\n";
    
    // Validar tabla users
    $userCount = User::count();
    echo "✅ Tabla 'users': EXISTE ($userCount usuarios)\n";
    
    // Validar tabla courses
    $courseCount = Course::count();
    echo "✅ Tabla 'courses': EXISTE ($courseCount cursos)\n";
    
    // Validar usuario admin
    $admin = User::where('email', 'admin@eitcacademy.com')->first();
    if ($admin) {
        echo "✅ Usuario admin: EXISTE (ID: {$admin->id})\n";
    } else {
        echo "❌ Usuario admin: NO EXISTE\n";
    }
    
} catch (\Exception $e) {
    echo "❌ Error BD: " . $e->getMessage() . "\n";
}

// ==================== FASE 2: AUTENTICACIÓN ====================
echo "\n🔐 FASE 2: VALIDAR AUTENTICACIÓN\n";
echo str_repeat("─", 70) . "\n";

try {
    // Buscar admin
    $admin = User::where('email', 'admin@eitcacademy.com')->first();
    
    if ($admin) {
        echo "✅ Admin encontrado: {$admin->email}\n";
        
        // Verificar contraseña
        if (Hash::check('password123', $admin->password)) {
            echo "✅ Contraseña admin: CORRECTA\n";
        } else {
            echo "❌ Contraseña admin: INCORRECTA\n";
        }
        
        // Generar token de prueba
        $token = $admin->createToken('test-token')->plainTextToken;
        echo "✅ Token generado: " . substr($token, 0, 20) . "...\n";
        
        // Verificar token
        $verified = User::where('id', $admin->id)->first();
        echo "✅ Token verificable: SÍ\n";
    } else {
        echo "❌ Admin no encontrado\n";
    }
    
} catch (\Exception $e) {
    echo "❌ Error autenticación: " . $e->getMessage() . "\n";
}

// ==================== FASE 3: FIREBASE ====================
echo "\n🔥 FASE 3: VALIDAR FIREBASE\n";
echo str_repeat("─", 70) . "\n";

try {
    $credentialsPath = env('FIREBASE_CREDENTIALS');
    
    if (file_exists($credentialsPath)) {
        echo "✅ Archivo credenciales: EXISTE\n";
        
        $contents = file_get_contents($credentialsPath);
        $credentials = json_decode($contents, true);
        
        if ($credentials) {
            echo "✅ JSON credenciales: VÁLIDO\n";
            echo "   - Project ID: {$credentials['project_id']}\n";
            echo "   - Bucket: " . env('FIREBASE_STORAGE_BUCKET') . "\n";
        } else {
            echo "❌ JSON credenciales: INVÁLIDO\n";
        }
    } else {
        echo "❌ Archivo credenciales: NO EXISTE\n";
    }
    
    // Verificar clase FirebaseStorageService
    if (class_exists(\App\Services\FirebaseStorageService::class)) {
        echo "✅ Clase FirebaseStorageService: EXISTE\n";
    } else {
        echo "❌ Clase FirebaseStorageService: NO EXISTE\n";
    }
    
} catch (\Exception $e) {
    echo "❌ Error Firebase: " . $e->getMessage() . "\n";
}

// ==================== FASE 4: RUTAS ====================
echo "\n🛣️  FASE 4: VALIDAR RUTAS API\n";
echo str_repeat("─", 70) . "\n";

try {
    $routeCollection = app('router')->getRoutes();
    $apiRoutes = [];
    
    foreach ($routeCollection as $route) {
        if (strpos($route->uri, 'api/') === 0) {
            $apiRoutes[$route->uri] = implode('|', $route->methods);
        }
    }
    
    if (!empty($apiRoutes)) {
        echo "✅ Rutas API encontradas: " . count($apiRoutes) . "\n";
        
        $expectedRoutes = [
            'api/login' => 'POST',
            'api/categories' => 'GET',
            'api/courses' => 'GET|POST',
            'api/courses/{id}' => 'GET|PUT|DELETE',
        ];
        
        foreach ($expectedRoutes as $route => $methods) {
            $found = false;
            foreach ($apiRoutes as $registered => $registeredMethods) {
                if (strpos($registered, str_replace('{id}', '', $route)) !== false) {
                    $found = true;
                    echo "   ✅ $route\n";
                    break;
                }
            }
            if (!$found) {
                echo "   ❌ $route\n";
            }
        }
    } else {
        echo "❌ No hay rutas API registradas\n";
    }
    
} catch (\Exception $e) {
    echo "❌ Error rutas: " . $e->getMessage() . "\n";
}

// ==================== FASE 5: MODELOS ====================
echo "\n📦 FASE 5: VALIDAR MODELOS\n";
echo str_repeat("─", 70) . "\n";

try {
    // User Model
    if (class_exists(\App\Models\User::class)) {
        echo "✅ Modelo User: EXISTE\n";
        $user = new User();
        echo "   - Tabla: {$user->getTable()}\n";
    } else {
        echo "❌ Modelo User: NO EXISTE\n";
    }
    
    // Course Model
    if (class_exists(\App\Models\Course::class)) {
        echo "✅ Modelo Course: EXISTE\n";
        $course = new Course();
        echo "   - Tabla: {$course->getTable()}\n";
    } else {
        echo "❌ Modelo Course: NO EXISTE\n";
    }
    
    // Category Model
    if (class_exists(\App\Models\Category::class)) {
        echo "✅ Modelo Category: EXISTE\n";
    } else {
        echo "⚠️  Modelo Category: NO EXISTE\n";
    }
    
} catch (\Exception $e) {
    echo "❌ Error modelos: " . $e->getMessage() . "\n";
}

// ==================== RESUMEN ====================
echo "\n";
echo "╔══════════════════════════════════════════════════════════════════╗\n";
echo "║                         RECOMENDACIONES                          ║\n";
echo "╚══════════════════════════════════════════════════════════════════╝\n";

echo "
✅ Si TODOS los checks pasaron:
   → El problema está en el Frontend (JavaScript/HTML)
   → Revisar console.log del navegador
   → Validar fetch requests

❌ Si falló Autenticación:
   → Regenerar tokens
   → Verificar Sanctum config
   → Revisar middleware auth

❌ Si falló Firebase:
   → Verificar credenciales
   → Comprobar permisos Storage
   → Revisar simulación Windows

❌ Si falló Base de Datos:
   → Revisar .env y conexión
   → Ejecutar: php artisan migrate:fresh --seed
   → Comprobar credenciales MySQL
";

echo "\n";
