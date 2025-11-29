// Configuración de la API
const API_BASE_URL = 'http://localhost:8000/api';
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

// ============= PROTECCIÓN DE ACCESO =============
if (!authToken || !currentUser) {
    alert('Debes iniciar sesión para acceder a tu dashboard.');
    window.location.href = '/';
}

document.getElementById('userName').textContent = `Bienvenido, ${currentUser.name}`;

// ============= UTILIDADES =============
function showNotification(message, type = 'success') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    alert(message);
}

async function fetchAPI(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    };

    const finalOptions = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, finalOptions);
        
        if (!response.ok) {
            if (response.status === 401) {
                authToken = null;
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                window.location.href = '/';
            }
            const error = await response.json();
            throw new Error(error.message || `Error ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ============= TABS =============
function switchTab(tabName) {
    // Ocultar todos los tabs
    document.getElementById('tabInscripcionesContent').classList.add('hidden');
    document.getElementById('tabFavoritosContent').classList.add('hidden');
    document.getElementById('tabPerfilContent').classList.add('hidden');

    // Desactivar todos los botones
    document.getElementById('tabInscripciones').classList.remove('border-accent');
    document.getElementById('tabInscripciones').classList.add('text-gray-600', 'border-transparent');
    document.getElementById('tabFavoritos').classList.remove('border-accent');
    document.getElementById('tabFavoritos').classList.add('text-gray-600', 'border-transparent');
    document.getElementById('tabPerfil').classList.remove('border-accent');
    document.getElementById('tabPerfil').classList.add('text-gray-600', 'border-transparent');

    // Mostrar tab seleccionado
    if (tabName === 'inscripciones') {
        document.getElementById('tabInscripcionesContent').classList.remove('hidden');
        document.getElementById('tabInscripciones').classList.add('border-accent', 'text-primary');
        document.getElementById('tabInscripciones').classList.remove('text-gray-600', 'border-transparent');
        loadInscripciones();
    } else if (tabName === 'favoritos') {
        document.getElementById('tabFavoritosContent').classList.remove('hidden');
        document.getElementById('tabFavoritos').classList.add('border-accent', 'text-primary');
        document.getElementById('tabFavoritos').classList.remove('text-gray-600', 'border-transparent');
        loadFavoritos();
    } else if (tabName === 'perfil') {
        document.getElementById('tabPerfilContent').classList.remove('hidden');
        document.getElementById('tabPerfil').classList.add('border-accent', 'text-primary');
        document.getElementById('tabPerfil').classList.remove('text-gray-600', 'border-transparent');
        loadPerfil();
    }
}

// ============= CARGAR INSCRIPCIONES =============
async function loadInscripciones() {
    try {
        const response = await fetchAPI('/enrollments');
        const inscripciones = (response.data && response.data.data) || response.data || [];

        const container = document.getElementById('inscripcionesContainer');
        container.innerHTML = '';

        document.getElementById('countInscripciones').textContent = `${inscripciones.length} ${inscripciones.length === 1 ? 'curso' : 'cursos'}`;

        if (inscripciones.length === 0) {
            container.innerHTML = `
                <div class="col-span-3 text-center py-12">
                    <p class="text-gray-600 text-lg mb-4">Aún no te has inscrito en ningún curso.</p>
                    <a href="/" class="text-accent font-bold hover:underline">Explorar cursos →</a>
                </div>
            `;
            return;
        }

        inscripciones.forEach(enrollment => {
            const course = enrollment.course;
            const card = document.createElement('div');
            card.className = 'bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden';
            card.onclick = () => showCourseDetail(course);
            
            card.innerHTML = `
                <div class="h-40 bg-gradient-to-br from-primary to-blue-900 flex items-center justify-center overflow-hidden">
                    ${course.image_url ? `<img src="${course.image_url}" alt="${course.name}" class="w-full h-full object-cover">` : `<span class="text-white text-4xl">📚</span>`}
                </div>
                <div class="p-4">
                    <h3 class="font-bold text-lg text-secondary mb-2">${course.name}</h3>
                    <p class="text-gray-600 text-sm mb-3 line-clamp-2">${course.description}</p>
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-accent font-bold">S/. ${course.price}</span>
                        <span class="text-xs bg-accent text-secondary px-2 py-1 rounded font-bold">${course.level}</span>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="removirInscripcion(${course.id})" class="flex-1 px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition">
                            Desinscribirse
                        </button>
                        <button onclick="verMasInfo(${course.id})" class="flex-1 px-3 py-2 bg-primary text-white rounded text-sm hover:bg-opacity-90 transition">
                            Ver Detalles
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        showNotification('Error al cargar inscripciones: ' + error.message, 'error');
    }
}

