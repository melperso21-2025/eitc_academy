// ============= CONFIGURACIÓN GLOBAL =============
const API_BASE_URL = 'http://localhost:8000/api';
let authToken = localStorage.getItem('authToken') || null;
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

// ============= CARGAR CAMBIOS DE MONEDA =============
let exchangeRates = {};

async function loadExchangeRates() {
    try {
        const response = await fetchAPI('/exchange-rates');
        const rates = response.rates || response.data;
        
        rates.forEach(rate => {
            exchangeRates[rate.to_currency] = rate.rate;
        });
        
        console.log('Tasas de cambio cargadas:', exchangeRates);
    } catch (error) {
        console.error('Error al cargar tasas de cambio:', error);
    }
}

function convertCurrency(amount, toCurrency = 'PEN') {
    if (!exchangeRates[toCurrency]) return amount;
    return (amount * exchangeRates[toCurrency]).toFixed(2);
}

// ============= UTILIDADES =============
function openModal(modalId) {
    document.getElementById(modalId + 'Modal').classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId + 'Modal').classList.add('hidden');
}

function switchModal(fromModal, toModal) {
    closeModal(fromModal);
    openModal(toModal);
}

// Función para mostrar notificaciones
function showNotification(message, type = 'success') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    alert(message); // Usar alert por ahora, después mejorar
}

// Función para hacer solicitudes a la API
async function fetchAPI(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        }
    };

    // Agregar token de autenticación si existe
    if (authToken) {
        defaultOptions.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const finalOptions = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, finalOptions);
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token inválido o expirado
                authToken = null;
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                location.reload();
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

// ============= AUTENTICACIÓN =============
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (!response.success) {
            showNotification(response.message, 'error');
            return;
        }

        authToken = response.data.token;
        currentUser = response.data.user;
        
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        showNotification('¡Sesión iniciada correctamente!');
        closeModal('login');
        updateUIAfterAuth();
        location.reload();
        
    } catch (error) {
        showNotification('Error en el login: ' + error.message, 'error');
    }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;

    if (password !== passwordConfirm) {
        showNotification('Las contraseñas no coinciden', 'error');
        return;
    }

    try {
        const response = await fetchAPI('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, password_confirmation: passwordConfirm })
        });

        if (!response.success) {
            showNotification(response.message, 'error');
            return;
        }

        authToken = response.data.token;
        currentUser = response.data.user;
        
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        showNotification('¡Cuenta creada correctamente!');
        closeModal('register');
        updateUIAfterAuth();
        location.reload();
        
    } catch (error) {
        showNotification('Error en el registro: ' + error.message, 'error');
    }
});

// Botones de login/register
document.getElementById('btnLogin').addEventListener('click', () => openModal('login'));
document.getElementById('btnRegister').addEventListener('click', () => openModal('register'));

