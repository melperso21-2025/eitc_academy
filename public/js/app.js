// ============= CONFIGURACIÓN GLOBAL =============
const API_BASE_URL = 'http://127.0.0.1:8000/api';
let authToken = localStorage.getItem('authToken') || null;
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

const publicLogoImg = document.getElementById('publicLogo');
const publicLogoWrapper = document.getElementById('publicLogoWrapper');
const brandImageEl = document.getElementById('brandImage');
const brandFallbackEl = document.getElementById('brandFallback');
const courseSectionsContainer = document.getElementById('courseSectionsContainer');
const searchInput = document.getElementById('searchFilter');
const categorySelect = document.getElementById('categoryFilter');
const levelSelect = document.getElementById('levelFilter');
const DEFAULT_FALLBACK_COURSE_IMAGE = '/images/fallback-course.svg';
let courseFallbackImageUrl = DEFAULT_FALLBACK_COURSE_IMAGE;
const GRID_ITEMS_PER_PAGE = 15;
let lastLoadedCourses = [];
let activeCourseDetail = null;
let editingCommentId = null;
let exchangeRatesFetchPromise = null;

const PRICE_CONVERSION_TARGETS = [
    {
        code: 'PEN',
        countryAbbr: 'PE',
        label: 'Perú',
        locale: 'es-PE',
        flagStyle: 'linear-gradient(90deg, #dc2626 0%, #dc2626 33%, #f8fafc 33%, #f8fafc 66%, #dc2626 66%, #dc2626 100%)'
    },
    {
        code: 'COP',
        countryAbbr: 'CO',
        label: 'Colombia',
        locale: 'es-CO',
        flagStyle: 'linear-gradient(180deg, #facc15 0%, #facc15 33%, #1d4ed8 33%, #1d4ed8 66%, #dc2626 66%, #dc2626 100%)'
    },
    {
        code: 'CLP',
        countryAbbr: 'CL',
        label: 'Chile',
        locale: 'es-CL',
        flagStyle: 'linear-gradient(180deg, #1d4ed8 0%, #1d4ed8 50%, #f8fafc 50%, #dc2626 50%, #dc2626 100%)'
    },
    {
        code: 'BOB',
        countryAbbr: 'BO',
        label: 'Bolivia',
        locale: 'es-BO',
        flagStyle: 'linear-gradient(180deg, #dc2626 0%, #dc2626 33%, #facc15 33%, #facc15 66%, #16a34a 66%, #16a34a 100%)'
    },
    {
        code: 'ARS',
        countryAbbr: 'AR',
        label: 'Argentina',
        locale: 'es-AR',
        flagStyle: 'linear-gradient(180deg, #38bdf8 0%, #38bdf8 33%, #f8fafc 33%, #f8fafc 66%, #38bdf8 66%, #38bdf8 100%)'
    },
    {
        code: 'BRL',
        countryAbbr: 'BR',
        label: 'Brasil',
        locale: 'pt-BR',
        flagStyle: 'linear-gradient(180deg, #15803d 0%, #15803d 50%, #facc15 50%, #facc15 100%)'
    }
];

const EXCHANGE_RATE_FALLBACKS = {
    PEN: 3.89,
    COP: 4150.0,
    CLP: 890.5,
    BOB: 6.9,
    ARS: 1050.0,
    BRL: 5.23
};

// ============= CARGAR CAMBIOS DE MONEDA =============
let exchangeRates = {};
let currentCourseFilters = getInitialFiltersFromQuery();

async function loadExchangeRates() {
    if (exchangeRatesFetchPromise) {
        return exchangeRatesFetchPromise;
    }

    exchangeRatesFetchPromise = (async () => {
        try {
            const response = await fetchAPI('/exchange-rates');
            const rates = response.rates || response.data || [];

            if (Array.isArray(rates)) {
                rates.forEach((rate) => {
                    if (rate?.to_currency && Number.isFinite(Number(rate?.rate))) {
                        exchangeRates[rate.to_currency] = Number(rate.rate);
                    }
                });
            } else if (rates && typeof rates === 'object') {
                Object.entries(rates).forEach(([currencyCode, rateValue]) => {
                    if (currencyCode && Number.isFinite(Number(rateValue))) {
                        exchangeRates[currencyCode] = Number(rateValue);
                    }
                });
            }

            console.log('Tasas de cambio cargadas:', exchangeRates);
        } catch (error) {
            console.error('Error al cargar tasas de cambio:', error);
            throw error;
        } finally {
            exchangeRatesFetchPromise = null;
        }

        return exchangeRates;
    })();

    return exchangeRatesFetchPromise;
}

function convertCurrency(amount, toCurrency = 'PEN') {
    const numericAmount = Number(amount) || 0;
    const rate = getEffectiveExchangeRate(toCurrency);
    if (!rate) return numericAmount.toFixed(2);
    return (numericAmount * rate).toFixed(2);
}

function formatUSD(amount) {
    if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
        return '$0.00';
    }
    return `$${Number(amount).toFixed(2)}`;
}

function formatPercent(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) {
        return '0%';
    }
    if (Number.isInteger(numeric)) {
        return `${numeric}%`;
    }
    return `${numeric.toFixed(1)}%`;
}

function getInitialFiltersFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const pageParam = parseInt(params.get('page') || '1', 10);
    const normalizedPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    return {
        search: params.get('search') || '',
        category: params.get('category') || '',
        level: params.get('level') || '',
        promotions: params.get('promotions') === '1',
        favorites: params.get('favorites') === '1',
        page: normalizedPage
    };
}

function setFilterInputsFromState() {
    if (searchInput) {
        searchInput.value = currentCourseFilters.search || '';
    }
    if (levelSelect) {
        levelSelect.value = currentCourseFilters.level || '';
    }
    if (categorySelect) {
        categorySelect.value = currentCourseFilters.category || '';
    }
}

function getFavoriteButtonConfig(isFavorite) {
    const baseClasses = 'px-4 sm:px-5 rounded font-semibold transition flex items-center gap-2 justify-center w-full sm:w-auto sm:min-w-[200px] h-11 sm:h-12 whitespace-nowrap text-center';
    const activeClasses = 'bg-rose-100 text-rose-600 hover:bg-rose-200';
    const inactiveClasses = 'bg-gray-200 text-secondary hover:bg-gray-300';

    return {
        classes: `${baseClasses} ${isFavorite ? activeClasses : inactiveClasses}`,
        icon: isFavorite ? '&#10084;' : '&#9825;',
        label: isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'
    };
}

function updateCourseDetailFavoriteState(isFavorite) {
    if (activeCourseDetail) {
        activeCourseDetail = { ...activeCourseDetail, is_favorite: isFavorite };
    }

    const favoriteButton = document.getElementById('favoriteToggleButton');
    if (!favoriteButton) return;

    const config = getFavoriteButtonConfig(isFavorite);
    favoriteButton.className = config.classes;
    favoriteButton.setAttribute('data-favorite', isFavorite ? '1' : '0');
    favoriteButton.innerHTML = `<span aria-hidden="true">${config.icon}</span><span>${config.label}</span>`;
}

