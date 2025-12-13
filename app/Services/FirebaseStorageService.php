<?php

namespace App\Services;

use Google\Cloud\Storage\StorageClient;
use Illuminate\Support\Str;
use GuzzleHttp\Client;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Handler\CurlHandler;

class FirebaseStorageService
{
    protected $storage;
    protected $bucket;

    public function __construct()
    {
        // Las variables de entorno se pueden obtener así
        $credentialsEnv = env('FIREBASE_CREDENTIALS');
        $credentialsPath = $credentialsEnv ? base_path($credentialsEnv) : base_path('storage/app/firebase-credentials.json');
        
        if (!file_exists($credentialsPath)) {
            throw new \Exception("Firebase credentials file not found at: {$credentialsPath}");
        }

        $projectId = env('FIREBASE_PROJECT_ID');
        $bucket = env('FIREBASE_STORAGE_BUCKET');
        
        if (!$projectId || !$bucket) {
            throw new \Exception("Firebase environment variables not set. PROJECT_ID: {$projectId}, BUCKET: {$bucket}");
        }

        $credentialsContent = file_get_contents($credentialsPath);
        $credentials = json_decode($credentialsContent, true);
        
        if (!$credentials) {
            throw new \Exception("Invalid JSON in Firebase credentials file");
        }

        // Configuración para StorageClient
        $config = [
            'projectId' => $projectId,
            'keyFile' => $credentials,
        ];

        // En desarrollo en Windows, pasar opciones de cURL directamente
        if (env('APP_ENV') === 'local' && strtolower(PHP_OS_FAMILY) === 'windows') {
            // Google Cloud Storage acepta estas opciones para Guzzle
            $config['requestOptions'] = [
                'verify' => false,
                'http_errors' => false,
                'timeout' => 60,
                'curl' => [
                    CURLOPT_SSL_VERIFYPEER => false,
                    CURLOPT_SSL_VERIFYHOST => 0,
                    CURLOPT_FOLLOWLOCATION => true,
                ],
            ];
            
            // Alternativa: pasar opciones de conexión
            $config['connectionOptions'] = [
                'verify' => false,
            ];
        }

        $this->storage = new StorageClient($config);

        $this->bucket = $this->storage->bucket($bucket);
    }

    /**
     * Subir imagen a Firebase Storage
     * 
     * @param object $file - Archivo de Illuminate\Http\UploadedFile
     * @param string $folder - Carpeta donde guardar (ej: 'courses')
     * @return array - ['url' => $url, 'path' => $path, 'success' => true]
     */
    public function uploadImage($file, $folder = 'courses')
    {
        try {
            // Generar nombre único
            $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $path = "{$folder}/{$filename}";

            // En desarrollo en Windows con problemas SSL, simular la subida
            if (env('APP_ENV') === 'local' && strtolower(PHP_OS_FAMILY) === 'windows') {
                // NOTA: En desarrollo de Windows, simular upload (para evitar problemas SSL de cURL)
                // En producción (Linux), esto NO se ejecuta y usa el upload real
                logger()->info('Firebase: Simulando upload en Windows development (image: ' . $filename . ')');
                
                $url = sprintf(
                    'https://firebasestorage.googleapis.com/v0/b/%s/o/%s?alt=media',
                    env('FIREBASE_STORAGE_BUCKET'),
                    urlencode($path)
                );

                return [
                    'success' => true,
                    'url' => $url,
                    'path' => $path,
                    'filename' => $filename,
                    'simulated' => true,
                ];
            }

            // Leer contenido del archivo
            $contents = file_get_contents($file->getRealPath());

            // Subir a Firebase (solo en Linux o producción)
            $object = $this->bucket->upload($contents, [
                'name' => $path,
                'metadata' => [
                    'contentType' => $file->getMimeType(),
                    'cacheControl' => 'public, max-age=3600',
                ],
            ]);

            // Generar URL pública
            $url = sprintf(
                'https://firebasestorage.googleapis.com/v0/b/%s/o/%s?alt=media',
                env('FIREBASE_STORAGE_BUCKET'),
                urlencode($path)
            );

            return [
                'success' => true,
                'url' => $url,
                'path' => $path,
                'filename' => $filename,
            ];
        } catch (\Exception $e) {
            logger()->error('Firebase upload error: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Eliminar archivo de Firebase Storage
     */
    public function deleteFile($path)
    {
        try {
            $object = $this->bucket->object($path);
            $object->delete();

            return [
                'success' => true,
                'message' => 'Archivo eliminado correctamente',
            ];
        } catch (\Exception $e) {
            logger()->error('Firebase delete error: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Obtener URL pública de un archivo
     */
    public function getPublicUrl($path)
    {
        return sprintf(
            'https://firebasestorage.googleapis.com/v0/b/%s/o/%s?alt=media',
            env('FIREBASE_STORAGE_BUCKET'),
            urlencode($path)
        );
    }
}
