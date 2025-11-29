<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Course;
use Illuminate\Database\Seeder;

class CourseSeeder extends Seeder
{
    public function run(): void
    {
        // Obtener categorías
        $energiaElectrica = Category::where('slug', 'energia-electrica')->first();
        $procesosIndustriales = Category::where('slug', 'procesos-industriales')->first();

        // CATEGORÍA: ENERGÍA ELÉCTRICA
        // 1. Termografía
        Course::create([
            'category_id' => $energiaElectrica->id,
            'name' => 'Termografía Infrarroja Avanzada',
            'slug' => 'termografia-infrarroja',
            'description' => 'Curso especializado en inspección termográfica de equipos eléctricos, análisis de anomalías térmicas y diagnóstico predictivo de fallas en sistemas de distribución.',
            'price' => 199.99,
            'modality' => 'hibrido',
            'level' => 'intermedio',
            'certificate' => 'Certificación EITC - Termografía Nivel Intermedio',
            'duration_hours' => 40,
            'syllabus' => '1. Fundamentos de termografía. 2. Equipos y cámaras termográficas. 3. Inspección de subestaciones. 4. Análisis de resultados. 5. Normativas internacionales.',
            'is_published' => true,
        ]);

        // 2. Pruebas eléctricas
        Course::create([
            'category_id' => $energiaElectrica->id,
            'name' => 'Pruebas Eléctricas: BLF, Tangente Delta y Descargas Parciales',
            'slug' => 'pruebas-electricas-blf',
            'description' => 'Domina las pruebas dieléctricas fundamentales. Análisis de Breaking Load Factor, medición de factor de potencia y detección de descargas parciales en transformadores y cables de alto voltaje.',
            'price' => 249.99,
            'modality' => 'virtual',
            'level' => 'avanzado',
            'certificate' => 'Certificación Internacional en Pruebas Dieléctricas',
            'duration_hours' => 50,
            'syllabus' => '1. Teoría de pruebas dieléctricas. 2. Equipamiento especializado. 3. Procedimientos BLF. 4. Medición de Tangente Delta. 5. Detección de descargas parciales.',
            'is_published' => true,
        ]);

        // 3. Puntas terminales
        Course::create([
            'category_id' => $energiaElectrica->id,
            'name' => 'Elaboración y Prueba de Puntas Terminales',
            'slug' => 'puntas-terminales',
            'description' => 'Aprende los procesos de fabricación, instalación y prueba de conectores de potencia. Normativas técnicas y aseguramiento de calidad en terminaciones.',
            'price' => 149.99,
            'modality' => 'presencial',
            'level' => 'basico',
            'certificate' => 'Certificado EITC - Técnico en Terminaciones',
            'duration_hours' => 30,
            'syllabus' => '1. Tipos de puntas y conectores. 2. Procesos de crimping. 3. Soldadura y fusión. 4. Pruebas de resistencia. 5. Control de calidad.',
            'is_published' => true,
        ]);

        // 4. Puesta a tierra
        Course::create([
            'category_id' => $energiaElectrica->id,
            'name' => 'Sistemas de Puesta a Tierra - Diseño e Implementación',
            'slug' => 'sistemas-puesta-tierra',
            'description' => 'Diseño y ejecución de sistemas de aterrizamiento seguros. Medición de resistencia, selección de conductores y cumplimiento de normativas internacionales.',
            'price' => 179.99,
            'modality' => 'hibrido',
            'level' => 'intermedio',
            'certificate' => 'Certificación en Sistemas de Puesta a Tierra',
            'duration_hours' => 35,
            'syllabus' => '1. Conceptos fundamentales. 2. Medición de resistividad del suelo. 3. Diseño de mallas de tierra. 4. Equipos de medición. 5. Normativas IEC.',
            'is_published' => true,
        ]);

        // 5. Protecciones eléctricas
        Course::create([
            'category_id' => $energiaElectrica->id,
            'name' => 'Protecciones Eléctricas y Coordinación de Sistemas',
            'slug' => 'protecciones-electricas',
            'description' => 'Estudio integral de relés de protección, coordinación de esquemas y operación de sistemas de distribución. Análisis de fallas y cálculo de cortocircuitos.',
            'price' => 229.99,
            'modality' => 'virtual',
            'level' => 'avanzado',
            'certificate' => 'Certificación en Coordinación de Protecciones',
            'duration_hours' => 45,
            'syllabus' => '1. Tipos de protecciones. 2. Cálculo de cortocircuitos. 3. Selectividad. 4. Software de coordinación. 5. Normativas técnicas.',
            'is_published' => true,
        ]);

        // 6. Generadores eléctricos
        Course::create([
            'category_id' => $energiaElectrica->id,
            'name' => 'Mantenimiento Predictivo de Generadores Eléctricos',
            'slug' => 'mantenimiento-generadores',
            'description' => 'Técnicas avanzadas de monitoreo y mantenimiento predictivo. Análisis de vibraciones, termografía y pruebas de aislamiento en generadores sincronos.',
            'price' => 199.99,
            'modality' => 'hibrido',
            'level' => 'intermedio',
            'certificate' => 'Certificado de Especialista en Generadores',
            'duration_hours' => 40,
            'syllabus' => '1. Componentes de generadores. 2. Análisis de vibraciones. 3. Pruebas de aislamiento. 4. Mantenimiento preventivo. 5. Casos de estudio.',
            'is_published' => true,
        ]);

        // 7. DIALux EVO
        Course::create([
            'category_id' => $energiaElectrica->id,
            'name' => 'DIALux EVO - Diseño de Iluminación Profesional',
            'slug' => 'dialux-evo',
            'description' => 'Domina el software líder en diseño de sistemas de iluminación. Cálculo fotométrico, simulación 3D y optimización energética de proyectos.',
            'price' => 159.99,
            'modality' => 'virtual',
            'level' => 'basico',
            'certificate' => 'Certificado EITC - DIALux EVO',
            'duration_hours' => 25,
            'syllabus' => '1. Interfaz de DIALux EVO. 2. Modelado 3D. 3. Cálculos fotométricos. 4. Reportes técnicos. 5. Optimización de costos.',
            'is_published' => true,
        ]);

        // 8. Drones industriales
        Course::create([
            'category_id' => $energiaElectrica->id,
            'name' => 'Drones para Inspección de Infraestructura Eléctrica',
            'slug' => 'drones-inspeccion',
            'description' => 'Operación y aplicaciones de drones en inspección de torres, líneas de transmisión y subestaciones. Normativas aeronáuticas y seguridad operacional.',
            'price' => 279.99,
            'modality' => 'presencial',
            'level' => 'avanzado',
            'certificate' => 'Licencia Operador de Drones - EITC Academy',
            'duration_hours' => 60,
            'syllabus' => '1. Regulación aeronáutica. 2. Operación de drones. 3. Cámaras termográficas. 4. Planificación de vuelos. 5. Casos prácticos.',
            'is_published' => true,
        ]);

        // CATEGORÍA: PROCESOS INDUSTRIALES
        // 9. Refrigeración industrial
        Course::create([
            'category_id' => $procesosIndustriales->id,
            'name' => 'Refrigeración Industrial - Sistemas y Mantenimiento',
            'slug' => 'refrigeracion-industrial',
            'description' => 'Análisis de ciclos termodinámicos, selección de refrigerantes y mantenimiento de sistemas de refrigeración. Eficiencia energética y cumplimiento normativo.',
            'price' => 189.99,
            'modality' => 'hibrido',
            'level' => 'intermedio',
            'certificate' => 'Certificado en Sistemas de Refrigeración',
            'duration_hours' => 38,
            'syllabus' => '1. Ciclo de refrigeración. 2. Compresores y evaporadores. 3. Refrigerantes ecológicos. 4. Diagnóstico de fallas. 5. Normativas ambientales.',
            'is_published' => true,
        ]);

        // 10. Calderas
        Course::create([
            'category_id' => $procesosIndustriales->id,
            'name' => 'Operación y Mantenimiento de Calderas Industriales',
            'slug' => 'calderas-industriales',
            'description' => 'Formación integral en calderas de vapor y agua caliente. Operación segura, mantenimiento preventivo y normativas de seguridad industrial.',
            'price' => 219.99,
            'modality' => 'presencial',
            'level' => 'basico',
            'certificate' => 'Certificado de Operador de Calderas',
            'duration_hours' => 45,
            'syllabus' => '1. Tipos de calderas. 2. Ciclo del agua y vapor. 3. Tuning de quemadores. 4. Tratamiento de agua. 5. Seguridad operacional.',
            'is_published' => true,
        ]);

        // 11. ArcGIS con Python
        Course::create([
            'category_id' => $procesosIndustriales->id,
            'name' => 'ArcGIS con Python - Automatización Geoespacial',
            'slug' => 'arcgis-python',
            'description' => 'Integración de Python con ArcGIS para automatización de análisis geoespacial. Scripting avanzado para proyectos industriales y mapeo de recursos.',
            'price' => 239.99,
            'modality' => 'virtual',
            'level' => 'avanzado',
            'certificate' => 'Certificación ArcGIS + Python - EITC Academy',
            'duration_hours' => 55,
            'syllabus' => '1. Introducción a ArcGIS. 2. Python para GIS. 3. Geoprocesamiento. 4. Análisis espacial. 5. Proyectos reales.',
            'is_published' => true,
        ]);

        // 12. Costos industriales
        Course::create([
            'category_id' => $procesosIndustriales->id,
            'name' => 'Análisis de Costos Industriales y Presupuestación',
            'slug' => 'costos-industriales',
            'description' => 'Metodología para estimación de costos en proyectos industriales. Presupuestación, análisis de rentabilidad y optimización de recursos.',
            'price' => 169.99,
            'modality' => 'virtual',
            'level' => 'basico',
            'certificate' => 'Certificado en Gestión de Costos',
            'duration_hours' => 30,
            'syllabus' => '1. Estructura de costos. 2. Presupuestación. 3. Flujo de caja. 4. ROI. 5. Simulación de escenarios.',
            'is_published' => true,
        ]);

        // 13. ARES (Simulación de transitorios)
        Course::create([
            'category_id' => $procesosIndustriales->id,
            'name' => 'ARES - Simulación de Transitorios Electromagnéticos',
            'slug' => 'ares-simulacion',
            'description' => 'Software ARES para análisis de transitorios en sistemas de potencia. Modelado de componentes y análisis de perturbaciones.',
            'price' => 259.99,
            'modality' => 'virtual',
            'level' => 'avanzado',
            'certificate' => 'Certificación ARES - Simulación Avanzada',
            'duration_hours' => 50,
            'syllabus' => '1. Interfaz de ARES. 2. Modelado de líneas. 3. Transformadores. 4. Protecciones. 5. Análisis de resultados.',
            'is_published' => true,
        ]);

        // 14. Mantenimiento industrial
        Course::create([
            'category_id' => $procesosIndustriales->id,
            'name' => 'Mantenimiento Predictivo e Inspecciones Técnicas',
            'slug' => 'mantenimiento-predictivo',
            'description' => 'Técnicas de monitoreo de máquinas, análisis de vibraciones y termografía. Implementación de estrategias predictivas en industria.',
            'price' => 199.99,
            'modality' => 'hibrido',
            'level' => 'intermedio',
            'certificate' => 'Certificado de Especialista en Mantenimiento',
            'duration_hours' => 42,
            'syllabus' => '1. Técnicas de monitoreo. 2. Análisis de vibraciones. 3. Termografía industrial. 4. Bases de datos. 5. Optimización.',
            'is_published' => true,
        ]);
    }
}