function updateCourseCardFavoriteState(courseId, isFavorite) {
    const card = document.querySelector(`[data-course-id="${courseId}"]`);
    if (!card) return;

    let badge = card.querySelector('[data-favorite-badge]');

    if (isFavorite) {
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'absolute top-3 right-3 z-10 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/90 shadow text-rose-500 text-lg pointer-events-none';
            badge.innerHTML = '&#10084;';
            badge.setAttribute('aria-hidden', 'true');
            badge.title = 'Curso en favoritos';
            card.appendChild(badge);
        }
        badge.dataset.favoriteBadge = courseId;
    } else if (badge) {
        badge.remove();
    }
}

function updateCourseCardCommentCount(courseId, newCount) {
    const badge = document.querySelector(`[data-comment-badge="${courseId}"]`);
    if (!badge) return;

    const safeCount = Number.isFinite(Number(newCount)) ? Number(newCount) : 0;
    const label = `${safeCount} comentario${safeCount === 1 ? '' : 's'}`;
    badge.innerHTML = `&#128172; <span class="text-secondary text-base font-bold">${safeCount}</span>`;
    badge.setAttribute('aria-label', label);
    badge.title = label;
}

function updateLocalCourseCommentCount(courseId, newCount) {
    const countValue = Number.isFinite(Number(newCount)) ? Number(newCount) : 0;
    const courseIndex = lastLoadedCourses.findIndex((course) => course.id === courseId);
    if (courseIndex !== -1) {
        lastLoadedCourses[courseIndex] = {
            ...lastLoadedCourses[courseIndex],
            comments_count: countValue
        };
    }
}

function updateCourseDetailCommentsHeader(newCount) {
    const countValue = Number.isFinite(Number(newCount)) ? Number(newCount) : 0;
    const countSpan = document.getElementById('commentCountValue');
    if (countSpan) {
        countSpan.textContent = countValue;
    }
}

function getEffectiveExchangeRate(currencyCode) {
    const directRate = Number(exchangeRates?.[currencyCode]);
    if (Number.isFinite(directRate) && directRate > 0) {
        return directRate;
    }

    const fallbackRate = Number(EXCHANGE_RATE_FALLBACKS?.[currencyCode]);
    if (Number.isFinite(fallbackRate) && fallbackRate > 0) {
        return fallbackRate;
    }

    return null;
}

function formatCurrencyAmount(amount, currencyCode, locale) {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount)) {
        return '';
    }

    try {
        return new Intl.NumberFormat(locale || 'es-ES', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numericAmount);
    } catch (error) {
        console.warn('No se pudo formatear la moneda', currencyCode, error);
        return `${currencyCode} ${numericAmount.toFixed(2)}`;
    }
}

function buildPriceConversionChips(amountUSD) {
    const numericAmount = Number(amountUSD);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return '';
    }

    const chips = PRICE_CONVERSION_TARGETS.map((target) => {
        const rate = getEffectiveExchangeRate(target.code);
        if (!Number.isFinite(rate) || rate <= 0) {
            return null;
        }

        const convertedAmount = numericAmount * rate;
        const formattedAmount = formatCurrencyAmount(convertedAmount, target.code, target.locale);
        if (!formattedAmount) {
            return null;
        }

        const flagStyle = target.flagStyle ? ` style="background:${target.flagStyle};"` : '';

        return `
            <div class="flex w-full min-w-[200px] items-center gap-4 px-5 py-3 rounded-2xl bg-secondary/5 text-secondary text-[12px] font-semibold border border-secondary/10 shadow-sm">
                <span class="flex-none w-6 h-6 rounded-full border border-white/40 shadow-sm"${flagStyle} aria-hidden="true"></span>
                <span class="flex flex-col justify-center leading-tight text-[11px] text-left">
                    <span class="font-semibold text-[13px]">${formattedAmount}</span>
                    <span class="uppercase text-gray-500 font-medium tracking-wide">${target.label}</span>
                </span>
            </div>
        `;
    }).filter(Boolean);

    return chips.join('');
}

async function renderPriceConversionChips(amountUSD) {
    const container = document.getElementById('priceConversionChips');
    if (!container) {
        return;
    }

    const gridClasses = ['grid', 'grid-cols-1', 'sm:grid-cols-2', 'md:grid-cols-[repeat(3,minmax(220px,1fr))]', 'gap-4', 'sm:gap-5', 'lg:gap-6'];

    const numericAmount = Number(amountUSD);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        container.innerHTML = '';
        container.classList.remove(...gridClasses);
        return;
    }

    const hasRatesLoaded = Object.keys(exchangeRates).length > 0;
    if (!hasRatesLoaded) {
        container.innerHTML = '<p class="text-xs text-gray-500">Cargando conversiones...</p>';
        container.classList.remove(...gridClasses);
        try {
            await loadExchangeRates();
        } catch (error) {
            container.innerHTML = '<p class="text-xs text-red-600">No se pudieron cargar las conversiones.</p>';
            container.classList.remove(...gridClasses);
            return;
        }
    }

    const markup = buildPriceConversionChips(numericAmount);
    if (markup) {
        container.innerHTML = markup;
        container.classList.add(...gridClasses);
    } else {
        container.innerHTML = '<p class="text-xs text-gray-500">Conversiones no disponibles.</p>';
        container.classList.remove(...gridClasses);
    }
}

function resetCommentForm() {
    editingCommentId = null;

    const textarea = document.getElementById('commentText');
    if (textarea) {
        textarea.value = '';
    }

    const submitButton = document.getElementById('commentSubmitButton');
    if (submitButton) {
        submitButton.textContent = 'Comentar';
    }

    const cancelButton = document.getElementById('cancelCommentEditButton');
    if (cancelButton) {
        cancelButton.classList.add('hidden');
    }
}

function startEditingComment(comment) {
    if (!comment) return;

    const textarea = document.getElementById('commentText');
    const submitButton = document.getElementById('commentSubmitButton');
    const cancelButton = document.getElementById('cancelCommentEditButton');

    if (!textarea || !submitButton) return;

    editingCommentId = comment.id;
    textarea.value = comment.content || '';
    textarea.focus();

    submitButton.textContent = 'Guardar cambios';
    if (cancelButton) {
        cancelButton.classList.remove('hidden');
    }
}

function cancelCommentEdit() {
    resetCommentForm();
}

