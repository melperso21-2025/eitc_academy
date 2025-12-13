# Guía de exposición del proyecto EITC Academy

## 1. Visión general
- Plataforma Laravel + Tailwind enfocada en catálogo de cursos industriales.
- Frontend público en `/public/*.html` consume APIs JSON protegidas con Sanctum.
- Firebase Storage gestiona imágenes de cursos y assets corporativos.

## 2. Arquitectura técnica
- **Backend (Laravel 11)**
  - Controladores bajo `app/Http/Controllers/Api` organizan recursos REST.
  - Servicios en `app/Services` encapsulan integraciones externas (Firebase, tasas de cambio).
  - Modelos Eloquent en `app/Models` representan datos y relaciones.
  - Rutas API definidas en `routes/api.php`; se usa Sanctum para autenticación tokenizada.
- **Frontend estático**
  - Páginas `public/index.html`, `quienes-somos.html`, `personal.html`, `contacto.html` con Tailwind.
  - `public/js/app.js` consume endpoints para listado de cursos, favoritos, comentarios.
- **Infraestructura externa**
  - Firebase Storage (imágenes Upload/Delete).
  - ExchangeRate API con fallback demo.

## 3. Autenticación y autorización
- Registro/Login con `POST /api/auth/register` y `POST /api/auth/login` (AuthController).
- Tokens personales via Sanctum (`user->createToken`).
- Rutas protegidas: agrupadas en `Route::middleware('auth:sanctum')`.
- Roles (`student`, `admin`) almacenados en `users.role` controlan acceso a CRUDs.
- Logout y endpoint `GET /api/auth/me` devuelven información de sesión.

## 4. Módulo de cursos
- `CourseController`
  - `index`: filtros (categoría, nivel, modalidad, rango de precio, search) y favoritos.
  - `show`: detalle con relaciones `category`, `comments`, `enrollments` y flags `is_favorite`, `is_enrolled`.
  - `store/update/destroy`: solo admin, maneja slug, descuentos y subida de imagen a Firebase.
- Modelo `Course` relaciona `Category`, `Favorite`, `Comment`, `Enrollment`.
- Migraciones definen columnas (precio, modalidad, certificado, horas, syllabus, estado `is_published`).

## 5. Comentarios y favoritos
- `CommentController`: CRUD con moderación admin; `index` público por curso.
- `FavoriteController`: toggle para marcar cursos; `GET /api/favorites` lista paginada.
- Modelos `Comment` y `Favorite` relacionan usuarios y cursos.

## 6. Inscripciones
- `EnrollmentController`: simula compra/inscripción (`store`), `index` histórico del usuario, `destroy` cancelación.
- Modelo `Enrollment` y tabla `enrollments` registran fecha (`enrolled_at`) y relacionan `users` y `courses`.

## 7. Assets corporativos
- `CompanyAssetController`: CRUD admin de logos, historia, fallback; usa `FirebaseStorageService`.
- Modelo `CompanyAsset` con campos `type`, `image_url`, `display_order`.
- Endpoint público `GET /api/company-assets` para inyectar branding dinámico en frontend.

## 8. Integración con Firebase Storage
- `FirebaseStorageService`: sube/borra archivos, simula en Windows local si se define `FIREBASE_SIMULATE_UPLOAD`.
- `ImageUploadController`: endpoints `/api/courses/{course}/upload-image` y genérico `/api/upload-image`.
- `CourseController` y `CompanyAssetController` reutilizan este servicio para mantener limpieza de archivos.

## 9. Tasas de cambio
- `ExchangeRateService`: consume API externa, cachea respuestas en tabla `exchange_rates`, fallback demo.
- `ExchangeRateController`: endpoints `index`, `show`, `convert`, `refresh` (este último solo admin).
- Usado por frontend para mostrar precios convertidos.

## 10. Relaciones clave y diagrama mental
- `User` ↔ `Course` via `enrollments` (muchos a muchos) y `favorites`.
- `Course` ↔ `Category` (uno a muchos).
- `Course` ↔ `Comment` (uno a muchos) con `Comment` ↔ `User`.
- `Course` ↔ `CompanyAsset` indirecto (imagen fallback).

## 11. Flujo de demostración sugerido
1. Empezar en frontend (`public/index.html`) mostrando catálogo, filtros y CTA de autenticación.
2. Explicar autenticación: mostrar `AuthController` y uso de tokens, navegador de rutas protegidas.
3. Presentar panel admin (postman/insomnia) para crear cursos y cómo se reflejan en frontend gracias a `CourseController` y Firebase.
4. Mostrar favoritos e inscripciones desde la perspectiva del usuario (`FavoriteController`, `EnrollmentController`).
5. Detallar cómo se gestionan comentarios y moderación.
6. Concluir con servicios externos (ExchangeRate y Firebase), destacando resiliencia (fallback demo, retries) y assets corporativos reutilizables.

## 12. Recomendaciones finales para la exposición
- Tener listo un `.env` con claves dummy y explicar el modo simulación.
- Mostrar `routes/api.php` para dar visión general de endpoints.
- Resaltar comentarios inline añadidos para explicar bloques clave.
- Preparar capturas o live demo de subida de imágenes y actualización inmediata en frontend.
