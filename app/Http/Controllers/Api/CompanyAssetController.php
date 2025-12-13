<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompanyAsset;
use App\Services\FirebaseStorageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CompanyAssetController extends Controller
{
    private const ALLOWED_TYPES = ['logo', 'brand', 'history'];

    public function __construct(private readonly FirebaseStorageService $firebaseStorage)
    {
    }

    public function index(Request $request)
    {
        $query = CompanyAsset::query();

        if ($request->filled('type')) {
            $query->where('type', $request->string('type')->value());
        }

        $assets = $query
            ->orderBy('display_order')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $assets,
        ]);
    }

    public function store(Request $request)
    {
        if (!$this->isAdmin()) {
            return $this->unauthorizedResponse();
        }

        $validator = Validator::make($request->all(), [
            'type' => 'required|string|in:' . implode(',', self::ALLOWED_TYPES),
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'display_order' => 'nullable|integer|min:0',
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        $uploadResult = $this->firebaseStorage->uploadImage(
            $request->file('image'),
            'company/' . $validated['type']
        );

        if (!$uploadResult['success']) {
            return response()->json([
                'success' => false,
                'message' => 'Error al subir la imagen: ' . ($uploadResult['message'] ?? 'desconocido'),
            ], 400);
        }

        $asset = CompanyAsset::create([
            'type' => $validated['type'],
            'title' => $validated['title'] ?? null,
            'description' => $validated['description'] ?? null,
            'display_order' => $validated['display_order'] ?? 0,
            'image_url' => $uploadResult['url'],
            'storage_path' => $uploadResult['path'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Imagen corporativa creada correctamente',
            'data' => $asset,
        ], 201);
    }

    public function update(Request $request, CompanyAsset $companyAsset)
    {
        if (!$this->isAdmin()) {
            return $this->unauthorizedResponse();
        }

        $validator = Validator::make($request->all(), [
            'type' => 'sometimes|required|string|in:' . implode(',', self::ALLOWED_TYPES),
            'title' => 'sometimes|nullable|string|max:255',
            'description' => 'sometimes|nullable|string',
            'display_order' => 'sometimes|integer|min:0',
            'image' => 'sometimes|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        if ($request->hasFile('image')) {
            $folderType = $validated['type'] ?? $companyAsset->type;

            $uploadResult = $this->firebaseStorage->uploadImage(
                $request->file('image'),
                'company/' . $folderType
            );

            if (!$uploadResult['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al subir la imagen: ' . ($uploadResult['message'] ?? 'desconocido'),
                ], 400);
            }

            if ($companyAsset->storage_path) {
                $this->firebaseStorage->deleteFile($companyAsset->storage_path);
            }

            $validated['image_url'] = $uploadResult['url'];
            $validated['storage_path'] = $uploadResult['path'] ?? null;
        }

        $companyAsset->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Imagen corporativa actualizada correctamente',
            'data' => $companyAsset->fresh(),
        ]);
    }

    public function destroy(CompanyAsset $companyAsset)
    {
        if (!$this->isAdmin()) {
            return $this->unauthorizedResponse();
        }

        if ($companyAsset->storage_path) {
            $this->firebaseStorage->deleteFile($companyAsset->storage_path);
        }

        $companyAsset->delete();

        return response()->json([
            'success' => true,
            'message' => 'Imagen corporativa eliminada correctamente',
        ]);
    }

    private function isAdmin(): bool
    {
        return auth('sanctum')->check() && auth('sanctum')->user()->role === 'admin';
    }

    private function unauthorizedResponse()
    {
        return response()->json([
            'success' => false,
            'message' => 'No autorizado',
        ], 403);
    }
}