function updateQueryStringFromFilters(filters) {
    const params = new URLSearchParams();

    if (filters.search) {
        params.set('search', filters.search);
    }
    if (filters.category) {
        params.set('category', filters.category);
    }
    if (filters.level) {
        params.set('level', filters.level);
    }
    if (filters.promotions) {
        params.set('promotions', '1');
    }
    if (filters.favorites) {
        params.set('favorites', '1');
    }
    if (Number(filters.page) > 1) {
        params.set('page', String(filters.page));
    }

    const currentUrl = new URL(window.location.href);
    const queryString = params.toString();
    const newUrl = queryString
        ? `${currentUrl.pathname}?${queryString}${currentUrl.hash}`
        : `${currentUrl.pathname}${currentUrl.hash}`;

    window.history.replaceState({}, '', newUrl);
}

function resolveCourseImage(rawUrl) {
    const fallbackImage = courseFallbackImageUrl || DEFAULT_FALLBACK_COURSE_IMAGE;

    if (!rawUrl || typeof rawUrl !== 'string') {
        return getCacheSafeUrl(fallbackImage) || fallbackImage;
    }

    const trimmed = rawUrl.trim();
    if (!trimmed || trimmed.toLowerCase() === 'null') {
        return getCacheSafeUrl(fallbackImage) || fallbackImage;
    }

    return getCacheSafeUrl(trimmed);
}

// ============= UTILIDADES =============
function openModal(modalId) {
    document.getElementById(modalId + 'Modal').classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId + 'Modal').classList.add('hidden');
    if (modalId === 'courseDetail') {
        activeCourseDetail = null;
    }
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

// ============= ACTIVOS CORPORATIVOS =============
function getCacheSafeUrl(url) {
    if (!url) return '';
    return url.includes('?') ? `${url}&cb=${Date.now()}` : `${url}?cb=${Date.now()}`;
}

function selectAssetByType(assets, type) {
    if (!Array.isArray(assets)) return null;

    const filtered = assets
        .filter((asset) => asset?.type === type && asset?.image_url)
        .sort((a, b) => {
            const orderDiff = (a.display_order ?? 0) - (b.display_order ?? 0);
            if (orderDiff !== 0) return orderDiff;
            return (b.id ?? 0) - (a.id ?? 0);
        });

    return filtered.length ? filtered[0] : null;
}

function applyCompanyLogo(logoAsset) {
    if (!publicLogoImg || !publicLogoWrapper) return;

    if (logoAsset) {
        publicLogoImg.src = getCacheSafeUrl(logoAsset.image_url);
        publicLogoImg.alt = logoAsset.title || 'Logo principal';
        publicLogoImg.classList.remove('hidden');
        publicLogoWrapper.classList.remove('bg-gray-200');
        publicLogoWrapper.classList.add('bg-accent');
    } else {
        publicLogoImg.src = '';
        publicLogoImg.alt = 'Logo principal';
        publicLogoImg.classList.add('hidden');
        publicLogoWrapper.classList.add('bg-accent');
    }
}

function applyBrandImage(brandAsset) {
    if (!brandImageEl || !brandFallbackEl) return;

    if (brandAsset) {
        brandImageEl.src = getCacheSafeUrl(brandAsset.image_url);
        brandImageEl.alt = brandAsset.title || 'Marca institucional';
        brandImageEl.classList.remove('hidden');
        brandFallbackEl.classList.add('hidden');
    } else {
        brandImageEl.src = '';
        brandImageEl.alt = 'Marca institucional';
        brandImageEl.classList.add('hidden');
        brandFallbackEl.classList.remove('hidden');
    }
}

function applyCourseFallbackImage(fallbackAsset) {
    const fallbackUrl = fallbackAsset?.image_url || DEFAULT_FALLBACK_COURSE_IMAGE;
    if (courseFallbackImageUrl === fallbackUrl) {
        return false;
    }

    courseFallbackImageUrl = fallbackUrl;
    return true;
}