// ============= CARGAR FAVORITOS =============
async function loadFavoritos() {
    try {
        const response = await fetchAPI('/favorites');
        const favoritos = (response.data && response.data.data) || response.data || [];

        const container = document.getElementById('favoritosContainer');
        container.innerHTML = '';

        document.getElementById('countFavoritos').textContent = `${favoritos.length} ${favoritos.length === 1 ? 'curso' : 'cursos'}`;

        if (favoritos.length === 0) {
            container.innerHTML = `
                <div class="col-span-3 text-center py-12">
                    <p class="text-gray-600 text-lg mb-4">Aún no tienes cursos favoritos.</p>
                    <a href="/" class="text-accent font-bold hover:underline">Agregar favoritos →</a>
                </div>
            `;
            return;
        }

        favoritos.forEach(favorite => {
            const course = favorite.course;
            const card = document.createElement('div');
            card.className = 'bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden';
            card.onclick = () => showCourseDetail(course);
            
            card.innerHTML = `
                <div class="h-40 bg-gradient-to-br from-primary to-blue-900 flex items-center justify-center overflow-hidden">
                    ${course.image_url ? `<img src="${course.image_url}" alt="${course.name}" class="w-full h-full object-cover">` : `<span class="text-white text-4xl">⭐</span>`}
                </div>
                <div class="p-4">
                    <h3 class="font-bold text-lg text-secondary mb-2">${course.name}</h3>
                    <p class="text-gray-600 text-sm mb-3 line-clamp-2">${course.description}</p>
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-accent font-bold">S/. ${course.price}</span>
                        <span class="text-xs bg-primary text-white px-2 py-1 rounded font-bold">${course.level}</span>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="removeFavorite(${course.id})" class="flex-1 px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition">
                            Quitar ❤️
                        </button>
                        <button onclick="verMasInfo(${course.id})" class="flex-1 px-3 py-2 bg-primary text-white rounded text-sm hover:bg-opacity-90 transition">
                            Ver Detalles
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        showNotification('Error al cargar favoritos: ' + error.message, 'error');
    }
}

// ============= CARGAR PERFIL =============
async function loadPerfil() {
    try {
        // Cargar datos del usuario
        document.getElementById('perfilNombre').textContent = currentUser.name;
        document.getElementById('perfilEmail').textContent = currentUser.email;
        document.getElementById('perfilRol').textContent = currentUser.role === 'admin' ? 'Administrador' : 'Estudiante';

        // Cargar estadísticas
        const inscripciones = await fetchAPI('/enrollments');
        const favoritos = await fetchAPI('/favorites');
        
        document.getElementById('statsInscripciones').textContent = inscripciones.data.length;
        document.getElementById('statsFavoritos').textContent = favoritos.data.length;
        
        // Contar comentarios (esta información podría venir de un endpoint específico)
        document.getElementById('statsComentarios').textContent = '0'; // Placeholder

    } catch (error) {
        showNotification('Error al cargar perfil: ' + error.message, 'error');
    }
}

// ============= MOSTRAR DETALLE DEL CURSO =============
function showCourseDetail(course) {
    const modal = document.getElementById('courseDetailModal');
    const content = document.getElementById('courseDetailContent');

    content.innerHTML = `
        <h2 class="text-3xl font-bold text-secondary mb-4">${course.name}</h2>
        
        <div class="grid grid-cols-2 gap-4 text-sm mb-6">
            <div>
                <p class="text-gray-600 font-bold">Nivel</p>
                <p class="text-primary">${course.level}</p>
            </div>
            <div>
                <p class="text-gray-600 font-bold">Modalidad</p>
                <p class="text-primary">${course.modality}</p>
            </div>
            <div>
                <p class="text-gray-600 font-bold">Duración</p>
                <p class="text-primary">${course.duration_hours} horas</p>
            </div>
            <div>
                <p class="text-gray-600 font-bold">Certificado</p>
                <p class="text-primary">${course.certificate ? 'Sí' : 'No'}</p>
            </div>
        </div>

        <div class="mb-6">
            <h3 class="font-bold text-secondary mb-2">Descripción</h3>
            <p class="text-gray-700">${course.description}</p>
        </div>

        <div class="mb-6">
            <h3 class="font-bold text-secondary mb-2">Syllabus</h3>
            <p class="text-gray-700 whitespace-pre-wrap">${course.syllabus}</p>
        </div>

        <div class="border-t pt-4 flex justify-between items-center">
            <span class="text-3xl font-bold text-accent">S/. ${course.price}</span>
            <button onclick="closeCourseDetail()" class="px-4 py-2 bg-gray-300 text-secondary rounded hover:bg-gray-400 transition">
                Cerrar
            </button>
        </div>
    `;

    modal.classList.remove('hidden');
}

function closeCourseDetail() {
    document.getElementById('courseDetailModal').classList.add('hidden');
}

// ============= ACCIONES CON CURSOS =============
async function removirInscripcion(courseId) {
    if (!confirm('¿Deseas desinscribirse de este curso?')) {
        return;
    }

    try {
        await fetchAPI(`/enrollments/${courseId}`, {
            method: 'DELETE'
        });

        showNotification('Te has desinscrito del curso');
        loadInscripciones();

    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

async function removeFavorite(courseId) {
    try {
        await fetchAPI(`/favorites/${courseId}`, {
            method: 'DELETE'
        });

        showNotification('Favorito removido');
        loadFavoritos();

    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

function verMasInfo(courseId) {
    // Ya está mostrado en el modal, solo cerrar
    closeCourseDetail();
}

// ============= LOGOUT =============
async function logoutUser() {
    try {
        await fetchAPI('/auth/logout', {
            method: 'POST'
        });
    } catch (error) {
        console.error('Error en logout:', error);
    }

    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = '/';
}

// ============= INICIALIZACIÓN =============
document.addEventListener('DOMContentLoaded', () => {
    switchTab('inscripciones');
});
