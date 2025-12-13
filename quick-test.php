<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';

// Ejecutar bootstrappers
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Crear un usuario de prueba/obtener admin
$user = \App\Models\User::where('role', 'admin')->first();

if (!$user) {
    echo "No admin user found\n";
    echo "Users:\n";
    \App\Models\User::all(['id', 'email', 'name', 'role'])->each(function($u) {
        echo " - ID: {$u->id}, Email: {$u->email}, Role: {$u->role}\n";
    });
    exit;
}

echo "Admin user found: {$user->email}\n";
echo "User token capabilities: " . ($user->tokens->count()) . " tokens\n";

// Obtener token
$token = $user->createToken('test')->plainTextToken;
echo "Token: " . substr($token, 0, 20) . "...\n";
echo "\n=== TEST COMPLETE ===\n";
