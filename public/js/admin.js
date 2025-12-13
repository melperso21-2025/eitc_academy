// Configuración de la API
const API_BASE_URL = 'http://127.0.0.1:8000/api';
const DEFAULT_FALLBACK_IMAGE_URL = '/images/fallback-course.svg';
const formAlert = document.getElementById('cursoFormAlert');
const companyAssetAlert = document.getElementById('companyAssetAlert');
const companyAssetForm = document.getElementById('companyAssetForm');
const companyAssetSubmit = document.getElementById('companyAssetSubmit');
const companyLogoImg = document.getElementById('companyLogo');
const companyLogoWrapper = document.getElementById('companyLogoWrapper');
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
let cursoEnEdicion = null;
let courseFallbackImageUrl = DEFAULT_FALLBACK_IMAGE_URL;

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

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value).replace(/[&<>"']/g, (char) => {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        };

        return map[char] || char;
    });
}

function updateFormAlert(type, message) {
    if (!formAlert) return;

    const baseClasses = 'border rounded px-4 py-3 text-sm font-semibold';
    let variantClasses = 'border-red-300 bg-red-50 text-red-700';

    if (type === 'success') {
        variantClasses = 'border-green-300 bg-green-50 text-green-700';
    }

    formAlert.className = `${baseClasses} ${variantClasses}`;
    formAlert.textContent = message;
    formAlert.classList.remove('hidden');
}

function clearFormAlert() {
    if (!formAlert) return;
    formAlert.className = 'hidden border rounded px-4 py-3 text-sm font-semibold';
    formAlert.textContent = '';
}

function updateCompanyAssetAlert(type, message) {
    if (!companyAssetAlert) return;

    const baseClasses = 'border rounded px-4 py-3 text-sm font-semibold';
    let variantClasses = 'border-red-300 bg-red-50 text-red-700';

    if (type === 'success') {
        variantClasses = 'border-green-300 bg-green-50 text-green-700';
    }

    companyAssetAlert.className = `${baseClasses} ${variantClasses}`;
    companyAssetAlert.textContent = message;
    companyAssetAlert.classList.remove('hidden');
}

function clearCompanyAssetAlert() {
    if (!companyAssetAlert) return;
    companyAssetAlert.className = 'hidden border rounded px-4 py-3 text-sm font-semibold';
    companyAssetAlert.textContent = '';
}

function updateCompanyLogoFromAssets(assets) {
    if (!companyLogoImg || !companyLogoWrapper) return;

    const logoAsset = Array.isArray(assets)
        ? assets.find((asset) => asset?.type === 'logo' && asset?.image_url)
        : null;

    if (logoAsset) {
        const baseUrl = logoAsset.image_url;
        const cacheSafeUrl = baseUrl
            ? (baseUrl.includes('?') ? `${baseUrl}&cb=${Date.now()}` : `${baseUrl}?cb=${Date.now()}`)
            : '';

        companyLogoImg.src = cacheSafeUrl;
        companyLogoImg.alt = logoAsset.title || 'Logo principal';
        companyLogoImg.classList.remove('hidden');
        companyLogoWrapper.classList.remove('bg-gray-200');
        companyLogoWrapper.classList.add('bg-accent');
    } else {
        companyLogoImg.src = '';
        companyLogoImg.alt = 'Logo principal';
        companyLogoImg.classList.add('hidden');
        companyLogoWrapper.classList.add('bg-accent');
    }
}

function updateCourseFallbackFromAssets(assets) {
    const fallbackAsset = Array.isArray(assets)
        ? assets.find((asset) => asset?.type === 'course_fallback' && asset?.image_url)
        : null;

    const fallbackUrl = fallbackAsset?.image_url || DEFAULT_FALLBACK_IMAGE_URL;
    if (courseFallbackImageUrl === fallbackUrl) {
        return false;
    }

    courseFallbackImageUrl = fallbackUrl;
    return true;
}

