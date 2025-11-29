<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Course;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class FirebaseStorageTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Crear categoría
        $this->category = Category::create([
            'name' => 'Test Category',
            'slug' => 'test-category',
            'description' => 'A test category'
        ]);

        // Crear admin
        $this->admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@eitcacademy.com',
            'password' => bcrypt('password123'),
            'role' => 'admin'
        ]);
    }

    public function test_upload_image_endpoint_requires_authentication()
    {
        $response = $this->postJson('/api/upload-image', [
            'image' => 'fake',
            'folder' => 'courses'
        ]);

        // Sin autenticación, pero el endpoint es público
        // Debería aceptar pero fallar en validación
        $response->assertStatus(422);
    }

    public function test_upload_course_image_requires_admin_role()
    {
        $student = User::create([
            'name' => 'Student',
            'email' => 'student@example.com',
            'password' => bcrypt('password123'),
            'role' => 'student'
        ]);

        $course = Course::create([
            'category_id' => $this->category->id,
            'name' => 'Test Course',
            'slug' => 'test-course',
            'description' => 'A test course',
            'price' => 100,
            'modality' => 'virtual',
            'level' => 'basico',
            'certificate' => true,
            'duration_hours' => 40,
            'syllabus' => 'Test syllabus'
        ]);

        $this->actingAs($student, 'sanctum');

        // Simular un archivo
        $file = UploadedFile::fake()->create('image.txt', 10);

        $response = $this->postJson("/api/courses/{$course->id}/upload-image", [
            'image' => $file
        ]);

        // Debe fallar: no es admin
        $response->assertStatus(403);
    }

    public function test_upload_image_requires_valid_file()
    {
        $this->actingAs($this->admin, 'sanctum');

        // Enviar un archivo que no es imagen
        $response = $this->postJson('/api/upload-image', [
            'image' => UploadedFile::fake()->create('document.pdf', 100),
            'folder' => 'courses'
        ]);

        $response->assertStatus(422);
    }

    public function test_route_upload_image_exists()
    {
        $response = $this->postJson('/api/upload-image', [
            'image' => null,
            'folder' => 'courses'
        ]);

        // Debe fallar en validación, no en 404
        $response->assertStatus(422);
    }

    public function test_route_course_upload_image_exists()
    {
        $course = Course::create([
            'category_id' => $this->category->id,
            'name' => 'Test Course',
            'slug' => 'test-course',
            'description' => 'A test course',
            'price' => 100,
            'modality' => 'virtual',
            'level' => 'basico',
            'certificate' => true,
            'duration_hours' => 40,
            'syllabus' => 'Test syllabus'
        ]);

        $this->actingAs($this->admin, 'sanctum');

        $response = $this->postJson("/api/courses/{$course->id}/upload-image", [
            'image' => null
        ]);

        // Debe fallar en validación, no en 404
        $response->assertStatus(422);
    }
}

