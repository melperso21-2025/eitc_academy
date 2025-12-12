<?php
 
namespace App\Services;
 
use Kreait\Firebase\Factory;
 
class FirebaseService
{
    protected $storage;
    protected $bucketName;
 
    public function __construct()
    {
        // 1. Cargamos las credenciales y conectamos con Firebase
        $factory = (new Factory)
            ->withServiceAccount(base_path(env('FIREBASE_CREDENTIALS')));
 
        // 2. Iniciamos el servicio de Storage
        $this->storage = $factory->createStorage();
        $this->bucketName = env('FIREBASE_STORAGE_BUCKET');
    }
 
    /**
     * Sube un archivo a Firebase y devuelve la URL pública.
     */
    public function uploadImage($file, $folder = 'juegos')
    {
        // Generamos un nombre único: juegos/123456789_mario.jpg
        $fileName = $folder . '/' . time() . '_' . $file->getClientOriginalName();
        
        $bucket = $this->storage->getBucket($this->bucketName);
 
        // Subimos el archivo
        // fopen abre el archivo temporal que Laravel recibió
        $object = $bucket->upload(
            fopen($file->getPathname(), 'r'),
            [
                'name' => $fileName
            ]
        );
 
        // Hacemos el archivo público (para que el frontend lo pueda ver)
        $object->update(['acl' => []], ['predefinedAcl' => 'PUBLICREAD']);
 
        // Retornamos la URL pública
        return "https://storage.googleapis.com/{$this->bucketName}/{$fileName}";
    }
}