async function fetchAPI(endpoint, options = {}) {
    const defaultOptions = {
        cache: 'no-store',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            'Cache-Control': 'no-cache'
        }
    };

    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...(defaultOptions.headers || {}),
            ...(options.headers || {}),
        },
    };
    
    if (finalOptions.body && typeof finalOptions.body === 'object' && !(finalOptions.body instanceof FormData)) {
        finalOptions.body = JSON.stringify(finalOptions.body);
    }

    if (finalOptions.body instanceof FormData) {
        if (finalOptions.headers && finalOptions.headers['Content-Type']) {
            delete finalOptions.headers['Content-Type'];
        }
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

            const responseText = await response.text();
            let errorData = {};
            try {
                errorData = JSON.parse(responseText);
            } catch (e) {
                errorData = { message: responseText || `Error ${response.status}` };
            }

            const apiError = new Error(errorData.message || `Error ${response.status}`);
            apiError.status = response.status;
            apiError.details = errorData.errors || null;
            apiError.raw = errorData;
            throw apiError;
        }

        const responseText = await response.text();
        try {
            return JSON.parse(responseText);
        } catch (e) {
            console.error('JSON Parse Error:', responseText);
            const apiError = new Error('Invalid JSON response from server');
            apiError.raw = responseText;
            throw apiError;
        }
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ============= TABS =============
const tabDefinitions = {
    cursos: {
        contentId: 'tabCursosContent',
        buttonId: 'tabCursos',
        onShow: () => loadMisCursos(),
    },
    crear: {
        contentId: 'tabCrearContent',
        buttonId: 'tabCrear',
        onShow: (opts = {}) => {
            if (!opts.keepFormData) {
                limpiarFormulario();
            }
        },
    },
    imagenes: {
        contentId: 'tabImagenesContent',
        buttonId: 'tabImagenes',
        onShow: () => loadCoursesForUpload(),
    },
    empresa: {
        contentId: 'tabEmpresaContent',
        buttonId: 'tabEmpresa',
        onShow: () => loadCompanyAssets(),
    },
};

