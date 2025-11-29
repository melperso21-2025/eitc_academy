<?php

namespace App\Http\Controllers\Api;

use App\Models\Enrollment;
use App\Models\Course;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class EnrollmentController extends Controller
{
    /**
     * GET /api/enrollments
     * Listar cursos en los que el usuario está inscrito
     */
    public function index(Request $request)
    {
        $enrollments = $request->user()->enrollments()
            ->with('course.category')
            ->orderBy('enrolled_at', 'desc')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $enrollments,
        ]);
    }

    /**
     * POST /api/enrollments
     * Inscribirse en un curso (simular compra)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'course_id' => 'required|exists:courses,id',
        ]);

        $user = $request->user();
        $course = Course::findOrFail($validated['course_id']);

        // Verificar si ya está inscrito
        $existingEnrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->first();

        if ($existingEnrollment) {
            return response()->json([
                'success' => false,
                'message' => 'Ya estás inscrito en este curso',
            ], 400);
        }

        // Crear inscripción (simular compra)
        $enrollment = Enrollment::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
        ]);

        $enrollment->load('course.category');

        return response()->json([
            'success' => true,
            'message' => 'Te has inscrito correctamente en el curso',
            'data' => $enrollment,
        ], 201);
    }

    /**
     * GET /api/enrollments/{course_id}
     * Ver detalle de inscripción
     */
    public function show(Request $request, $courseId)
    {
        $enrollment = Enrollment::where('user_id', $request->user()->id)
            ->where('course_id', $courseId)
            ->with('course.category')
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $enrollment,
        ]);
    }

    /**
     * DELETE /api/enrollments/{course_id}
     * Cancelar inscripción (desinscribirse)
     */
    public function destroy(Request $request, $courseId)
    {
        $enrollment = Enrollment::where('user_id', $request->user()->id)
            ->where('course_id', $courseId)
            ->firstOrFail();

        $enrollment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Te has desinscrito del curso correctamente',
        ]);
    }
}
