<?php

namespace App\Http\Controllers\Api;

use App\Models\Favorite;
use App\Models\Course;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class FavoriteController extends Controller
{
    /**
     * GET /api/favorites
     * Listar favoritos del usuario autenticado
     */
    public function index(Request $request)
    {
        $favorites = $request->user()->favorites()
            ->with('course')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $favorites,
        ]);
    }

    /**
     * POST /api/favorites
     * Agregar curso a favoritos (toggle)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'course_id' => 'required|exists:courses,id',
        ]);

        $user = $request->user();
        $course = Course::findOrFail($validated['course_id']);

        // Verificar si ya existe
        $favorite = Favorite::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->first();

        if ($favorite) {
            // Si existe, eliminar (toggle off)
            $favorite->delete();
            return response()->json([
                'success' => true,
                'message' => 'Curso removido de favoritos',
                'is_favorite' => false,
            ]);
        }

        // Si no existe, crear
        Favorite::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Curso agregado a favoritos',
            'is_favorite' => true,
        ], 201);
    }

    /**
     * DELETE /api/favorites/{course_id}
     * Eliminar curso de favoritos
     */
    public function destroy(Request $request, $courseId)
    {
        $favorite = Favorite::where('user_id', $request->user()->id)
            ->where('course_id', $courseId)
            ->firstOrFail();

        $favorite->delete();

        return response()->json([
            'success' => true,
            'message' => 'Curso removido de favoritos',
        ]);
    }
}