function switchTab(tabName, options = {}) {
    const targetKey = tabDefinitions[tabName] ? tabName : 'cursos';
    const targetTab = tabDefinitions[targetKey];

    Object.values(tabDefinitions).forEach(({ contentId, buttonId }) => {
        const contentEl = document.getElementById(contentId);
        if (contentEl) {
            contentEl.classList.add('hidden');
        }

        const buttonEl = document.getElementById(buttonId);
        if (buttonEl) {
            buttonEl.classList.remove('bg-primary');
            buttonEl.classList.add('bg-gray-300', 'text-secondary');
        }
    });

    const contentEl = document.getElementById(targetTab.contentId);
    if (contentEl) {
        contentEl.classList.remove('hidden');
    }

    const buttonEl = document.getElementById(targetTab.buttonId);
    if (buttonEl) {
        buttonEl.classList.add('bg-primary');
        buttonEl.classList.remove('bg-gray-300', 'text-secondary');
    }

    if (typeof targetTab.onShow === 'function') {
        targetTab.onShow(options);
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
            const hasCustomImage = curso.image_url && curso.image_url.trim() !== '';
            const fallbackImage = courseFallbackImageUrl || DEFAULT_FALLBACK_IMAGE_URL;
            const baseImageUrl = hasCustomImage ? curso.image_url : fallbackImage;
            const imageSrc = hasCustomImage
                ? (baseImageUrl.includes('?') ? `${baseImageUrl}&t=${Date.now()}` : `${baseImageUrl}?t=${Date.now()}`)
                : baseImageUrl;

            const priceValue = Number(curso.price ?? 0);
            const formattedPrice = Number.isFinite(priceValue) && !Number.isNaN(priceValue)
                ? priceValue.toFixed(2)
                : '0.00';

            const discountValue = Number(curso.discount_amount ?? 0);
            const hasDiscount = Number.isFinite(discountValue) && !Number.isNaN(discountValue) && discountValue > 0;
            const discountPercent = Number(curso.discount_percent ?? 0);
            const formattedDiscountAmount = hasDiscount ? discountValue.toFixed(2) : null;
            const formattedDiscountPercent = hasDiscount ? discountPercent.toFixed(2) : null;
            const finalPrice = hasDiscount ? Math.max(priceValue - discountValue, 0).toFixed(2) : null;

            const card = document.createElement('div');
            card.className = 'bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden flex flex-col';
            
            card.innerHTML = `
                <div class="h-40 bg-gray-100 overflow-hidden">
                    <img src="${imageSrc}" alt="${curso.name}" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='${fallbackImage}';">
                </div>
                <div class="p-4 flex flex-col gap-2 flex-1">
                    <h3 class="font-bold text-lg text-secondary leading-snug">${curso.name}</h3>
                    <p class="text-gray-600 text-sm">${curso.category?.name || 'Sin categoría'}</p>
                    <div>
                        <p class="text-accent font-bold">$${formattedPrice}</p>
                        ${hasDiscount ? `
                            <p class="text-green-600 text-sm">Descuento: $${formattedDiscountAmount} (${formattedDiscountPercent}%)</p>
                            <p class="text-secondary text-sm font-semibold">Precio final: $${finalPrice}</p>
                        ` : ''}
                    </div>
                    <div class="flex space-x-2 mt-auto pt-2">
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

        switchTab('crear', { keepFormData: true });

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
        document.getElementById('cursoDescuento').value = curso.discount_amount ?? '';
        document.getElementById('cursoPublicado').checked = curso.is_published;

        document.getElementById('crearTitulo').textContent = 'Editar Curso';

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

        const estadoActual = nuevoEstado ? 'publicado' : 'despublicado';
        showNotification(`Curso ${estadoActual}`);
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
    clearFormAlert();

    const cursoId = document.getElementById('cursoId').value;
    const imagen = document.getElementById('cursoImagen').files[0];
    const discountRaw = document.getElementById('cursoDescuento').value.trim();

    const priceValue = parseFloat(document.getElementById('cursoPrecio').value);
    if (Number.isNaN(priceValue) || priceValue <= 0) {
        updateFormAlert('error', 'Por favor ingresa un precio válido mayor a 0.');
        return;
    }

    let discountAmount = null;
    if (discountRaw !== '') {
        const parsedDiscount = parseFloat(discountRaw);
        if (Number.isNaN(parsedDiscount) || parsedDiscount < 0) {
            updateFormAlert('error', 'El descuento debe ser un número mayor o igual a 0.');
            return;
        }
        discountAmount = parsedDiscount;

        if (discountAmount > priceValue) {
            updateFormAlert('error', 'El descuento no puede ser mayor al precio.');
            return;
        }
    }

    const cursoData = {
        name: document.getElementById('cursoNombre').value,
        category_id: parseInt(document.getElementById('cursoCategoria').value),
        description: document.getElementById('cursoDescripcion').value,
        price: priceValue,
        modality: document.getElementById('cursoModalidad').value,
        level: document.getElementById('cursoNivel').value,
        duration_hours: parseInt(document.getElementById('cursoDuracion').value),
        certificate: document.getElementById('cursoCertificado').value,
        syllabus: document.getElementById('cursoSyllabus').value,
        is_published: document.getElementById('cursoPublicado').checked,
        discount_amount: discountAmount
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
                try {
                    const formData = new FormData();
                    formData.append('image', imagen);

                    const imgResponse = await fetch(`${API_BASE_URL}/courses/${cursoId}/upload-image`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${authToken}`
                        },
                        body: formData
                    });

                    if (!imgResponse.ok) {
                        console.warn('Error subiendo imagen:', imgResponse.statusText);
                    }
                } catch (imgError) {
                    console.error('Error en upload de imagen:', imgError);
                }
            }

            showNotification('Curso actualizado correctamente');
            clearFormAlert();
            limpiarFormulario();
            await loadMisCursos(); // Recargar lista
            switchTab('cursos');
        } else {
            // Crear curso
            console.log('Creando nuevo curso...', cursoData);
            const response = await fetchAPI('/courses', {
                method: 'POST',
                body: cursoData
            });

            console.log('Curso creado, respuesta:', response);

            if (!response.data || !response.data.id) {
                showNotification('Error: No se obtuvo ID del curso creado', 'error');
                return;
            }

            const nuevoId = response.data.id;
            console.log('Nuevo curso ID:', nuevoId);

            // Si hay imagen, subirla
            if (imagen) {
                try {
                    console.log('Subiendo imagen...');
                    const formData = new FormData();
                    formData.append('image', imagen);

                    const imgResponse = await fetch(`${API_BASE_URL}/courses/${nuevoId}/upload-image`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${authToken}`
                        },
                        body: formData
                    });

                    console.log('Respuesta upload imagen:', imgResponse.status);

                    if (!imgResponse.ok) {
                        const errorData = await imgResponse.json();
                        console.warn('Error subiendo imagen:', errorData);
                        // No lanzar error, permitir que se continue sin imagen
                    }
                } catch (imgError) {
                    console.error('Error en upload de imagen:', imgError);
                }
            }

            showNotification('Curso creado correctamente');
            clearFormAlert();
            limpiarFormulario();
            await loadMisCursos(); // Recargar lista ANTES de cambiar tab
            switchTab('cursos');
        }

    } catch (error) {
        console.error('Error completo:', error);
        if (error.details) {
            console.error('Detalles de validación:', error.details);
        }

        let detalleMsg = '';
        if (error.details) {
            const mensajes = Object.values(error.details).flat();
            if (mensajes.length) {
                detalleMsg = ' - ' + mensajes.join(' | ');
            }
        }

        const mensaje = 'Error: ' + error.message + detalleMsg;
        updateFormAlert('error', mensaje);
        showNotification(mensaje, 'error');
    }
});

if (companyAssetForm) {
    companyAssetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearCompanyAssetAlert();

        if (!companyAssetSubmit) {
            return;
        }

        const formData = new FormData(companyAssetForm);

        companyAssetSubmit.disabled = true;

        try {
            await fetchAPI('/company-assets', {
                method: 'POST',
                body: formData,
            });

            updateCompanyAssetAlert('success', 'Imagen guardada correctamente.');
            showNotification('Imagen corporativa guardada correctamente');
            companyAssetForm.reset();
            loadCompanyAssets();
        } catch (error) {
            console.error('Error guardando imagen corporativa:', error);

            let detalleMsg = '';
            if (error.details) {
                const mensajes = Object.values(error.details).flat();
                if (mensajes.length) {
                    detalleMsg = ' - ' + mensajes.join(' | ');
                }
            }

            const mensaje = 'Error: ' + (error.message || 'No se pudo guardar la imagen') + detalleMsg;
            updateCompanyAssetAlert('error', mensaje);
            showNotification(mensaje, 'error');
        } finally {
            companyAssetSubmit.disabled = false;
        }
    });
}

// ============= LIMPIAR FORMULARIO =============
function limpiarFormulario() {
    document.getElementById('cursoForm').reset();
    document.getElementById('cursoId').value = '';
    document.getElementById('crearTitulo').textContent = 'Crear Nuevo Curso';
    cursoEnEdicion = null;
    clearFormAlert();
}

function cancelarCreacion() {
    limpiarFormulario();
    switchTab('cursos');
}

function resetCompanyAssetForm() {
    if (companyAssetForm) {
        companyAssetForm.reset();
    }
    clearCompanyAssetAlert();
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

        const previousSelection = select.value;

        if (selectedCourseId) {
            select.value = selectedCourseId;
        }

        if (!select.value && previousSelection) {
            select.value = previousSelection;
        }

        select.onchange = (e) => {
            selectedCourseId = e.target.value || null;
            loadCourseImages(selectedCourseId);
        };

        if (select.value) {
            selectedCourseId = select.value;
            loadCourseImages(selectedCourseId);
        } else {
            loadCourseImages(null);
        }
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

        const fallbackImage = courseFallbackImageUrl || DEFAULT_FALLBACK_IMAGE_URL;
        const hasCustomImage = course.image_url && course.image_url.trim() !== '';
        const rawImageUrl = hasCustomImage ? course.image_url : fallbackImage;
        const imageUrl = hasCustomImage
            ? (rawImageUrl.includes('?') ? rawImageUrl + '&t=' + Date.now() : rawImageUrl + '?t=' + Date.now())
            : rawImageUrl;

        document.getElementById('imageGallery').innerHTML = `
            <div class="border border-gray-300 rounded-lg overflow-hidden">
                <img src="${imageUrl}" alt="${course.name}" class="w-full h-40 object-cover" onerror="this.onerror=null;this.src='${fallbackImage}';">
                <div class="p-4 bg-gray-50">
                    <p class="text-sm font-bold text-secondary">${course.name}</p>
                    <p class="text-xs text-gray-600 mt-1 break-all">${course.image_url || 'Imagen genérica'}</p>
                    <button type="button" onclick="copyToClipboard('${rawImageUrl}')" class="mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                        📋 Copiar URL
                    </button>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error cargando imágenes:', error);
        document.getElementById('imageGallery').innerHTML = '<p class="text-red-600 text-center py-8">Error al cargar imagen</p>';
    }
}

// ============= ACTIVOS CORPORATIVOS =============
const companyAssetTypeLabels = {
    logo: 'Logo principal',
    brand: 'Marca / Imagen institucional',
    course_fallback: 'Imagen por default de cursos',
    history: 'Historial de talleres',
};

async function loadCompanyAssets() {
    const listContainer = document.getElementById('companyAssetsList');
    if (!listContainer) return;

    try {
        const response = await fetchAPI('/company-assets');
        const assets = response.data || [];
        renderCompanyAssetsList(assets);
        updateCompanyLogoFromAssets(assets);
        const fallbackChanged = updateCourseFallbackFromAssets(assets);

        if (fallbackChanged) {
            await loadMisCursos();
            if (selectedCourseId) {
                await loadCourseImages(selectedCourseId);
            }
        }
    } catch (error) {
        console.error('Error cargando imágenes corporativas:', error);
        renderCompanyAssetsList([]);
        updateCompanyAssetAlert('error', 'Error al cargar las imágenes corporativas.');
        updateCompanyLogoFromAssets([]);
        const fallbackChanged = updateCourseFallbackFromAssets([]);

        if (fallbackChanged) {
            await loadMisCursos();
            if (selectedCourseId) {
                await loadCourseImages(selectedCourseId);
            }
        }
    }
}

function renderCompanyAssetsList(assets) {
    const container = document.getElementById('companyAssetsList');
    if (!container) return;

    const fallbackImage = courseFallbackImageUrl || DEFAULT_FALLBACK_IMAGE_URL;

    if (!assets || assets.length === 0) {
        container.innerHTML = '<p class="text-gray-600 text-center py-8">No hay imágenes registradas todavía.</p>';
        return;
    }

    const grouped = assets.reduce((acc, asset) => {
        const type = asset.type || 'otros';
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(asset);
        return acc;
    }, {});

    const typeOrder = ['logo', 'brand', 'course_fallback', 'history'];
    const renderedTypes = new Set();
    let html = '';

    const buildSection = (type, items) => {
        if (!items || items.length === 0) return;
        renderedTypes.add(type);

        const friendlyName = companyAssetTypeLabels[type] || `Tipo: ${type}`;
        const cards = items
            .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
            .map((asset) => {
                const cacheSafeUrl = asset.image_url
                    ? (asset.image_url.includes('?')
                        ? `${asset.image_url}&t=${Date.now()}`
                        : `${asset.image_url}?t=${Date.now()}`)
                    : fallbackImage;

                const description = asset.description ? `<p class="text-sm text-gray-600">${escapeHtml(asset.description)}</p>` : '';
                const title = asset.title ? `<p class="text-base font-semibold text-secondary">${escapeHtml(asset.title)}</p>` : '';
                const orderLabel = `<span class="text-xs text-gray-500">Orden: ${asset.display_order ?? 0}</span>`;

                return `
                    <div class="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                        <img src="${cacheSafeUrl}" alt="${escapeHtml(asset.title || friendlyName)}" class="w-full h-40 object-cover" onerror="this.onerror=null;this.src='${fallbackImage}';">
                        <div class="p-4 space-y-2">
                            <div class="flex items-center justify-between text-sm text-gray-500">
                                <span class="font-semibold text-secondary">${escapeHtml(friendlyName)}</span>
                                ${orderLabel}
                            </div>
                            ${title}
                            ${description}
                            <div class="flex justify-end space-x-2 pt-2">
                                <button type="button" onclick="copyToClipboard('${asset.image_url}')" class="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Copiar URL</button>
                                <button type="button" onclick="deleteCompanyAsset(${asset.id})" class="px-3 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200">Eliminar</button>
                            </div>
                        </div>
                    </div>
                `;
            })
            .join('');

        html += `
            <section class="space-y-3">
                <header class="flex items-center justify-between">
                    <h4 class="text-lg font-bold text-secondary">${escapeHtml(friendlyName)}</h4>
                    <span class="text-xs text-gray-500">${items.length} elemento(s)</span>
                </header>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    ${cards}
                </div>
            </section>
        `;
    };

    typeOrder.forEach((type) => buildSection(type, grouped[type] || []));

    Object.keys(grouped)
        .filter((type) => !renderedTypes.has(type))
        .forEach((type) => buildSection(type, grouped[type]));

    container.innerHTML = html || '<p class="text-gray-600 text-center py-8">No hay imágenes registradas todavía.</p>';
}

async function deleteCompanyAsset(assetId) {
    if (!assetId) return;

    const confirmed = confirm('¿Estás seguro de eliminar este recurso?');
    if (!confirmed) return;

    try {
        await fetchAPI(`/company-assets/${assetId}`, { method: 'DELETE' });
        showNotification('Imagen corporativa eliminada correctamente');
        loadCompanyAssets();
    } catch (error) {
        console.error('Error eliminando asset:', error);
        const detalle = error.message || 'No se pudo eliminar el recurso.';
        updateCompanyAssetAlert('error', `Error: ${detalle}`);
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
    loadCompanyAssets();
    switchTab('cursos');
});
