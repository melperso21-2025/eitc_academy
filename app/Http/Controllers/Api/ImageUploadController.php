<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Services\FirebaseStorageService;
use Illuminate\Http\Request;

class ImageUploadController extends Controller
{
    protected $firebaseStorage;

    public function __construct(FirebaseStorageService $firebaseStorage)
    {
        $this->firebaseStorage = $firebaseStorage;
    }

    /**
     * POST /api/courses/{id}/upload-image
     * Subir imagen para un curso (solo admin)
     */
    public function uploadCourseImage(Request $request, Course $course)
    {
        // Verificar que sea admin
        if (!auth('sanctum')->check() || auth('sanctum')->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'No autorizado',
            ], 403);
        }

        // Validar archivo
        $validated = $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // máx 5MB
        ]);

        // Subir a Firebase
        $result = $this->firebaseStorage->uploadImage($request->file('image'), 'courses');

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => 'Error al subir la imagen: ' . $result['message'],
            ], 400);
        }

        // Actualizar curso con la URL de la imagen
        // Si había imagen anterior, eliminarla
        if ($course->image_url) {
            // Extraer path de la URL anterior y eliminar
            // (opcional, por ahora solo guardamos la nueva)
        }

        $course->update(['image_url' => $result['url']]);

        return response()->json([
            'success' => true,
            'message' => 'Imagen subida correctamente',
            'data' => [
                'url' => $result['url'],
                'path' => $result['path'],
            ],
        ], 201);
    }

    /**
     * POST /api/upload-image
     * Subir imagen genérica (para pruebas)
     */
    public function uploadImage(Request $request)
    {
        // Validar autenticación (opcional, puede ser público)
        $validated = $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'folder' => 'nullable|string',
        ]);

        $folder = $validated['folder'] ?? 'uploads';

        $result = $this->firebaseStorage->uploadImage($request->file('image'), $folder);

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => 'Error al subir la imagen',
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'Imagen subida correctamente',
            'data' => $result,
        ], 201);
    }
}