async function loadCompanyAssetsPublic() {
    try {
        const response = await fetchAPI('/company-assets');
        const assets = response.data || [];
        applyCompanyLogo(selectAssetByType(assets, 'logo'));
        applyBrandImage(selectAssetByType(assets, 'brand'));
        const fallbackChanged = applyCourseFallbackImage(selectAssetByType(assets, 'course_fallback'));

        if (fallbackChanged) {
            loadCourses(currentCourseFilters);
        }
    } catch (error) {
        console.error('Error al cargar assets corporativos:', error);
        applyCompanyLogo(null);
        applyBrandImage(null);
        const fallbackChanged = applyCourseFallbackImage(null);

        if (fallbackChanged) {
            loadCourses(currentCourseFilters);
        }
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
async function loadCourses(filters = currentCourseFilters) {
    const requestedPage = parseInt(filters.page, 10);

    currentCourseFilters = {
        search: filters.search || '',
        category: filters.category || '',
        level: filters.level || '',
        promotions: Boolean(filters.promotions),
        favorites: Boolean(filters.favorites),
        page: Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1
    };

    updateQueryStringFromFilters(currentCourseFilters);
    setFilterInputsFromState();
    try {
        let url = '/courses';
        const params = new URLSearchParams();

        if (currentCourseFilters.search) params.append('search', currentCourseFilters.search);
        if (currentCourseFilters.category) params.append('category', currentCourseFilters.category);
        if (currentCourseFilters.level) params.append('level', currentCourseFilters.level);
        params.append('per_page', '100');

        if (params.toString()) {
            url += '?' + params.toString();
        }

        const response = await fetchAPI(url);
        const rawCourses = response?.data?.data || response?.data || [];
        let courses = Array.isArray(rawCourses) ? rawCourses : [];

        if (currentCourseFilters.promotions) {
            courses = courses.filter((course) => {
                const priceValue = Number(course.price ?? 0);
                const discountValue = Number(course.discount_amount ?? 0);
                return discountValue > 0 && discountValue < priceValue;
            });
        }

        const publishedCourses = courses.filter((course) => isCoursePublished(course));

        lastLoadedCourses = publishedCourses;
        renderCourseSections(lastLoadedCourses);

    } catch (error) {
        console.error('Error al cargar cursos:', error);
        showNotification('Error al cargar cursos: ' + error.message, 'error');
    }
}

function buildPriceSection(course) {
    const priceValue = Number(course.price ?? 0);
    const discountValue = Number(course.discount_amount ?? 0);
    const discountPercent = Number(course.discount_percent ?? 0);
    const hasDiscount = discountValue > 0 && discountValue < priceValue;
    const finalPrice = hasDiscount ? Math.max(priceValue - discountValue, 0) : priceValue;
    const discountPercentLabel = formatPercent(discountPercent);
    const basePriceClasses = hasDiscount ? 'opacity-100 visible' : 'opacity-0 invisible';
    const priceColor = hasDiscount ? 'text-emerald-600' : 'text-secondary';
    const savingsVisibility = hasDiscount ? '' : 'invisible';

    return `
        <div class="flex flex-col items-end text-right gap-1 min-h-[88px]">
            <span class="text-sm text-gray-500 line-through ${basePriceClasses}">${formatUSD(priceValue)}</span>
            <span class="text-xl font-bold ${priceColor}">${formatUSD(finalPrice)}</span>
            <span class="inline-flex items-center justify-end text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full ${savingsVisibility}" aria-hidden="${hasDiscount ? 'false' : 'true'}">
                Ahorra ${formatUSD(discountValue)} · ${discountPercentLabel}
            </span>
        </div>
    `;
}

function isPromotionalCourse(course) {
    const priceValue = Number(course?.price ?? 0);
    const discountValue = Number(course?.discount_amount ?? 0);
    return discountValue > 0 && discountValue < priceValue;
}

function isCoursePublished(course) {
    const flag = course?.is_published;
    if (typeof flag === 'boolean') {
        return flag;
    }
    if (flag === 1 || flag === '1') {
        return true;
    }
    if (typeof flag === 'string') {
        return flag.toLowerCase() === 'true';
    }
    return false;
}

function sortCoursesByFavoritePriority(courses) {
    const cloned = [...courses];
    cloned.sort((a, b) => {
        const priorityA = a.is_favorite ? 0 : (isPromotionalCourse(a) ? 1 : 2);
        const priorityB = b.is_favorite ? 0 : (isPromotionalCourse(b) ? 1 : 2);

        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }

        return (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' });
    });

    return cloned;
}

function createCourseCard(course, options = {}) {
    const highlight = Boolean(options.highlight);
    const layout = options.layout === 'grid' ? 'grid' : 'carousel';
    const widthClasses = layout === 'grid' ? 'w-full' : 'min-w-[280px] max-w-[280px]';
    const elevationClass = highlight ? 'ring-2 ring-gray-500 shadow-[0_25px_40px_-25px_rgba(17,24,39,0.6)]' : 'shadow';
    const snapClass = layout === 'grid' ? '' : 'snap-start';

    const card = document.createElement('article');
    card.className = `${widthClasses} relative bg-white rounded-lg ${elevationClass} hover:shadow-xl transition cursor-pointer overflow-hidden flex flex-col ${snapClass}`.trim();
    card.classList.add('h-full');
    card.style.minHeight = '420px';
    if (layout === 'carousel') {
        card.style.height = '420px';
    }
    if (course?.id !== undefined) {
        card.dataset.courseId = course.id;
    }
    card.tabIndex = 0;
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-label', course.name);

    const resolvedImageUrl = resolveCourseImage(course.image_url);
    const fallbackImage = resolveCourseImage(null);

    card.innerHTML = `
        <div class="h-40 bg-gradient-to-br from-primary to-blue-900 flex items-center justify-center overflow-hidden">
            <img src="${resolvedImageUrl}" alt="${course.name}" class="w-full h-full object-cover" loading="lazy" onerror="this.src='${fallbackImage}';this.onerror=null;">
        </div>
        <div class="p-4 flex flex-col flex-1">
            <div class="space-y-2 flex-1">
                <h3 class="font-bold text-lg text-secondary leading-tight">${course.name}</h3>
                <p class="text-gray-600 text-sm line-clamp-3">${course.description}</p>
            </div>
            <div class="mt-4 flex items-center justify-between">
                <span class="inline-flex items-center text-xs font-semibold text-white bg-primary px-3 py-1 rounded-full uppercase tracking-wide">${course.level}</span>
                ${buildPriceSection(course)}
            </div>
        </div>
    `;

    if (course?.id !== undefined) {
        const commentCount = Number(course?.comments_count ?? course?.commentsCount ?? 0);
        const commentBadge = document.createElement('span');
        commentBadge.className = 'absolute top-3 left-3 z-10 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/95 text-secondary text-sm font-semibold shadow pointer-events-none';
        commentBadge.dataset.commentBadge = course.id;
        commentBadge.innerHTML = `&#128172; <span class="text-secondary text-base font-bold">${commentCount}</span>`;
        commentBadge.setAttribute('aria-label', `${commentCount} comentario${commentCount === 1 ? '' : 's'}`);
        commentBadge.title = `${commentCount} comentario${commentCount === 1 ? '' : 's'}`;
        card.appendChild(commentBadge);
    }

    if (course.is_favorite) {
        const favoriteBadge = document.createElement('span');
        favoriteBadge.className = 'absolute top-3 right-3 z-10 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/90 shadow text-rose-500 text-lg pointer-events-none';
        favoriteBadge.innerHTML = '&#10084;';
        favoriteBadge.dataset.favoriteBadge = course.id;
        favoriteBadge.setAttribute('aria-hidden', 'true');
        favoriteBadge.title = 'Curso en favoritos';
        card.appendChild(favoriteBadge);
    }

    const openDetail = () => showCourseDetail(course);
    card.addEventListener('click', openDetail);
    card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openDetail();
        }
    });

    return card;
}

function groupCoursesByCategory(courses) {
    const groups = new Map();

    courses.forEach((course) => {
        const categoryName = course.category?.name || 'Otros cursos';
        const categorySlug = course.category?.slug || slugify(categoryName);

        if (!groups.has(categorySlug)) {
            groups.set(categorySlug, {
                title: categoryName,
                slug: categorySlug,
                courses: []
            });
        }

        groups.get(categorySlug).courses.push(course);
    });

    return Array.from(groups.values()).sort((a, b) => a.title.localeCompare(b.title, 'es'));
}

function hasActiveCourseFilters() {
    return Boolean(
        currentCourseFilters.promotions ||
        currentCourseFilters.favorites ||
        currentCourseFilters.category ||
        currentCourseFilters.search ||
        currentCourseFilters.level
    );
}

function resolveFilteredCategoryName(courses) {
    if (!currentCourseFilters.category) {
        return '';
    }

    const matchingCourse = courses.find((course) => {
        const courseSlug = course.category?.slug;
        const courseId = course.category?.id;
        const target = currentCourseFilters.category;
        return courseSlug === target || String(courseId) === String(target);
    });

    if (matchingCourse?.category?.name) {
        return matchingCourse.category.name;
    }

    return courses[0]?.category?.name || '';
}

function buildFilteredSectionTitle(courses) {
    const parts = [];

    if (currentCourseFilters.favorites) {
        parts.push('Favoritos');
    }

    if (currentCourseFilters.promotions) {
        parts.push('Promociones');
    }

    if (currentCourseFilters.category) {
        const categoryName = resolveFilteredCategoryName(courses);
        parts.push(categoryName ? `Categoría: ${categoryName}` : 'Categoría seleccionada');
    }

    if (currentCourseFilters.level) {
        parts.push(`Nivel: ${currentCourseFilters.level}`);
    }

    if (currentCourseFilters.search) {
        parts.push(`Coincidencias con "${currentCourseFilters.search}"`);
    }

    if (!parts.length) {
        return 'Cursos filtrados';
    }

    if (
        parts.length === 1 &&
        currentCourseFilters.category &&
        !currentCourseFilters.promotions &&
        !currentCourseFilters.favorites &&
        !currentCourseFilters.level &&
        !currentCourseFilters.search
    ) {
        const categoryName = resolveFilteredCategoryName(courses);
        return categoryName ? `Cursos de ${categoryName}` : 'Cursos de la categoría seleccionada';
    }

    if (
        parts.length === 1 &&
        currentCourseFilters.favorites &&
        !currentCourseFilters.promotions &&
        !currentCourseFilters.category &&
        !currentCourseFilters.level &&
        !currentCourseFilters.search
    ) {
        return 'Tus cursos favoritos';
    }

    return parts.join(' · ');
}

