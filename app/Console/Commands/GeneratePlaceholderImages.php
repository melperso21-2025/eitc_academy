<?php

namespace App\Console\Commands;

use App\Models\Course;
use Illuminate\Console\Command;

class GeneratePlaceholderImages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'courses:generate-placeholders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Asignar URLs de imágenes placeholder a los cursos';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Colores diferentes para cada curso
        $colors = [
            'FF6B6B', '4ECDC4', '45B7D1', 'FFA07A', '98D8C8',
            'F7DC6F', 'BB8FCE', '85C1E2', 'F8B88B', 'A8E6CF',
            'FFD3B6', 'FFAAA5', 'FF8B94', 'A8D8EA', 'AA96DA',
        ];

        $courses = Course::all();
        $index = 0;

        foreach ($courses as $course) {
            $color = $colors[$index % count($colors)];
            $text = urlencode(substr($course->name, 0, 25));
            
            // URL de placeholder con imagen
            $placeholderUrl = "https://via.placeholder.com/640x480/{$color}/FFFFFF?text={$text}";
            
            $course->update(['image_url' => $placeholderUrl]);
            
            $this->info("✓ {$course->name} -> {$color}");
            $index++;
        }

        $this->info("\n✅ ¡Imágenes placeholder asignadas a todos los cursos!");
    }
}
