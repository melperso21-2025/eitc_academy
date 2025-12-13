<?php

// Test simple: hacer una petición HTTP real al servidor

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://127.0.0.1:8000/api/categories');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

list($headers, $body) = explode("\r\n\r\n", $response, 2);

echo "\n=== PETICIÓN HTTP REAL A http://127.0.0.1:8000/api/categories ===\n";
echo str_repeat("=", 70) . "\n";

echo "HTTP Status: $httpCode\n";
echo "\nHeaders:\n";
echo $headers . "\n";

echo "\nBody (primeros 300 caracteres):\n";
echo substr($body, 0, 300) . "\n";

if (strpos($body, '<!DOCTYPE') === 0) {
    echo "\n❌ PROBLEMA: Devuelve HTML en lugar de JSON\n";
    echo "Esto significa que el fallback de web.php está capturando la ruta API\n";
} elseif (strpos($body, '{') === 0) {
    echo "\n✅ CORRECTO: Devuelve JSON\n";
} else {
    echo "\n⚠️ DESCONOCIDO\n";
}

echo "\n";