function getPaginationPageRange(totalPages, currentPage) {
    if (totalPages <= 1) {
        return [1];
    }

    const delta = 1;
    const pages = new Set([1, totalPages]);
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);

    for (let page = start; page <= end; page += 1) {
        pages.add(page);
    }

    const sortedPages = Array.from(pages).sort((a, b) => a - b);
    const range = [];
    let lastPage = 0;

    sortedPages.forEach((page) => {
        if (lastPage) {
            if (page - lastPage === 2) {
                range.push(lastPage + 1);
            } else if (page - lastPage > 2) {
                range.push('ellipsis');
            }
        }

        range.push(page);
        lastPage = page;
    });

    return range;
}

function buildPaginationControls(totalPages, currentPage) {
    const nav = document.createElement('nav');
    nav.className = 'flex items-center justify-center gap-2 flex-wrap';
    nav.setAttribute('aria-label', 'Paginación de cursos');

    const createButton = (label, targetPage, { disabled = false, active = false, ariaLabel = '' } = {}) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.className = 'px-3 py-1 rounded border text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2';

        if (ariaLabel) {
            button.setAttribute('aria-label', ariaLabel);
        }

        if (active) {
            button.classList.add('bg-primary', 'text-white', 'border-primary', 'cursor-default');
            button.setAttribute('aria-current', 'page');
        } else {
            button.classList.add('bg-white', 'text-secondary', 'border-gray-300', 'hover:bg-gray-100');
        }

        if (disabled) {
            button.classList.add('opacity-50', 'cursor-not-allowed');
        } else if (!active) {
            button.addEventListener('click', () => goToCoursePage(targetPage));
        }

        return button;
    };

    const createEllipsis = () => {
        const span = document.createElement('span');
        span.className = 'px-2 text-sm text-gray-500';
        span.textContent = '...';
        span.setAttribute('aria-hidden', 'true');
        return span;
    };

    nav.appendChild(createButton('Anterior', currentPage - 1, {
        disabled: currentPage <= 1,
        ariaLabel: 'Página anterior'
    }));

    getPaginationPageRange(totalPages, currentPage).forEach((item) => {
        if (item === 'ellipsis') {
            nav.appendChild(createEllipsis());
            return;
        }

        nav.appendChild(createButton(String(item), item, {
            active: item === currentPage,
            ariaLabel: `Página ${item}`
        }));
    });

    nav.appendChild(createButton('Siguiente', currentPage + 1, {
        disabled: currentPage >= totalPages,
        ariaLabel: 'Página siguiente'
    }));

    return nav;
}

function goToCoursePage(targetPage) {
    if (!Array.isArray(lastLoadedCourses) || lastLoadedCourses.length === 0) {
        return;
    }

    if (!hasActiveCourseFilters()) {
        return;
    }

    const totalPages = Math.max(1, Math.ceil(lastLoadedCourses.length / GRID_ITEMS_PER_PAGE));
    const requestedPage = parseInt(targetPage, 10);
    const nextPage = Math.min(Math.max(Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1, 1), totalPages);
    const currentPage = parseInt(currentCourseFilters.page, 10) || 1;

    if (nextPage === currentPage) {
        return;
    }

    currentCourseFilters.page = nextPage;
    updateQueryStringFromFilters(currentCourseFilters);
    renderCourseSections(lastLoadedCourses);

    const targetOffset = courseSectionsContainer?.offsetTop || 0;
    window.scrollTo({ top: Math.max(0, targetOffset - 80), behavior: 'smooth' });
}

function renderCourseSections(courses) {
    if (!courseSectionsContainer) return;

    courseSectionsContainer.innerHTML = '';

    if (!Array.isArray(courses) || courses.length === 0) {
        courseSectionsContainer.innerHTML = '<p class="text-gray-600 text-center">No se encontraron cursos con los filtros seleccionados.</p>';
        return;
    }

    const filteredView = hasActiveCourseFilters();

    if (!filteredView && currentCourseFilters.page !== 1) {
        currentCourseFilters.page = 1;
        updateQueryStringFromFilters(currentCourseFilters);
    }

    if (filteredView) {
        const filteredSection = document.createElement('section');
        filteredSection.className = 'space-y-4';

        const header = document.createElement('header');
        header.className = 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2';

        const titleEl = document.createElement('h3');
        titleEl.className = 'text-2xl font-bold text-secondary';
        titleEl.textContent = buildFilteredSectionTitle(courses);
        header.appendChild(titleEl);

        const workingCourses = sortCoursesByFavoritePriority(courses);

        const totalCourses = workingCourses.length;
        const totalPages = Math.max(1, Math.ceil(totalCourses / GRID_ITEMS_PER_PAGE));
        let page = parseInt(currentCourseFilters.page, 10);
        if (!Number.isFinite(page) || page < 1) {
            page = 1;
        }
        if (page > totalPages) {
            page = totalPages;
        }
        if (page !== currentCourseFilters.page) {
            currentCourseFilters.page = page;
            updateQueryStringFromFilters(currentCourseFilters);
        }

        const startIndex = (page - 1) * GRID_ITEMS_PER_PAGE;
        const paginatedCourses = workingCourses.slice(startIndex, startIndex + GRID_ITEMS_PER_PAGE);
        const hasResults = paginatedCourses.length > 0;
        const firstItemIndex = hasResults ? startIndex + 1 : 0;
        const lastItemIndex = hasResults ? startIndex + paginatedCourses.length : 0;

        const countEl = document.createElement('span');
        countEl.className = 'text-sm text-gray-600';
        countEl.textContent = hasResults
            ? `Mostrando ${firstItemIndex}-${lastItemIndex} de ${totalCourses} curso${totalCourses === 1 ? '' : 's'}`
            : `${totalCourses} curso${totalCourses === 1 ? '' : 's'}`;
        header.appendChild(countEl);

        filteredSection.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3';

        paginatedCourses.forEach((course) => {
            grid.appendChild(createCourseCard(course, {
                layout: 'grid',
                highlight: currentCourseFilters.promotions
            }));
        });

        filteredSection.appendChild(grid);
        if (totalPages > 1) {
            filteredSection.appendChild(buildPaginationControls(totalPages, page));
        }
        courseSectionsContainer.appendChild(filteredSection);
        return;
    }

    const favoriteCourses = courses.filter((course) => Boolean(course.is_favorite));
    const favoriteIds = new Set(favoriteCourses.map((course) => course.id));

    if (favoriteCourses.length > 0) {
        courseSectionsContainer.appendChild(
            buildCarouselSection('Favoritos', favoriteCourses, {
                sectionId: 'favoritos',
                highlightCards: true,
                viewAllParams: { favorites: true }
            })
        );
    }

    const promotionalCourses = courses.filter((course) => {
        return !favoriteIds.has(course.id) && isPromotionalCourse(course);
    });

    if (promotionalCourses.length > 0) {
        courseSectionsContainer.appendChild(
            buildCarouselSection('Promociones', promotionalCourses, {
                sectionId: 'promociones',
                highlightCards: true,
                viewAllParams: { promotions: true }
            })
        );
    }

    const remainingCourses = courses.filter((course) => {
        return !favoriteIds.has(course.id) && !isPromotionalCourse(course);
    });

    if (remainingCourses.length > 0) {
        const groupedCategories = groupCoursesByCategory(remainingCourses);

        groupedCategories.forEach((group) => {
            courseSectionsContainer.appendChild(
                buildCarouselSection(group.title, group.courses, {
                    sectionId: group.slug,
                    viewAllParams: { category: group.slug }
                })
            );
        });
    }
}

