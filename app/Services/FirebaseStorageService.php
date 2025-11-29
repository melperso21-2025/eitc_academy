<?php

namespace App\Services;

use Google\Cloud\Storage\StorageClient;
use Illuminate\Support\Str;

class FirebaseStorageService
{
    protected $storage;
    protected $bucket;

    public function __construct()
    {
        $this->storage = new StorageClient([
            'projectId' => env('FIREBASE_PROJECT_ID'),
            'keyFile' => [
                'type' => 'service_account',
                'project_id' => env('FIREBASE_PROJECT_ID'),
                'private_key_id' => env('FIREBASE_PRIVATE_KEY_ID'),
                'private_key' => $this->formatPrivateKey(env('FIREBASE_PRIVATE_KEY')),
                'client_email' => env('FIREBASE_CLIENT_EMAIL'),
                'client_id' => env('FIREBASE_CLIENT_ID', ''),
                'auth_uri' => 'https://accounts.google.com/o/oauth2/auth',
                'token_uri' => 'https://oauth2.googleapis.com/token',
                'auth_provider_x509_cert_url' => 'https://www.googleapis.com/oauth2/v1/certs',
            ],
        ]);

        $this->bucket = $this->storage->bucket(env('FIREBASE_STORAGE_BUCKET'));
    }

    /**
     * Formatear private key (convertir \n a saltos reales)
     */
    protected function formatPrivateKey($key)
    {
        return str_replace('\\n', "\n", $key);
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

            // Leer contenido del archivo
            $contents = file_get_contents($file->getRealPath());

            // Subir a Firebase
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
