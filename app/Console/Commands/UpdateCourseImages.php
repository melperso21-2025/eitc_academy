<?php

namespace App\Console\Commands;

use App\Models\Course;
use Illuminate\Console\Command;

class UpdateCourseImages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'courses:update-images {--file=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Actualizar URLs de imágenes de cursos desde Firebase Storage';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🖼️ Actualizando imágenes de cursos desde Firebase...');
        
        // Mapeo de curso ID a URL de imagen Firebase
        $images = [
            1 => 'https://firebasestorage.googleapis.com/v0/b/your-project.appspot.com/o/courses%2F01-termografia.jpg?alt=media',
            2 => 'https://firebasestorage.googleapis.com/v0/b/your-project.appspot.com/o/courses%2F02-pruebas-electricas.jpg?alt=media',
            3 => 'https://firebasestorage.googleapis.com/v0/b/your-project.appspot.com/o/courses%2F03-puntas-terminales.jpg?alt=media',
            4 => 'https://firebasestorage.googleapis.com/v0/b/your-project.appspot.com/o/courses%2F04-puesta-tierra.jpg?alt=media',
            5 => 'https://firebasestorage.googleapis.com/v0/b/your-project.appspot.com/o/courses%2F05-protecciones.jpg?alt=media',
            6 => 'https://firebasestorage.googleapis.com/v0/b/your-project.appspot.com/o/courses%2F06-generadores.jpg?alt=media',
            7 => 'https://firebasestorage.googleapis.com/v0/b/your-project.appspot.com/o/courses%2F07-dialux.jpg?alt=media',
            8 => 'https://firebasestorage.googleapis.com/v0/b/your-project.appspot.com/o/courses%2F08-drones.jpg?alt=media',
            9 => 'https://firebasestorage.googleapis.com/v0/b/your-project.appspot.com/o/courses%2F09-refrigeracion.jpg?alt=media',
            10 => 'https://firebasestorage.googleapis.com/v0/b/your-project.appspot.com/o/courses%2F10-calderas.jpg?alt=media',
            11 => 'https://firebasestorage.googleapis.com/v0/b/your-project.appspot.com/o/courses%2F11-arcgis.jpg?alt=media',
            12 => 'https://firebasestorage.googleapis.com/v0/b/your-project.appspot.com/o/courses%2F12-costos.jpg?alt=media',
            13 => 'https://firebasestorage.googleapis.com/v0/b/your-project.appspot.com/o/courses%2F13-ares.jpg?alt=media',
            14 => 'https://firebasestorage.googleapis.com/v0/b/your-project.appspot.com/o/courses%2F14-mantenimiento.jpg?alt=media',
        ];

        $file = $this->option('file');
        if ($file && file_exists($file)) {
            $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                [$courseId, $imageUrl] = explode('|', $line);
                $images[trim($courseId)] = trim($imageUrl);
            }
        }

        $updated = 0;
        foreach ($images as $courseId => $imageUrl) {
            $course = Course::find($courseId);
            if ($course) {
                $course->update(['image_url' => $imageUrl]);
                $this->line("✓ Curso {$courseId}: {$course->name}");
                $updated++;
            }
        }

        $this->info("✅ Se actualizaron {$updated} cursos con imágenes de Firebase");
        $this->line('Instrucciones:');
        $this->line('1. Reemplaza "your-project" con tu Project ID de Firebase');
        $this->line('2. O usa: php artisan courses:update-images --file=/ruta/al/archivo.txt');
        $this->line('   Formato del archivo: courseId|imageUrl (una por línea)');
    }
}
