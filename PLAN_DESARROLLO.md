# 📋 Plan de Desarrollo EITC Academy

## 🎯 Estructura de Ramas y Commits

```
main (Producción - versiones estables)
  └── desarrollo (Rama principal de desarrollo)
      ├── feature/auth (Autenticación)
      ├── feature/courses (Cursos CRUD)
      ├── feature/favorites (Favoritos)
      ├── feature/comments (Comentarios)
      ├── feature/firebase (Firebase Storage)
      ├── feature/currency-api (API de Monedas)
      └── feature/frontend (Frontend HTML/Tailwind/JS)
```

---

## 📦 FASE 1: Fundamentos (Base de Datos y Estructura)

### 1.1 Migraciones y Modelos
**Rama:** `desarrollo`
**Commits:**
1. `feat: crear migraciones de tablas base (users, courses, categories)`
2. `feat: crear migraciones de tablas relacionales (favorites, comments, enrollments)`
3. `feat: crear modelos User, Course, Category, Favorite, Comment, Enrollment`

**Modelos a crear:**
- `User` (ya existe, necesita actualización)
- `Course` (nuevo)
- `Category` (nuevo)
- `Favorite` (nuevo)
- `Comment` (nuevo)
- `Enrollment` (nuevo - para registros en cursos)

---

## 🔐 FASE 2: Autenticación

**Rama:** `feature/auth` (desde `desarrollo`)
**Commits:**
1. `feat: instalar Laravel Sanctum para autenticación API`
2. `feat: crear endpoints de autenticación (register, login, logout)`
3. `feat: crear middleware de protección de rutas`
4. `test: validar autenticación`

---

## 📚 FASE 3: CRUD de Cursos

**Rama:** `feature/courses` (desde `desarrollo`)
**Commits:**
1. `feat: crear CourseController con métodos index, show, store, update, destroy`
2. `feat: crear CategoryController`
3. `feat: crear seeders con cursos de ejemplo`
4. `feat: validaciones en Store/Update de cursos`

---

## ❤️ FASE 4: Favoritos

**Rama:** `feature/favorites` (desde `desarrollo`)
**Commits:**
1. `feat: crear FavoriteController y rutas`
2. `feat: agregar lógica de toggle favorito`
3. `feat: crear endpoint para listar favoritos del usuario`

---

## 💬 FASE 5: Comentarios

**Rama:** `feature/comments` (desde `desarrollo`)
**Commits:**
1. `feat: crear CommentController`
2. `feat: agregar validación de máximo 200 caracteres`
3. `feat: listar comentarios por curso`

---

## 🔥 FASE 6: Firebase Storage

**Rama:** `feature/firebase` (desde `desarrollo`)
**Commits:**
1. `feat: instalar paquete Firebase Admin SDK`
2. `feat: configurar credenciales Firebase en .env`
3. `feat: crear servicio para subida de imágenes a Firebase`
4. `feat: integrar subida de imágenes en Course Store/Update`

---

## 💱 FASE 7: API Externa (Monedas)

**Rama:** `feature/currency-api` (desde `desarrollo`)
**Commits:**
1. `feat: crear servicio para consumir API de monedas (exchangerate-api.com)`
2. `feat: crear endpoint /api/exchange para obtener tasas`
3. `feat: agregar caché de 1 hora para las tasas`

---

## 🎨 FASE 8: Frontend

**Rama:** `feature/frontend` (desde `desarrollo`)
**Commits:**
1. `feat: setup Tailwind CSS y estructura base HTML`
2. `feat: crear layout base con navbar y footer`
3. `feat: página de login y registro`
4. `feat: catálogo de cursos con filtros`
5. `feat: detalle de curso con comentarios y favoritos`
6. `feat: panel de cursos favoritos`
7. `feat: integración de API de monedas en interfaz`
8. `feat: panel admin (solo para administradores)`

---

## 🚀 FASE 9: Integración y Deploy

**Rama:** `desarrollo`
**Commits:**
1. `merge: integrar feature/auth a desarrollo`
2. `merge: integrar feature/courses a desarrollo`
3. `merge: integrar feature/favorites a desarrollo`
4. `merge: integrar feature/comments a desarrollo`
5. `merge: integrar feature/firebase a desarrollo`
6. `merge: integrar feature/currency-api a desarrollo`
7. `merge: integrar feature/frontend a desarrollo`
8. `release: v1.0.0 - merge desarrollo a main`

---

## 📝 Convención de Commits

```
<tipo>(<scope>): <descripción>

Tipos:
- feat: Nueva funcionalidad
- fix: Corrección de bug
- refactor: Cambio sin funcionalidad nueva
- test: Agregar o modificar tests
- docs: Cambios en documentación
- chore: Cambios en configuración

Scope (opcional):
- auth, courses, favorites, comments, firebase, etc.

Ejemplos:
✅ feat(auth): crear endpoint de registro
✅ fix(courses): corregir validación de precio
✅ refactor(models): simplificar relaciones
```

---

## 🔄 Flujo de Trabajo

1. Estás en `main` → `git checkout -b desarrollo`
2. Desde `desarrollo` → crear ramas feature: `git checkout -b feature/auth`
3. Hacer cambios y commits pequeños
4. Push a la rama feature
5. Pull Request (PR) desde feature → desarrollo
6. Merge y eliminar rama feature
7. Cuando todo esté listo: PR desde desarrollo → main (Release)

---

## ⚡ Paso 1 (HOY): Migraciones y Modelos

Vamos a:
1. Crear migraciones para: `courses`, `categories`, `favorites`, `comments`, `enrollments`
2. Crear modelos correspondientes
3. Definir relaciones
4. Hacer commit: `feat: crear estructura base de modelos y migraciones`

¿Listo? Comenzamos con las migraciones.
