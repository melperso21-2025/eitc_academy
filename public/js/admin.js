// Configuración de la API
const API_BASE_URL = 'http://localhost:8000/api';
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
let cursoEnEdicion = null;

// ============= PROTECCIÓN DE ACCESO =============
if (!authToken || !currentUser || currentUser.role !== 'admin') {
    alert('Acceso denegado. Solo administradores pueden acceder.');
    window.location.href = '/';
}

document.getElementById('adminName').textContent = `Bienvenido, ${currentUser.name}`;

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
    
    if (finalOptions.body && typeof finalOptions.body === 'object' && !(finalOptions.body instanceof FormData)) {
        finalOptions.body = JSON.stringify(finalOptions.body);
    }

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
    document.getElementById('tabCursosContent').classList.add('hidden');
    document.getElementById('tabCrearContent').classList.add('hidden');

    // Desactivar todos los botones
    document.getElementById('tabCursos').classList.remove('bg-primary');
    document.getElementById('tabCursos').classList.add('bg-gray-300', 'text-secondary');
    document.getElementById('tabCrear').classList.remove('bg-primary');
    document.getElementById('tabCrear').classList.add('bg-gray-300', 'text-secondary');

    // Mostrar tab seleccionado
    if (tabName === 'cursos') {
        document.getElementById('tabCursosContent').classList.remove('hidden');
        document.getElementById('tabCursos').classList.add('bg-primary');
        document.getElementById('tabCursos').classList.remove('bg-gray-300', 'text-secondary');
        loadMisCursos();
    } else if (tabName === 'crear') {
        document.getElementById('tabCrearContent').classList.remove('hidden');
        document.getElementById('tabCrear').classList.add('bg-primary');
        document.getElementById('tabCrear').classList.remove('bg-gray-300', 'text-secondary');
        limpiarFormulario();
    }
}

// ============= CARGAR CATEGORÍAS =============
async function loadCategorias() {
    try {
        const response = await fetchAPI('/categories');
        const categories = response.data;

        const select = document.getElementById('cursoCategoria');
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });

    } catch (error) {
        showNotification('Error al cargar categorías: ' + error.message, 'error');
    }
}

// ============= CARGAR MIS CURSOS =============
async function loadMisCursos() {
    try {
        const response = await fetchAPI('/courses');
        const cursos = (response.data && response.data.data) || response.data || [];

        const container = document.getElementById('misCursosContainer');
        container.innerHTML = '';

        if (cursos.length === 0) {
            container.innerHTML = '<p class="col-span-3 text-center text-gray-600">No hay cursos creados aún.</p>';
            return;
        }

        cursos.forEach(curso => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden';
            
            card.innerHTML = `
                <div class="h-40 bg-gradient-to-br from-primary to-blue-900 flex items-center justify-center">
                    <span class="text-white text-4xl">📚</span>
                </div>
                <div class="p-4">
                    <h3 class="font-bold text-lg text-secondary mb-1">${curso.name}</h3>
                    <p class="text-gray-600 text-sm mb-2">${curso.category?.name || 'Sin categoría'}</p>
                    <p class="text-accent font-bold mb-3">S/. ${curso.price}</p>
                    <div class="flex space-x-2">
                        <button onclick="editarCurso(${curso.id})" class="flex-1 px-3 py-2 bg-primary text-white rounded text-sm hover:bg-opacity-90 transition">
                            Editar
                        </button>
                        <button onclick="abrirOpciones(${curso.id})" class="flex-1 px-3 py-2 bg-gray-300 text-secondary rounded text-sm hover:bg-gray-400 transition">
                            Opciones
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        showNotification('Error al cargar cursos: ' + error.message, 'error');
    }
}

// ============= EDITAR CURSO =============
async function editarCurso(cursoId) {
    try {
        const response = await fetchAPI(`/courses/${cursoId}`);
        const curso = response.data;

        cursoEnEdicion = curso.id;

        document.getElementById('cursoId').value = curso.id;
        document.getElementById('cursoNombre').value = curso.name;
        document.getElementById('cursoCategoria').value = curso.category_id;
        document.getElementById('cursoDescripcion').value = curso.description;
        document.getElementById('cursoPrecio').value = curso.price;
        document.getElementById('cursoModalidad').value = curso.modality;
        document.getElementById('cursoNivel').value = curso.level;
        document.getElementById('cursoDuracion').value = curso.duration_hours;
        document.getElementById('cursoCertificado').value = curso.certificate || '';
        document.getElementById('cursoSyllabus').value = curso.syllabus;
        document.getElementById('cursoPublicado').checked = curso.is_published;

        document.getElementById('crearTitulo').textContent = 'Editar Curso';
        switchTab('crear');

    } catch (error) {
        showNotification('Error al cargar curso: ' + error.message, 'error');
    }
}

// ============= OPCIONES DEL CURSO =============
function abrirOpciones(cursoId) {
    const container = document.getElementById('modalOpciones');
    container.innerHTML = `
        <button onclick="publicarCurso(${cursoId})" class="w-full px-4 py-2 bg-accent text-secondary rounded font-bold hover:bg-opacity-90 transition">
            Publicar/Despublicar
        </button>
        <button onclick="subirImagen(${cursoId})" class="w-full px-4 py-2 bg-blue-500 text-white rounded font-bold hover:bg-opacity-90 transition">
            Subir Imagen
        </button>
        <button onclick="eliminarCurso(${cursoId})" class="w-full px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-opacity-90 transition">
            Eliminar Curso
        </button>
    `;
    document.getElementById('editModal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
}

// ============= PUBLICAR/DESPUBLICAR =============
async function publicarCurso(cursoId) {
    try {
        const curso = await fetchAPI(`/courses/${cursoId}`);
        const nuevoEstado = !curso.data.is_published;

        await fetchAPI(`/courses/${cursoId}`, {
            method: 'PUT',
            body: JSON.stringify({
                is_published: nuevoEstado
            })
        });

        showNotification(nuevoEstado ? 'Curso publicado' : 'Curso despublicado');
        closeEditModal();
        loadMisCursos();

    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// ============= SUBIR IMAGEN =============
function subirImagen(cursoId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(`${API_BASE_URL}/courses/${cursoId}/upload-image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Error al subir imagen');
            }

            const data = await response.json();
            showNotification('Imagen subida correctamente');
            closeEditModal();
            loadMisCursos();

        } catch (error) {
            showNotification('Error: ' + error.message, 'error');
        }
    };
    input.click();
}

