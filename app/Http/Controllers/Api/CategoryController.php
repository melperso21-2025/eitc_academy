<?php

namespace App\Http\Controllers\Api;

use App\Models\Category;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    /**
     * GET /api/categories
     * Listar todas las categorías
     */
    public function index()
    {
        $categories = Category::with('courses')->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * GET /api/categories/{id}
     * Ver detalle de una categoría con sus cursos
     */
    public function show(Category $category)
    {
        $category->load('courses');

        return response()->json([
            'success' => true,
            'data' => $category,
        ]);
    }

    /**
     * POST /api/categories
     * Crear categoría (solo admin)
     */
    public function store(Request $request)
    {
        if (!auth('sanctum')->check() || auth('sanctum')->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'No autorizado',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:categories,name',
            'slug' => 'nullable|string|unique:categories,slug',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        if (!isset($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $category = Category::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Categoría creada correctamente',
            'data' => $category,
        ], 201);
    }

    /**
     * PUT /api/categories/{id}
     * Editar categoría (solo admin)
     */
    public function update(Request $request, Category $category)
    {
        if (!auth('sanctum')->check() || auth('sanctum')->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'No autorizado',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('categories', 'name')->ignore($category->id),
            ],
            'slug' => [
                'nullable',
                'string',
                Rule::unique('categories', 'slug')->ignore($category->id),
            ],
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        if (isset($validated['name']) && !isset($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $category->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Categoría actualizada correctamente',
            'data' => $category,
        ]);
    }

    /**
     * DELETE /api/categories/{id}
     * Eliminar categoría (solo admin)
     */
    public function destroy(Category $category)
    {
        if (!auth('sanctum')->check() || auth('sanctum')->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'No autorizado',
            ], 403);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Categoría eliminada correctamente',
        ]);
    }
}