function buildCarouselSection(title, courses, options = {}) {
    const section = document.createElement('section');
    section.className = 'space-y-4';

    const sectionId = `carousel-${options.sectionId || slugify(title)}`;
    const highlightCards = options.highlightCards || false;
    const showControls = courses.length > 3;

    const header = document.createElement('header');
    header.className = 'flex items-center justify-between';

    const titleEl = document.createElement('h3');
    titleEl.className = 'text-2xl font-bold text-secondary';
    titleEl.textContent = title;
    header.appendChild(titleEl);

    if (showControls) {
        const controlsWrapper = document.createElement('div');
        controlsWrapper.className = 'hidden sm:flex items-center space-x-2';

        const prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.className = 'p-2 rounded-full bg-gray-200 text-secondary hover:bg-gray-300 transition';
        prevBtn.innerHTML = '&#8592;';
        prevBtn.addEventListener('click', () => scrollCarousel(sectionId, -1));

        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'p-2 rounded-full bg-gray-200 text-secondary hover:bg-gray-300 transition';
        nextBtn.innerHTML = '&#8594;';
        nextBtn.addEventListener('click', () => scrollCarousel(sectionId, 1));

        controlsWrapper.appendChild(prevBtn);
        controlsWrapper.appendChild(nextBtn);
        header.appendChild(controlsWrapper);
    }

    section.appendChild(header);

    const carouselWrapper = document.createElement('div');
    carouselWrapper.className = 'relative';

    const track = document.createElement('div');
    track.id = sectionId;
    track.className = 'flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2';
    track.setAttribute('role', 'list');
    track.setAttribute('aria-label', title);

    courses.forEach((course) => {
        track.appendChild(createCourseCard(course, { highlight: highlightCards }));
    });

    carouselWrapper.appendChild(track);

    if (showControls) {
        const prevOverlay = document.createElement('button');
        prevOverlay.type = 'button';
        prevOverlay.className = 'hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white shadow border hover:bg-gray-100 transition';
        prevOverlay.innerHTML = '&#8592;';
        prevOverlay.addEventListener('click', () => scrollCarousel(sectionId, -1));

        const nextOverlay = document.createElement('button');
        nextOverlay.type = 'button';
        nextOverlay.className = 'hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white shadow border hover:bg-gray-100 transition';
        nextOverlay.innerHTML = '&#8594;';
        nextOverlay.addEventListener('click', () => scrollCarousel(sectionId, 1));

        carouselWrapper.appendChild(prevOverlay);
        carouselWrapper.appendChild(nextOverlay);
    }

    section.appendChild(carouselWrapper);

    const footer = document.createElement('div');
    footer.className = 'flex justify-end';

    const viewAllBtn = document.createElement('button');
    viewAllBtn.type = 'button';
    viewAllBtn.className = 'text-sm font-semibold text-primary hover:underline flex items-center space-x-1';
    viewAllBtn.innerHTML = '<span>Ver todos</span><span aria-hidden="true">&#8594;</span>';
    viewAllBtn.addEventListener('click', () => openCourseCollectionView(options.viewAllParams || {}));

    footer.appendChild(viewAllBtn);
    section.appendChild(footer);

    return section;
}

function scrollCarousel(trackId, direction) {
    const track = document.getElementById(trackId);
    if (!track) return;

    const scrollAmount = track.clientWidth * 0.85;
    track.scrollBy({ left: scrollAmount * direction, behavior: 'smooth' });
}

function openCourseCollectionView(params = {}) {
    const nextFilters = {
        search: params.search || '',
        category: params.category || '',
        level: params.level || '',
        promotions: Boolean(params.promotions),
        favorites: Boolean(params.favorites),
        page: 1
    };

    loadCourses(nextFilters);

    const targetOffset = courseSectionsContainer?.offsetTop || 0;
    window.scrollTo({ top: Math.max(0, targetOffset - 80), behavior: 'smooth' });
}

function slugify(text) {
    return (text || '')
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        || 'categoria';
}

// ============= CARGAR CATEGORÍAS =============
async function loadCategories() {
    try {
        const response = await fetchAPI('/categories');
        const categories = response.data || [];

        const select = document.getElementById('categoryFilter');
        if (!select) return;

        select.innerHTML = '<option value="">Todas las categorías</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.slug || category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });

        if (currentCourseFilters.category) {
            select.value = currentCourseFilters.category;
        }

    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
}

// ============= FILTRADO DE CURSOS =============
function collectFilterValues() {
    return {
        search: searchInput?.value?.trim() || '',
        category: categorySelect?.value || '',
        level: levelSelect?.value || ''
    };
}

function applyCourseFilters() {
    const nextFilters = {
        ...collectFilterValues(),
        promotions: currentCourseFilters.promotions || false,
        favorites: currentCourseFilters.favorites || false,
        page: 1
    };

    loadCourses(nextFilters);
}

document.getElementById('btnFilter').addEventListener('click', applyCourseFilters);

if (searchInput) {
    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            applyCourseFilters();
        }
    });
}

if (categorySelect) {
    categorySelect.addEventListener('change', applyCourseFilters);
}

if (levelSelect) {
    levelSelect.addEventListener('change', applyCourseFilters);
}

setFilterInputsFromState();

const clearFiltersButton = document.getElementById('btnClearFilters');
function clearCourseFilters() {
    if (searchInput) {
        searchInput.value = '';
    }
    if (categorySelect) {
        categorySelect.value = '';
    }
    if (levelSelect) {
        levelSelect.value = '';
    }
    currentCourseFilters.promotions = false;
    currentCourseFilters.favorites = false;
    currentCourseFilters.page = 1;
    applyCourseFilters();
}

