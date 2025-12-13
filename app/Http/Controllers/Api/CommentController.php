<?php

namespace App\Http\Controllers\Api;

use App\Models\Comment;
use App\Models\Course;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

/**
 * Administra comentarios de cursos incluyendo moderación por administradores.
 */
class CommentController extends Controller
{
    /**
     * GET /api/comments/{course_id}
     * Listar comentarios de un curso
     */
    public function index($courseId)
    {
        $course = Course::findOrFail($courseId);
        
        $comments = $course->comments()
            ->with('user:id,name,email')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $comments,
        ]);
    }

    /**
     * POST /api/comments
     * Crear comentario en un curso
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'course_id' => 'required|exists:courses,id',
            'content' => 'required|string|max:200',
        ]);

        // Verificar que el usuario esté inscrito en el curso (opcional)
        // $isEnrolled = $request->user()->enrollments()
        //     ->where('course_id', $validated['course_id'])
        //     ->exists();

        $comment = Comment::create([
            'user_id' => $request->user()->id,
            'course_id' => $validated['course_id'],
            'content' => $validated['content'],
        ]);

        $comment->load('user:id,name,email');

        return response()->json([
            'success' => true,
            'message' => 'Comentario creado correctamente',
            'data' => $comment,
        ], 201);
    }

    /**
     * PUT /api/comments/{id}
     * Actualizar comentario (solo autor o admin)
     */
    public function update(Request $request, Comment $comment)
    {
        if ($request->user()->id !== $comment->user_id && $request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'No autorizado',
            ], 403);
        }

        $validated = $request->validate([
            'content' => 'required|string|max:200',
        ]);

        $comment->update([
            'content' => $validated['content'],
        ]);

        $comment->load('user:id,name,email');

        return response()->json([
            'success' => true,
            'message' => 'Comentario actualizado correctamente',
            'data' => $comment,
        ]);
    }

    /**
     * DELETE /api/comments/{id}
     * Eliminar comentario (solo autor o admin)
     */
    public function destroy(Request $request, Comment $comment)
    {
        // Verificar que sea el autor o un admin
        if ($request->user()->id !== $comment->user_id && $request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'No autorizado',
            ], 403);
        }

        $comment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Comentario eliminado correctamente',
        ]);
    }
}