// ============= ELIMINAR CURSO =============
async function eliminarCurso(cursoId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este curso?')) {
        return;
    }

    try {
        await fetchAPI(`/courses/${cursoId}`, {
            method: 'DELETE'
        });

        showNotification('Curso eliminado correctamente');
        closeEditModal();
        loadMisCursos();

    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// ============= GUARDAR CURSO =============
document.getElementById('cursoForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const cursoId = document.getElementById('cursoId').value;
    const imagen = document.getElementById('cursoImagen').files[0];

    const cursoData = {
        name: document.getElementById('cursoNombre').value,
        category_id: parseInt(document.getElementById('cursoCategoria').value),
        description: document.getElementById('cursoDescripcion').value,
        price: parseFloat(document.getElementById('cursoPrecio').value),
        modality: document.getElementById('cursoModalidad').value,
        level: document.getElementById('cursoNivel').value,
        duration_hours: parseInt(document.getElementById('cursoDuracion').value),
        certificate: document.getElementById('cursoCertificado').value,
        syllabus: document.getElementById('cursoSyllabus').value,
        is_published: document.getElementById('cursoPublicado').checked
    };

    try {
        if (cursoId) {
            // Actualizar curso
            await fetchAPI(`/courses/${cursoId}`, {
                method: 'PUT',
                body: cursoData
            });

            // Si hay imagen nueva, subirla
            if (imagen) {
                const formData = new FormData();
                formData.append('image', imagen);

                await fetch(`${API_BASE_URL}/courses/${cursoId}/upload-image`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: formData
                });
            }

            showNotification('Curso actualizado correctamente');
        } else {
            // Crear curso
            const response = await fetchAPI('/courses', {
                method: 'POST',
                body: cursoData
            });

            const nuevoId = response.data.id;

            // Si hay imagen, subirla
            if (imagen) {
                const formData = new FormData();
                formData.append('image', imagen);

                await fetch(`${API_BASE_URL}/courses/${nuevoId}/upload-image`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: formData
                });
            }

            showNotification('Curso creado correctamente');
        }

        limpiarFormulario();
        switchTab('cursos');

    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
});

// ============= LIMPIAR FORMULARIO =============
function limpiarFormulario() {
    document.getElementById('cursoForm').reset();
    document.getElementById('cursoId').value = '';
    document.getElementById('crearTitulo').textContent = 'Crear Nuevo Curso';
    cursoEnEdicion = null;
}

// ============= LOGOUT =============
async function logoutAdmin() {
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
    loadCategorias();
    switchTab('cursos');
});
