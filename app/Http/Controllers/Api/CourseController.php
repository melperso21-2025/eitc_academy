<?php

namespace App\Http\Controllers\Api;

use App\Models\Course;
use App\Models\Category;
use App\Services\FirebaseStorageService;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class CourseController extends Controller
{
    protected $firebaseService;

    /**
     * Inyectar el servicio de Firebase
     */
    public function __construct(FirebaseStorageService $firebaseService)
    {
        $this->firebaseService = $firebaseService;
    }
    /**
     * GET /api/courses
     * Listar todos los cursos con filtros
     * Filtros: category, level, modality, min_price, max_price, search
     */
    public function index(Request $request)
    {
        $query = Course::with('category')
            ->withCount('comments');

        $favoriteCourseMap = [];
        $authenticatedUser = auth('sanctum')->user();
        if ($authenticatedUser) {
            $favoriteCourseMap = array_fill_keys(
                $authenticatedUser
                    ->favorites()
                    ->pluck('course_id')
                    ->all(),
                true
            );
        }

        // Filtrar por categoría
        if ($request->has('category')) {
            $query->whereHas('category', fn($q) => 
                $q->where('slug', $request->category)
            );
        }

        // Filtrar por nivel
        if ($request->has('level')) {
            $query->where('level', $request->level);
        }

        // Filtrar por modalidad
        if ($request->has('modality')) {
            $query->where('modality', $request->modality);
        }

        // Filtrar por rango de precio
        if ($request->has('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }

        if ($request->has('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        // Buscar por nombre o descripción
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('description', 'LIKE', "%{$search}%");
            });
        }

        $isAdmin = auth('sanctum')->check() && auth('sanctum')->user()->role === 'admin';

        // Solo mostrar cursos publicados para usuarios regulares
        if (!$isAdmin) {
            $query->where('is_published', true);
        }

        if ($isAdmin) {
            $courses = $query->orderByDesc('created_at')->get();

            $courses->transform(function ($course) use ($favoriteCourseMap) {
                $course->setAttribute('is_favorite', isset($favoriteCourseMap[$course->id]));
                return $course;
            });

            return response()->json([
                'success' => true,
                'data' => $courses,
            ]);
        }

        $perPage = (int) $request->input('per_page', 10);
        if ($perPage <= 0) {
            $perPage = 10;
        }

        $courses = $query->paginate($perPage);
        $courses->getCollection()->transform(function ($course) use ($favoriteCourseMap) {
            $course->setAttribute('is_favorite', isset($favoriteCourseMap[$course->id]));
            return $course;
        });

        return response()->json([
            'success' => true,
            'data' => $courses,
        ]);
    }

    /**
     * GET /api/courses/{id}
     * Ver detalle de un curso
     */
    public function show(Course $course)
    {
        // Verificar que esté publicado (o sea admin)
        if (!$course->is_published && (!auth('sanctum')->check() || auth('sanctum')->user()->role !== 'admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Curso no encontrado',
            ], 404);
        }

        $course->load('category', 'comments.user', 'enrollments');

        // Si el usuario está autenticado, indicar si es favorito
        $isFavorite = false;
        $isEnrolled = false;

        if (auth('sanctum')->check()) {
            $user = auth('sanctum')->user();
            $isFavorite = $course->isFavoritedBy($user->id);
            $isEnrolled = $course->enrolledUsers()->where('user_id', $user->id)->exists();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $course->id,
                'name' => $course->name,
                'slug' => $course->slug,
                'category_id' => $course->category_id,
                'description' => $course->description,
                'price' => $course->price,
                'discount_amount' => $course->discount_amount,
                'discount_percent' => $course->discount_percent,
                'image_url' => $course->image_url,
                'modality' => $course->modality,
                'level' => $course->level,
                'certificate' => $course->certificate,
                'duration_hours' => $course->duration_hours,
                'syllabus' => $course->syllabus,
                'is_published' => $course->is_published,
                'category' => $course->category,
                'comments_count' => $course->comments->count(),
                'enrolled_count' => $course->enrollments->count(),
                'is_favorite' => $isFavorite,
                'is_enrolled' => $isEnrolled,
            ],
        ]);
    }

    /**
     * POST /api/courses
     * Crear nuevo curso (solo admin)
     */
    public function store(Request $request)
    {
        // Verificar que sea admin
        if (!auth('sanctum')->check() || auth('sanctum')->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'No autorizado',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255|unique:courses',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'modality' => 'required|in:virtual,presencial,hibrido',
            'level' => 'required|in:basico,intermedio,avanzado',
            'certificate' => 'nullable|string',
            'duration_hours' => 'required|integer|min:1',
            'syllabus' => 'nullable|string',
            'discount_amount' => 'nullable|numeric|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120', // 5MB máximo
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        $discountAmount = array_key_exists('discount_amount', $validated)
            ? ($validated['discount_amount'] !== null ? (float) $validated['discount_amount'] : null)
            : null;

        if ($discountAmount !== null && $discountAmount > (float) $validated['price']) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => [
                    'discount_amount' => ['El descuento no puede ser mayor al precio.'],
                ],
            ], 422);
        }

        if ($discountAmount !== null && $discountAmount > 0) {
            $validated['discount_amount'] = $discountAmount;
            $validated['discount_percent'] = round(($discountAmount / (float) $validated['price']) * 100, 2);
        } else {
            $validated['discount_amount'] = null;
            $validated['discount_percent'] = null;
        }

        // Generar slug automáticamente
        $validated['slug'] = Str::slug($validated['name']);

        // Manejar upload de imagen si existe
        $imageUrl = null;
        if ($request->hasFile('image')) {
            $uploadResult = $this->firebaseService->uploadImage($request->file('image'), 'courses');
            
            if (!$uploadResult['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al subir la imagen: ' . $uploadResult['message'],
                ], 422);
            }

            $imageUrl = $uploadResult['url'];
            $validated['image_url'] = $imageUrl;
        }

        $course = Course::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Curso creado correctamente',
            'data' => $course,
        ], 201);
    }

    /**
     * PUT /api/courses/{id}
     * Editar curso (solo admin)
     */
    public function update(Request $request, Course $course)
    {
        // Verificar que sea admin
        if (!auth('sanctum')->check() || auth('sanctum')->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'No autorizado',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'category_id' => 'nullable|exists:categories,id',
            'name' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('courses', 'name')->ignore($course->id),
            ],
            'description' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'modality' => 'nullable|in:virtual,presencial,hibrido',
            'level' => 'nullable|in:basico,intermedio,avanzado',
            'certificate' => 'nullable|string',
            'duration_hours' => 'nullable|integer|min:1',
            'syllabus' => 'nullable|string',
            'is_published' => 'nullable|boolean',
            'discount_amount' => 'nullable|numeric|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120', // 5MB máximo
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        if ($request->has('discount_amount')) {
            $priceBase = array_key_exists('price', $validated)
                ? (float) $validated['price']
                : (float) $course->price;

            $discountAmountInput = $request->input('discount_amount');
            $discountAmount = ($discountAmountInput === null || $discountAmountInput === '')
                ? null
                : (float) $discountAmountInput;

            if ($discountAmount !== null && $discountAmount > $priceBase) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => [
                        'discount_amount' => ['El descuento no puede ser mayor al precio.'],
                    ],
                ], 422);
            }

            if ($discountAmount !== null && $discountAmount > 0) {
                $validated['discount_amount'] = $discountAmount;
                $validated['discount_percent'] = round(($discountAmount / $priceBase) * 100, 2);
            } else {
                $validated['discount_amount'] = null;
                $validated['discount_percent'] = null;
            }
        }

        // Actualizar slug si el nombre cambió
        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        // Manejar cambio de imagen
        if ($request->hasFile('image')) {
            // Eliminar imagen anterior si existe
            if ($course->image_url) {
                $oldPath = $this->extractPathFromUrl($course->image_url);
                if ($oldPath) {
                    $this->firebaseService->deleteFile($oldPath);
                }
            }

            // Subir nueva imagen
            $uploadResult = $this->firebaseService->uploadImage($request->file('image'), 'courses');
            
            if (!$uploadResult['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al subir la imagen: ' . $uploadResult['message'],
                ], 422);
            }

            $validated['image_url'] = $uploadResult['url'];
        }

        $course->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Curso actualizado correctamente',
            'data' => $course,
        ]);
    }

    /**
     * Extraer el path de Firebase desde una URL
     * URL: https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Fto%2Ffile?alt=media
     * Retorna: path/to/file
     */
    private function extractPathFromUrl($url)
    {
        try {
            // Decodificar URL
            preg_match('/\/o\/(.+)\?/', $url, $matches);
            if ($matches && isset($matches[1])) {
                return urldecode($matches[1]);
            }
        } catch (\Exception $e) {
            logger()->error('Error extracting path from URL: ' . $e->getMessage());
        }
        
        return null;
    }

    /**
     * DELETE /api/courses/{id}
     * Eliminar curso (solo admin)
     */
    public function destroy(Course $course)
    {
        // Verificar que sea admin
        if (!auth('sanctum')->check() || auth('sanctum')->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'No autorizado',
            ], 403);
        }

        $course->delete();

        return response()->json([
            'success' => true,
            'message' => 'Curso eliminado correctamente',
        ]);
    }
}