if (clearFiltersButton) {
    clearFiltersButton.addEventListener('click', clearCourseFilters);
}

// ============= DETALLE DEL CURSO =============
async function showCourseDetail(course) {
    openModal('courseDetail');
    activeCourseDetail = { ...course };
    
    const contentDiv = document.getElementById('courseDetailContent');
    const priceValue = Number(course.price ?? 0);
    const discountValue = Number(course.discount_amount ?? 0);
    const discountPercent = Number(course.discount_percent ?? 0);
    const hasDiscount = discountValue > 0 && discountValue < priceValue;
    const finalPrice = hasDiscount ? Math.max(priceValue - discountValue, 0) : priceValue;
    const discountPercentLabel = formatPercent(discountPercent);
    
    const isFavorited = Boolean(course.is_favorite);
    const isEnrolled = Boolean(course.is_enrolled);
    const favoriteButtonConfig = getFavoriteButtonConfig(isFavorited);

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
                <h3 class="font-bold text-secondary mb-4">Comentarios (<span id="commentCountValue">${course.comments_count || 0}</span>)</h3>
                <div id="commentsList" class="space-y-3 mb-4 max-h-48 overflow-y-auto">
                    <!-- Los comentarios se cargarán aquí -->
                </div>
                
                ${currentUser ? `
                    <form id="commentForm" class="space-y-2">
                        <textarea id="commentText" placeholder="Escribe tu comentario (máx 200 caracteres)..." class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary text-sm" maxlength="200" required></textarea>
                        <div class="flex items-center gap-2 flex-wrap">
                            <button type="submit" id="commentSubmitButton" class="px-4 py-2 bg-accent text-secondary rounded text-sm font-bold hover:bg-opacity-90 transition">
                                Comentar
                            </button>
                            <button type="button" id="cancelCommentEditButton" class="px-4 py-2 text-secondary border border-gray-300 rounded text-sm font-semibold hover:bg-gray-100 transition hidden">
                                Cancelar
                            </button>
                        </div>
                    </form>
                ` : `
                    <p class="text-gray-600 text-sm">Inicia sesión para comentar</p>
                `}
            </div>

            <div class="border-t pt-4 flex flex-col gap-6">
                <div class="w-full space-y-2">
                    ${hasDiscount ? `
                        <p class="text-sm text-gray-500 line-through">${formatUSD(priceValue)}</p>
                    ` : ''}
                    <p class="text-3xl font-bold text-emerald-600">${formatUSD(finalPrice)}</p>
                    <div id="priceConversionChips" class="mt-3 text-xs text-gray-500" aria-label="Conversión por país">
                        <p class="text-xs text-gray-500">Cargando conversiones...</p>
                    </div>
                    ${hasDiscount ? `
                        <span class="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                            Ahorra ${formatUSD(discountValue)} · ${discountPercentLabel} menos
                        </span>
                    ` : ''}
                </div>
                <div class="w-full flex flex-col sm:flex-row sm:items-center gap-3">
                    ${currentUser ? `
                        <button class="px-4 sm:px-5 bg-primary text-white rounded hover:bg-primary/90 transition font-semibold w-full sm:w-auto sm:min-w-[200px] h-11 sm:h-12 flex items-center justify-center gap-2 text-center" onclick="enrollCourse(${course.id})">
                            Inscribirse
                        </button>
                        <button id="favoriteToggleButton" type="button" class="${favoriteButtonConfig.classes}" data-course-id="${course.id}" data-favorite="${isFavorited ? '1' : '0'}" onclick="toggleFavorite(${course.id})">
                            <span aria-hidden="true">${favoriteButtonConfig.icon}</span>
                            <span>${favoriteButtonConfig.label}</span>
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
    const commentForm = document.getElementById('commentForm');
    if (commentForm) {
        commentForm.addEventListener('submit', (event) => submitComment(event, course.id));
    }

    const cancelEditButton = document.getElementById('cancelCommentEditButton');
    if (cancelEditButton) {
        cancelEditButton.addEventListener('click', cancelCommentEdit);
    }

    resetCommentForm();
    renderPriceConversionChips(finalPrice);

    // Cargar comentarios
    loadComments(course.id);
}

async function loadComments(courseId) {
    try {
        const response = await fetchAPI(`/comments/${courseId}`);
        const payload = response?.data;
        let comments = [];
        let totalCount = 0;

        if (payload && Array.isArray(payload.data)) {
            comments = payload.data;
            totalCount = Number(payload.total ?? payload.data.length ?? 0);
        } else if (Array.isArray(payload)) {
            comments = payload;
            totalCount = comments.length;
        } else if (Array.isArray(response)) {
            comments = response;
            totalCount = comments.length;
        }

        if (!Array.isArray(comments)) {
            comments = [];
        }

        if (!Number.isFinite(totalCount)) {
            totalCount = comments.length;
        }

        const container = document.getElementById('commentsList');
        if (!container) return;

        container.innerHTML = '';

        if (comments.length === 0) {
            container.innerHTML = '<p class="text-gray-600 text-sm">No hay comentarios aún. ¡Sé el primero!</p>';
        } else {
            comments.forEach((comment) => {
                const safeContent = typeof comment.content === 'string' ? comment.content : '';
                const commentDiv = document.createElement('div');
                commentDiv.className = 'bg-gray-50 p-3 rounded text-sm space-y-2';

                const header = document.createElement('div');
                header.className = 'flex justify-between items-start gap-2';

                const author = document.createElement('p');
                author.className = 'font-bold text-secondary';
                author.textContent = comment?.user?.name || 'Usuario';
                header.appendChild(author);

                const canEdit = currentUser && currentUser.id === comment.user_id;
                const canDelete = currentUser && (currentUser.id === comment.user_id || currentUser.role === 'admin');

                if (canEdit || canDelete) {
                    const actions = document.createElement('div');
                    actions.className = 'flex items-center gap-2';

                    if (canEdit) {
                        const editButton = document.createElement('button');
                        editButton.type = 'button';
                        editButton.className = 'text-primary hover:underline text-xs font-semibold';
                        editButton.textContent = 'Editar';
                        editButton.addEventListener('click', () => startEditingComment({ id: comment.id, content: safeContent }));
                        actions.appendChild(editButton);
                    }

                    if (canDelete) {
                        const deleteButton = document.createElement('button');
                        deleteButton.type = 'button';
                        deleteButton.className = 'text-red-600 hover:underline text-xs font-semibold';
                        deleteButton.textContent = 'Eliminar';
                        deleteButton.addEventListener('click', () => deleteComment(comment.id, courseId));
                        actions.appendChild(deleteButton);
                    }

                    header.appendChild(actions);
                }

                commentDiv.appendChild(header);

                const body = document.createElement('p');
                body.className = 'text-gray-700';
                body.textContent = safeContent;
                commentDiv.appendChild(body);

                container.appendChild(commentDiv);
            });
        }

        if (editingCommentId && !comments.some((item) => item.id === editingCommentId)) {
            cancelCommentEdit();
        }

        updateCourseDetailCommentsHeader(totalCount);
        updateLocalCourseCommentCount(courseId, totalCount);
        updateCourseCardCommentCount(courseId, totalCount);

        if (activeCourseDetail?.id === courseId) {
            activeCourseDetail = { ...activeCourseDetail, comments_count: totalCount };
        }
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

        const enrolledCourse =
            (activeCourseDetail && activeCourseDetail.id === courseId)
                ? activeCourseDetail
                : lastLoadedCourses.find((course) => course.id === courseId);

        showEnrollmentConfirmation(enrolledCourse);
        
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
        const response = await fetchAPI('/favorites', {
            method: 'POST',
            body: JSON.stringify({ course_id: courseId })
        });

        const courseIndex = lastLoadedCourses.findIndex((course) => course.id === courseId);
        const prevFavoriteState = courseIndex !== -1
            ? Boolean(lastLoadedCourses[courseIndex].is_favorite)
            : Boolean(activeCourseDetail?.is_favorite);
        const responseFavoriteState = response?.is_favorite;
        const newFavoriteState = typeof responseFavoriteState === 'boolean' ? responseFavoriteState : !prevFavoriteState;
        const feedbackMessage = response.message || (newFavoriteState ? 'Curso agregado a favoritos' : 'Curso removido de favoritos');

        updateCourseDetailFavoriteState(newFavoriteState);
        if (courseIndex !== -1) {
            lastLoadedCourses[courseIndex] = {
                ...lastLoadedCourses[courseIndex],
                is_favorite: newFavoriteState
            };
        }

        if (activeCourseDetail?.id === courseId) {
            activeCourseDetail = { ...activeCourseDetail, is_favorite: newFavoriteState };
        }

        updateCourseCardFavoriteState(courseId, newFavoriteState);
        renderCourseSections(lastLoadedCourses);

        showNotification(feedbackMessage);
        
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

    const textarea = document.getElementById('commentText');
    if (!textarea) return;

    const content = (textarea.value || '').trim();
    if (!content) {
        showNotification('El comentario no puede estar vacío', 'error');
        return;
    }

    const isEditing = Boolean(editingCommentId);
    const endpoint = isEditing ? `/comments/${editingCommentId}` : '/comments';
    const method = isEditing ? 'PUT' : 'POST';
    const payload = isEditing
        ? { content }
        : { course_id: courseId, content };

    try {
        const response = await fetchAPI(endpoint, {
            method,
            body: JSON.stringify(payload)
        });

        const message = response?.message || (isEditing ? 'Comentario actualizado correctamente' : 'Comentario agregado correctamente');

        resetCommentForm();
        await loadComments(courseId);
        showNotification(message);
        
    } catch (error) {
        showNotification('Error al guardar comentario: ' + error.message, 'error');
    }
}

async function deleteComment(commentId, courseId = null) {
    if (!confirm('¿Deseas eliminar este comentario?')) {
        return;
    }

    try {
        await fetchAPI(`/comments/${commentId}`, {
            method: 'DELETE'
        });

        if (editingCommentId === commentId) {
            cancelCommentEdit();
        }

        const targetCourseId = courseId || activeCourseDetail?.id;
        if (targetCourseId) {
            await loadComments(targetCourseId);
        }

        showNotification('Comentario eliminado');
        
    } catch (error) {
        showNotification('Error al eliminar comentario: ' + error.message, 'error');
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
                promptLogoutConfirmation();
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
    menuHTML += '<button onclick="promptLogoutConfirmation()" class="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 transition">Cerrar Sesión</button>';
    
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

function promptLogoutConfirmation() {
    const shouldLogout = confirm('¿Deseas cerrar sesión?');
    if (shouldLogout) {
        logout();
    }
}

function getCompanyLogoUrl() {
    if (publicLogoImg && publicLogoImg.src) {
        return publicLogoImg.src;
    }
    if (brandImageEl && brandImageEl.src) {
        return brandImageEl.src;
    }
    return null;
}

function closeEnrollmentConfirmation() {
    const overlay = document.getElementById('enrollmentConfirmationOverlay');
    if (overlay) {
        overlay.remove();
    }
    document.body.classList.remove('overflow-hidden');
}

function showEnrollmentConfirmation(course) {
    closeEnrollmentConfirmation();

    const overlay = document.createElement('div');
    overlay.id = 'enrollmentConfirmationOverlay';
    overlay.className = 'fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm';

    const logoUrl = getCompanyLogoUrl();
    const userName = currentUser?.name || '¡Felicitaciones!';
    const userEmail = currentUser?.email || 'tu correo registrado';
    const courseName = course?.name || 'este curso';

    overlay.innerHTML = `
        <div class="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-8 sm:p-10 text-center space-y-6">
            <button type="button" class="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition" aria-label="Cerrar" data-close>
                &times;
            </button>
            <div class="flex justify-center">
                ${logoUrl
                    ? `<img src="${logoUrl}" alt="Logo institucional" class="max-h-16 object-contain" loading="lazy">`
                    : '<div class="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-secondary font-bold text-xl">EITC</div>'}
            </div>
            <div class="space-y-3">
                <h3 class="text-2xl font-extrabold text-secondary">¡Felicitaciones, ${userName}!</h3>
                <p class="text-gray-700 text-base">Te acabas de inscribir al curso:</p>
                <p class="text-xl font-bold text-primary">${courseName}</p>
            </div>
            <div class="bg-accent/10 border border-accent/20 rounded-2xl px-5 py-4 text-sm text-secondary">
                <p class="font-semibold">Revisa tu bandeja.</p>
                <p class="mt-1">Recibirás a tu correo <span class="font-bold">${userEmail}</span> más detalles de tu inscripción.</p>
            </div>
            <div class="rounded-2xl border border-gray-200 px-5 py-4 bg-gray-50 text-sm text-gray-600">
                <p>¿Tienes dudas? Llámanos al <span class="font-semibold text-secondary">+09 9999 9999</span> y resolveremos tus dudas.</p>
            </div>
            <div class="flex items-center justify-center gap-3">
                <button type="button" class="px-5 py-2.5 rounded-full bg-primary text-white font-semibold shadow hover:bg-primary/90 transition" data-close>
                    ¡Entendido!
                </button>
            </div>
        </div>
    `;

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay || event.target.closest('[data-close]')) {
            closeEnrollmentConfirmation();
        }
    });

    document.body.appendChild(overlay);
    document.body.classList.add('overflow-hidden');
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
    loadCompanyAssetsPublic();
});
