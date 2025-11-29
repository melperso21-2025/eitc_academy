<?php

namespace App\Console\Commands;

use App\Models\Course;
use Illuminate\Console\Command;

class GenerateCourseImages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'courses:generate-images';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generar imágenes de prueba para los cursos';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $courses = Course::all();
        $courseDir = public_path('images/courses');

        // Crear directorio si no existe
        if (!is_dir($courseDir)) {
            mkdir($courseDir, 0755, true);
        }

        foreach ($courses as $course) {
            $filename = 'course_' . $course->id . '.jpg';
            $filepath = $courseDir . '/' . $filename;

            // Generar imagen
            $image = imagecreatetruecolor(640, 480);

            // Colores RGB
            $primary = imagecolorallocate($image, 0, 58, 93); // #003A5D
            $accent = imagecolorallocate($image, 11, 191, 120); // #0BBF78
            $white = imagecolorallocate($image, 255, 255, 255);
            $dark = imagecolorallocate($image, 26, 26, 26); // #1A1A1A

            // Fondo degradado (simulado)
            for ($i = 0; $i < 480; $i++) {
                $ratio = $i / 480;
                $r = (int)(0 + ($ratio * 50));
                $g = (int)(58 + ($ratio * 50));
                $b = (int)(93 + ($ratio * 80));
                $color = imagecolorallocate($image, $r, $g, $b);
                imageline($image, 0, $i, 640, $i, $color);
            }

            // Título del curso
            $font = 5;
            $title = substr($course->name, 0, 35);
            
            // Centrar texto verticalmente
            $textBox = imagettfbbox(12, 0, __DIR__ . '/../../resources/fonts/arial.ttf', $title);
            $textWidth = $textBox[2] - $textBox[0];
            $x = (640 - $textWidth) / 2;
            $y = 200;

            imagestring($image, $font, $x, $y, $title, $white);

            // Nivel
            $level = '📚 ' . strtoupper($course->level);
            imagestring($image, 3, 20, 50, $level, $accent);

            // Precio
            $price = 'S/. ' . $course->price;
            imagestring($image, 3, 500, 50, $price, $accent);

            // Duración
            $duration = $course->duration_hours . ' horas';
            imagestring($image, 2, 20, 400, $duration, $white);

            // Guardar imagen
            imagejpeg($image, $filepath, 90);
            imagedestroy($image);

            $this->info("✓ Imagen generada: $filename");
        }

        $this->info("\n✅ ¡Todas las imágenes fueron generadas en public/images/courses/!");
    }
}
