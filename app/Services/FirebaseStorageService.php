<?php

namespace App\Services;

use Google\Cloud\Storage\StorageClient;
use Illuminate\Support\Str;
use GuzzleHttp\Client;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Handler\CurlHandler;

/**
 * Encapsula interacciones con Firebase Storage para subir, borrar y obtener URLs públicas.
 */
class FirebaseStorageService
{
    protected $storage;
    protected $bucket;
    protected array $storageConfig = [];
    protected string $bucketName;
    protected array $credentialsArray = [];
    protected string $projectId;

    public function __construct()
    {
        // Inicializa credenciales y clientes a partir del .env y fallback local
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

        $this->credentialsArray = $credentials;
        $this->projectId = $projectId;
        $this->bucketName = $bucket;

        $this->refreshStorageClient();
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
            $downloadToken = (string) Str::uuid();

            $simulateEnv = env('FIREBASE_SIMULATE_UPLOAD');
            $simulateUpload = is_null($simulateEnv)
                ? (env('APP_ENV') === 'local' && strtolower(PHP_OS_FAMILY) === 'windows')
                : filter_var($simulateEnv, FILTER_VALIDATE_BOOLEAN);

            // En desarrollo de Windows se permite simular la subida con toggle por env
            if ($simulateUpload) {
                logger()->info('Firebase: Simulando upload (image: ' . $filename . ')');

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
                    'downloadToken' => null,
                    'simulated' => true,
                ];
            }

            // Leer contenido del archivo
            $contents = file_get_contents($file->getRealPath());

            $attempts = 0;
            $maxAttempts = 3;

            while ($attempts < $maxAttempts) {
                try {
                    $this->bucket->upload($contents, [
                        'name' => $path,
                        'metadata' => [
                            'contentType' => $file->getMimeType(),
                            'cacheControl' => 'public, max-age=3600',
                            'metadata' => [
                                'firebaseStorageDownloadTokens' => $downloadToken,
                            ],
                        ],
                    ]);

                    $baseUrl = sprintf(
                        'https://firebasestorage.googleapis.com/v0/b/%s/o/%s',
                        env('FIREBASE_STORAGE_BUCKET'),
                        urlencode($path)
                    );

                    $query = 'alt=media';
                    if (!empty($downloadToken)) {
                        $query .= '&token=' . $downloadToken;
                    }

                    $url = $baseUrl . '?' . $query;

                    return [
                        'success' => true,
                        'url' => $url,
                        'path' => $path,
                        'filename' => $filename,
                        'downloadToken' => $downloadToken,
                    ];
                } catch (\Exception $inner) {
                    $attempts++;
                    logger()->error('Firebase upload error: ' . $inner->getMessage());

                    if ($attempts >= $maxAttempts || !$this->shouldRetryUpload($inner)) {
                        return [
                            'success' => false,
                            'message' => $inner->getMessage(),
                        ];
                    }

                    $this->refreshStorageClient();
                    usleep(200000); // 200ms antes de reintentar
                }
            }

            return [
                'success' => false,
                'message' => 'No se pudo subir la imagen tras varios intentos',
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

    private function refreshStorageClient(): void
    {
        // Regenera el cliente de Google Storage para aplicar nuevas configuraciones o reintentos
        $this->storageConfig = $this->buildStorageConfig();
        $this->storage = new StorageClient($this->storageConfig);
        $this->bucket = $this->storage->bucket($this->bucketName);
    }

    private function buildStorageConfig(): array
    {
        // Construye la configuración base del SDK y aplica workarounds para entornos locales Windows
        $config = [
            'projectId' => $this->projectId,
            'keyFile' => $this->credentialsArray,
        ];

        if ($this->shouldDisableSslVerification()) {
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

            $config['connectionOptions'] = [
                'verify' => false,
            ];

            $handlerStack = HandlerStack::create(new CurlHandler());
            $guzzleClient = new Client([
                'handler' => $handlerStack,
                'verify' => false,
                'http_errors' => false,
                'timeout' => 60,
            ]);

            $config['httpHandler'] = function ($request, array $options) use ($guzzleClient) {
                $merged = array_merge([
                    'verify' => false,
                    'http_errors' => false,
                    'timeout' => 60,
                ], $options);

                return $guzzleClient->send($request, $merged);
            };
        }

        return $config;
    }

    private function shouldDisableSslVerification(): bool
    {
        return env('APP_ENV') === 'local' && strtolower(PHP_OS_FAMILY) === 'windows';
    }

    private function shouldRetryUpload(\Exception $exception): bool
    {
        $message = $exception->getMessage();

        return str_contains($message, 'SSL certificate')
            || str_contains($message, 'Could not resolve host')
            || str_contains($message, 'Failed to connect');
    }
}
