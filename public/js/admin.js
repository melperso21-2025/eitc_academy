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

// ============= UPLOAD DE IMÁGENES =============
let selectedFile = null;
let selectedCourseId = null;

// Cargar lista de cursos en el selector
async function loadCoursesForUpload() {
    try {
        const data = await fetchAPI('/courses?limit=100');
        const courses = data.data.data || data.data || [];
        
        const select = document.getElementById('uploadCourseSelect');
        select.innerHTML = '<option value="">-- Selecciona un curso --</option>';
        
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = course.name;
            select.appendChild(option);
        });

        // Event listener para actualizar galería
        select.addEventListener('change', (e) => {
            selectedCourseId = e.target.value;
            loadCourseImages(selectedCourseId);
        });
    } catch (error) {
        console.error('Error cargando cursos:', error);
        showNotification('Error al cargar cursos', 'error');
    }
}

// Drag and drop
const dropZone = document.getElementById('dropZone');

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('bg-blue-50');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('bg-blue-50');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('bg-blue-50');
    
    if (e.dataTransfer.files.length > 0) {
        handleImageSelection(e.dataTransfer.files[0]);
    }
});

// Click para seleccionar archivo
dropZone.addEventListener('click', () => {
    document.getElementById('imageUploadInput').click();
});

document.getElementById('imageUploadInput').addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleImageSelection(e.target.files[0]);
    }
});

// Manejar selección de imagen
function handleImageSelection(file) {
    // Validar tipo
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'].includes(file.type)) {
        showNotification('Solo se aceptan imágenes (JPG, PNG, WebP, GIF)', 'error');
        return;
    }

    // Validar tamaño (5MB = 5242880 bytes)
    if (file.size > 5242880) {
        showNotification('La imagen no puede pesar más de 5MB', 'error');
        return;
    }

    selectedFile = file;

    // Mostrar preview
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('imagePreview').src = e.target.result;
        document.getElementById('previewContainer').classList.remove('hidden');
        document.getElementById('dropZoneContent').classList.add('hidden');
    };
    reader.readAsDataURL(file);
}

// Limpiar preview
function clearImagePreview() {
    selectedFile = null;
    document.getElementById('imageUploadInput').value = '';
    document.getElementById('previewContainer').classList.add('hidden');
    document.getElementById('dropZoneContent').classList.remove('hidden');
}

// Subir imagen
async function uploadImage() {
    if (!selectedCourseId) {
        showNotification('Por favor selecciona un curso', 'error');
        return;
    }

    if (!selectedFile) {
        showNotification('Por favor selecciona una imagen', 'error');
        return;
    }

    const uploadBtn = document.getElementById('uploadBtn');
    uploadBtn.disabled = true;

    try {
        const formData = new FormData();
        formData.append('image', selectedFile);

        const progressContainer = document.getElementById('progressContainer');
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        progressContainer.classList.remove('hidden');

        const xhr = new XMLHttpRequest();

        // Progreso
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                progressBar.style.width = percentComplete + '%';
                progressText.textContent = Math.round(percentComplete) + '%';
            }
        });

        // Completado
        xhr.addEventListener('load', () => {
            progressContainer.classList.add('hidden');
            progressBar.style.width = '0%';

            if (xhr.status === 201 || xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                
                if (response.success) {
                    showSuccess('¡Imagen subida correctamente!');
                    clearImagePreview();
                    loadCourseImages(selectedCourseId); // Actualizar galería
                } else {
                    showError(response.message || 'Error al subir imagen');
                }
            } else {
                const response = JSON.parse(xhr.responseText);
                showError(response.message || 'Error en la subida');
            }

            uploadBtn.disabled = false;
        });

        // Error
        xhr.addEventListener('error', () => {
            progressContainer.classList.add('hidden');
            showError('Error de conexión');
            uploadBtn.disabled = false;
        });

        xhr.open('POST', `${API_BASE_URL}/courses/${selectedCourseId}/upload-image`);
        xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
        xhr.send(formData);

    } catch (error) {
        console.error('Error:', error);
        showError('Error al subir imagen');
        uploadBtn.disabled = false;
    }
}

// Cargar imágenes del curso
async function loadCourseImages(courseId) {
    if (!courseId) {
        document.getElementById('imageGallery').innerHTML = '<p class="text-gray-600 text-center py-8">Selecciona un curso para ver sus imágenes</p>';
        return;
    }

    try {
        const data = await fetchAPI(`/courses/${courseId}`);
        const course = data.data;

        if (course.image_url) {
            const imageUrl = course.image_url.includes('?') 
                ? course.image_url + '&t=' + Date.now()
                : course.image_url + '?t=' + Date.now();

            document.getElementById('imageGallery').innerHTML = `
                <div class="border border-gray-300 rounded-lg overflow-hidden">
                    <img src="${imageUrl}" alt="${course.name}" class="w-full h-40 object-cover">
                    <div class="p-4 bg-gray-50">
                        <p class="text-sm font-bold text-secondary">${course.name}</p>
                        <p class="text-xs text-gray-600 mt-1 break-all">${course.image_url}</p>
                        <button type="button" onclick="copyToClipboard('${imageUrl}')" class="mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                            📋 Copiar URL
                        </button>
                    </div>
                </div>
            `;
        } else {
            document.getElementById('imageGallery').innerHTML = '<p class="text-gray-600 text-center py-8">Este curso aún no tiene imagen</p>';
        }
    } catch (error) {
        console.error('Error cargando imágenes:', error);
        document.getElementById('imageGallery').innerHTML = '<p class="text-red-600 text-center py-8">Error al cargar imagen</p>';
    }
}

// Helper para copiar al portapapeles
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('URL copiada al portapapeles');
    });
}

// Funciones de mensaje mejoradas
function showSuccess(message) {
    const msgEl = document.getElementById('uploadMessage');
    msgEl.textContent = message;
    msgEl.className = 'p-4 rounded-lg text-sm font-semibold bg-green-100 text-green-700';
    msgEl.classList.remove('hidden');
    
    setTimeout(() => msgEl.classList.add('hidden'), 3000);
}

function showError(message) {
    const msgEl = document.getElementById('uploadMessage');
    msgEl.textContent = message;
    msgEl.className = 'p-4 rounded-lg text-sm font-semibold bg-red-100 text-red-700';
    msgEl.classList.remove('hidden');
    
    setTimeout(() => msgEl.classList.add('hidden'), 3000);
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
    loadCoursesForUpload(); // Cargar cursos para upload
    switchTab('cursos');
});
