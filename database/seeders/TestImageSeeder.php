<?php

namespace Database\Seeders;

use App\Models\Course;
use Illuminate\Database\Seeder;

class TestImageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Imagen de prueba de Unsplash - Circuitos eléctricos
        $testImageUrl = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=300&fit=crop';

        // Asignamos a los primeros 3 cursos como prueba
        $courses = Course::whereIn('id', [1, 2, 3])->get();

        foreach ($courses as $course) {
            $course->update([
                'image_url' => $testImageUrl
            ]);
            $this->command->info("Imagen asignada a: {$course->name}");
        }
    }
}