// ============= CARGAR CURSOS =============
async function loadCourses(filters = {}) {
    try {
        let url = '/courses';
        const params = new URLSearchParams();

        if (filters.search) params.append('search', filters.search);
        if (filters.category) params.append('category', filters.category);
        if (filters.level) params.append('level', filters.level);

        if (params.toString()) {
            url += '?' + params.toString();
        }

        const response = await fetchAPI(url);
        const courses = response.data.data || response.data;

        const container = document.getElementById('cursosContainer');
        container.innerHTML = '';

        if (courses.length === 0) {
            container.innerHTML = '<p class="col-span-3 text-center text-gray-600">No se encontraron cursos.</p>';
            return;
        }

        courses.forEach(course => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden';
            card.onclick = () => showCourseDetail(course);
            
            card.innerHTML = `
                <div class="h-48 bg-gradient-to-br from-primary to-blue-900 flex items-center justify-center overflow-hidden">
                    ${course.image_url ? `<img src="${course.image_url}" alt="${course.name}" class="w-full h-full object-cover">` : `<span class="text-white text-4xl">📚</span>`}
                </div>
                <div class="p-4">
                    <h3 class="font-bold text-lg text-secondary mb-2">${course.name}</h3>
                    <p class="text-gray-600 text-sm mb-3 line-clamp-2">${course.description}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-accent font-bold text-lg">S/. ${course.price}</span>
                        <span class="text-xs bg-primary text-white px-2 py-1 rounded">${course.level}</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Error al cargar cursos:', error);
        showNotification('Error al cargar cursos: ' + error.message, 'error');
    }
}

// ============= CARGAR CATEGORÍAS =============
async function loadCategories() {
    try {
        const response = await fetchAPI('/categories');
        const categories = response.data || [];

        const select = document.getElementById('categoryFilter');
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });

    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
}

// ============= FILTRADO DE CURSOS =============
document.getElementById('btnFilter').addEventListener('click', () => {
    const search = document.getElementById('searchFilter').value;
    const category = document.getElementById('categoryFilter').value;
    const level = document.getElementById('levelFilter').value;

    loadCourses({ search, category, level });
});

// ============= DETALLE DEL CURSO =============
async function showCourseDetail(course) {
    openModal('courseDetail');
    
    const contentDiv = document.getElementById('courseDetailContent');
    const precioConvertido = convertCurrency(course.price, 'PEN');
    
    const isFavorited = currentUser ? true : false; // Verificar después
    const isEnrolled = currentUser ? true : false; // Verificar después

    contentDiv.innerHTML = `
        <div class="space-y-4">
            <h2 class="text-3xl font-bold text-secondary">${course.name}</h2>
            
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p class="text-gray-600">Nivel</p>
                    <p class="font-bold text-primary">${course.level}</p>
                </div>
                <div>
                    <p class="text-gray-600">Modalidad</p>
                    <p class="font-bold text-primary">${course.modality}</p>
                </div>
                <div>
                    <p class="text-gray-600">Duración</p>
                    <p class="font-bold text-primary">${course.duration_hours} horas</p>
                </div>
                <div>
                    <p class="text-gray-600">Certificado</p>
                    <p class="font-bold text-primary">${course.certificate ? 'Sí' : 'No'}</p>
                </div>
            </div>

            <div>
                <h3 class="font-bold text-secondary mb-2">Descripción</h3>
                <p class="text-gray-700">${course.description}</p>
            </div>

            <div>
                <h3 class="font-bold text-secondary mb-2">Syllabus</h3>
                <p class="text-gray-700 whitespace-pre-wrap">${course.syllabus}</p>
            </div>

            <!-- Sección de Comentarios -->
            <div class="border-t pt-4">
                <h3 class="font-bold text-secondary mb-4">Comentarios (${course.comments_count || 0})</h3>
                <div id="commentsList" class="space-y-3 mb-4 max-h-48 overflow-y-auto">
                    <!-- Los comentarios se cargarán aquí -->
                </div>
                
                ${currentUser ? `
                    <form id="commentForm" class="space-y-2">
                        <textarea id="commentText" placeholder="Escribe tu comentario (máx 200 caracteres)..." class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary text-sm" maxlength="200" required></textarea>
                        <button type="submit" onclick="submitComment(event, ${course.id})" class="px-4 py-2 bg-accent text-secondary rounded text-sm font-bold hover:bg-opacity-90 transition">
                            Comentar
                        </button>
                    </form>
                ` : `
                    <p class="text-gray-600 text-sm">Inicia sesión para comentar</p>
                `}
            </div>

            <div class="border-t pt-4 flex justify-between items-center">
                <div>
                    <span class="text-3xl font-bold text-accent">S/. ${course.price}</span>
                    <p class="text-xs text-gray-600">≈ ${precioConvertido} PEN</p>
                </div>
                <div class="space-x-2">
                    ${currentUser ? `
                        <button class="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90" onclick="enrollCourse(${course.id})">
                            Inscribirse
                        </button>
                        <button class="px-4 py-2 bg-gray-300 text-secondary rounded hover:bg-gray-400" onclick="toggleFavorite(${course.id})">
                            ❤️ Favorito
                        </button>
                    ` : `
                        <button class="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90" onclick="openModal('login')">
                            Inicia sesión para inscribirte
                        </button>
                    `}
                </div>
            </div>
        </div>
    `;
    
    // Cargar comentarios
    loadComments(course.id);
}

async function loadComments(courseId) {
    try {
        const response = await fetchAPI(`/comments/${courseId}`);
        const comments = (response.data && response.data.data) || response.data || [];
        
        const container = document.getElementById('commentsList');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (comments.length === 0) {
            container.innerHTML = '<p class="text-gray-600 text-sm">No hay comentarios aún. ¡Sé el primero!</p>';
            return;
        }
        
        comments.forEach(comment => {
            const commentDiv = document.createElement('div');
            commentDiv.className = 'bg-gray-50 p-3 rounded text-sm';
            commentDiv.innerHTML = `
                <div class="flex justify-between">
                    <p class="font-bold text-secondary">${comment.user.name}</p>
                    ${currentUser && (currentUser.id === comment.user_id || currentUser.role === 'admin') ? `
                        <button onclick="deleteComment(${comment.id})" class="text-red-600 hover:underline text-xs">
                            Eliminar
                        </button>
                    ` : ''}
                </div>
                <p class="text-gray-700">${comment.content}</p>
            `;
            container.appendChild(commentDiv);
        });
    } catch (error) {
        console.error('Error al cargar comentarios:', error);
    }
}

// ============= ACCIONES DE USUARIO =============
async function enrollCourse(courseId) {
    if (!authToken) {
        showNotification('Debes iniciar sesión primero', 'error');
        return;
    }

    try {
        await fetchAPI('/enrollments', {
            method: 'POST',
            body: JSON.stringify({ course_id: courseId })
        });

        showNotification('¡Te has inscrito al curso correctamente!');
        closeModal('courseDetail');
        
    } catch (error) {
        showNotification('Error al inscribirse: ' + error.message, 'error');
    }
}

async function toggleFavorite(courseId) {
    if (!authToken) {
        showNotification('Debes iniciar sesión primero', 'error');
        return;
    }

    try {
        await fetchAPI('/favorites', {
            method: 'POST',
            body: JSON.stringify({ course_id: courseId })
        });

        showNotification('Favorito agregado/removido correctamente');
        
    } catch (error) {
        showNotification('Error al agregar favorito: ' + error.message, 'error');
    }
}

async function submitComment(event, courseId) {
    event.preventDefault();
    
    if (!authToken) {
        showNotification('Debes iniciar sesión primero', 'error');
        return;
    }

    const content = document.getElementById('commentText').value;

    try {
        await fetchAPI('/comments', {
            method: 'POST',
            body: JSON.stringify({ course_id: courseId, content })
        });

        document.getElementById('commentText').value = '';
        showNotification('Comentario agregado correctamente');
        loadComments(courseId);
        
    } catch (error) {
        showNotification('Error al agregar comentario: ' + error.message, 'error');
    }
}

async function deleteComment(commentId) {
    if (!confirm('¿Deseas eliminar este comentario?')) {
        return;
    }

    try {
        await fetchAPI(`/comments/${commentId}`, {
            method: 'DELETE'
        });

        showNotification('Comentario eliminado');
        // Recargar comentarios del curso actual
        // Aquí sería ideal pasar el courseId, pero por ahora recargamos el modal
        
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// ============= ACTUALIZAR UI =============
function updateUIAfterAuth() {
    if (currentUser) {
        const btnLogin = document.getElementById('btnLogin');
        const btnRegister = document.getElementById('btnRegister');
        
        let texto = `${currentUser.name}`;
        if (currentUser.role === 'admin') {
            texto += ' (Admin)';
        }
        
        btnLogin.textContent = texto;
        btnLogin.onclick = () => {
            if (currentUser.role === 'admin') {
                // Mostrar opciones
                showLogoutMenu();
            } else {
                logout();
            }
        };
        btnRegister.style.display = 'none';
    }
}

function showLogoutMenu() {
    const menu = document.createElement('div');
    menu.className = 'fixed top-16 right-4 bg-white shadow-lg rounded-lg overflow-hidden z-50';
    
    let menuHTML = '';
    if (currentUser.role === 'admin') {
        menuHTML += '<a href="/admin.html" class="block px-4 py-2 text-secondary hover:bg-gray-100 transition">Panel Admin</a>';
    } else {
        menuHTML += '<a href="/dashboard.html" class="block px-4 py-2 text-secondary hover:bg-gray-100 transition">Mi Dashboard</a>';
    }
    menuHTML += '<button onclick="logout()" class="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 transition">Cerrar Sesión</button>';
    
    menu.innerHTML = menuHTML;
    document.body.appendChild(menu);
    
    // Cerrar menú al hacer clic fuera
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && e.target !== document.getElementById('btnLogin')) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 100);
}

async function logout() {
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
    location.reload();
}

// ============= INICIALIZACIÓN =============
document.addEventListener('DOMContentLoaded', () => {
    updateUIAfterAuth();
    loadCategories();
    loadExchangeRates();
    loadCourses();
});
