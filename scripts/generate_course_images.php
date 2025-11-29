<?php

use Illuminate\Support\Facades\DB;
use Intervention\Image\Facades\Image;

// Este script genera imágenes para los cursos
// Ejecutar: php artisan tinker < scripts/generate_course_images.php

$courses = DB::table('courses')->get();

foreach ($courses as $course) {
    // Crear imagen simple con el nombre del curso
    $filename = 'course_' . $course->id . '.jpg';
    $filepath = public_path('images/courses/' . $filename);
    
    // Crear directorio si no existe
    if (!is_dir(public_path('images/courses'))) {
        mkdir(public_path('images/courses'), 0755, true);
    }
    
    // Generar imagen con GD
    $image = imagecreatetruecolor(640, 480);
    
    // Colores
    $primary = imagecolorallocate($image, 0, 58, 93); // #003A5D
    $accent = imagecolorallocate($image, 11, 191, 120); // #0BBF78
    $white = imagecolorallocate($image, 255, 255, 255);
    
    // Fondo gradiente (simulado con rectángulos)
    for ($i = 0; $i < 480; $i++) {
        $color = imagecolorallocate($image, (int)(0 + ($i/480)*50), (int)(58 + ($i/480)*50), (int)(93 + ($i/480)*80));
        imageline($image, 0, $i, 640, $i, $color);
    }
    
    // Texto del curso
    $font = 5; // Fuente predefinida
    $text = substr($course->name, 0, 30);
    $textColor = $white;
    
    // Centrar texto
    $textWidth = strlen($text) * imagefontwidth($font);
    $x = (640 - $textWidth) / 2;
    $y = 200;
    
    imagestring($image, $font, $x, $y, $text, $textColor);
    
    // Nivel y precio
    $level = strtoupper($course->level);
    $price = 'S/. ' . $course->price;
    
    imagestring($image, 3, 20, 50, $level, $accent);
    imagestring($image, 3, 20, 400, $price, $accent);
    
    // Guardar imagen
    imagejpeg($image, $filepath, 90);
    imagedestroy($image);
    
    echo "Imagen generada: $filename\n";
}

echo "¡Todas las imágenes fueron generadas!\n";
