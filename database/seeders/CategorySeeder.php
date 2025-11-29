<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        Category::create([
            'name' => 'Energía Eléctrica',
            'slug' => 'energia-electrica',
            'description' => 'Cursos especializados en sistemas eléctricos, protecciones y diagnóstico de equipos de potencia.',
        ]);

        Category::create([
            'name' => 'Procesos Industriales',
            'slug' => 'procesos-industriales',
            'description' => 'Formación en optimización de procesos industriales, calderas, refrigeración y mantenimiento.',
        ]);
    }
}
