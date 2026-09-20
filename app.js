/**
 * CineTrack - Aplicación Principal y Controlador de UI
 */

document.addEventListener('DOMContentLoaded', () => {
  // Estado global de la aplicación
  const state = {
    typeFilter: 'all',          // 'all', 'movie', 'series'
    statusFilter: 'all',        // 'all', 'watching', 'plan_to_watch', 'completed', 'favorites'
    movieGenreFilter: 'all',    // 'all' o un género específico como 'Ciencia Ficción'
    seriesGenreFilter: 'all',   // igual que movieGenreFilter, pero para series
    customGenreNames: {},       // identificador -> texto original de cada género personalizado
    searchFilter: '',           // Filtro de texto en la biblioteca guardada
    sortBy: 'recent',           // recent, rating, title, year
    apiSearchResults: [],       // Resultados temporales de búsqueda en APIs
    activeModalItem: null,      // Ítem actualmente abierto para editar/ver
    isSearchingApi: false
  };

  // Elementos DOM principales
  const DOM = {
    // Stats Dashboard

    // Selectores de tipo y estado
    typeTabs: document.querySelectorAll('.type-tab-btn'),
    statusTabs: document.querySelectorAll('.status-tab-btn'),
    statusFilterSelect: document.getElementById('statusFilterSelect'),
    typeCountAll: document.getElementById('typeCountAll'),
    typeCountMovies: document.getElementById('typeCountMovies'),
    typeCountSeries: document.getElementById('typeCountSeries'),

    // Contenedores divididos de catálogo
    seriesSection: document.getElementById('seriesSection'),
    seriesGrid: document.getElementById('seriesGrid'),
    seriesCountBadge: document.getElementById('seriesCountBadge'),
    seriesSectionSub: document.getElementById('seriesSectionSub'),
    viewOnlySeriesBtn: document.getElementById('viewOnlySeriesBtn'),

    moviesSection: document.getElementById('moviesSection'),
    moviesGrid: document.getElementById('moviesGrid'),
    moviesCountBadge: document.getElementById('moviesCountBadge'),
    moviesSectionSub: document.getElementById('moviesSectionSub'),
    viewOnlyMoviesBtn: document.getElementById('viewOnlyMoviesBtn'),
    movieGenreBar: document.getElementById('movieGenreBar'),
    movieGenrePills: document.getElementById('movieGenrePills'),
    toggleMovieGenresBtn: document.getElementById('toggleMovieGenresBtn'),
    movieGenrePillsContainer: document.getElementById('movieGenrePillsContainer'),
    movieGenreIcon: document.getElementById('movieGenreIcon'),
    seriesGenreBar: document.getElementById('seriesGenreBar'),
    seriesGenrePills: document.getElementById('seriesGenrePills'),
    toggleSeriesGenresBtn: document.getElementById('toggleSeriesGenresBtn'),
    seriesGenrePillsContainer: document.getElementById('seriesGenrePillsContainer'),
    seriesGenreIcon: document.getElementById('seriesGenreIcon'),

    catalogDivider: document.getElementById('catalogDivider'),

    // Empty state y controles
    emptyState: document.getElementById('emptyState'),
    emptyStateTitle: document.getElementById('emptyStateTitle'),
    emptyStateDesc: document.getElementById('emptyStateDesc'),
    searchInput: document.getElementById('searchInput'),
    sortSelect: document.getElementById('sortSelect'),
    movieGenreSelect: document.getElementById('movieGenreSelect'),

    // API Search Modal
    searchModal: document.getElementById('searchModal'),
    openSearchModalBtn: document.getElementById('openSearchModalBtn'),
    heroSearchBtn: document.getElementById('heroSearchBtn'),
    closeSearchModalBtn: document.getElementById('closeSearchModalBtn'),
    apiSearchInput: document.getElementById('apiSearchInput'),
    apiFilterSelect: document.getElementById('apiFilterSelect'),
    apiSearchResults: document.getElementById('apiSearchResults'),
    apiSearchLoading: document.getElementById('apiSearchLoading'),
    apiSearchEmpty: document.getElementById('apiSearchEmpty'),

    // Edit/Detail Modal
    editModal: document.getElementById('editModal'),
    closeEditModalBtn: document.getElementById('closeEditModalBtn'),
    editForm: document.getElementById('editForm'),
    deleteItemBtn: document.getElementById('deleteItemBtn'),

    // Manual Add Modal
    manualModal: document.getElementById('manualModal'),
    openManualModalBtn: document.getElementById('openManualModalBtn'),
    closeManualModalBtn: document.getElementById('closeManualModalBtn'),
    manualForm: document.getElementById('manualForm'),

    // Backup & Settings
    optionsDropdownBtn: document.getElementById('optionsDropdownBtn'),
    optionsDropdownMenu: document.getElementById('optionsDropdownMenu'),
    exportBtn: document.getElementById('exportBtn'),
    importBtn: document.getElementById('importBtn'),
    importFileInput: document.getElementById('importFileInput'),
    resetDemoBtn: document.getElementById('resetDemoBtn'),

    // Clave de TMDB
    apiKeyBtn: document.getElementById('apiKeyBtn'),
    apiKeyMenuState: document.getElementById('apiKeyMenuState'),
    apiKeyModal: document.getElementById('apiKeyModal'),
    closeApiKeyModalBtn: document.getElementById('closeApiKeyModalBtn'),
    apiKeyForm: document.getElementById('apiKeyForm'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    apiKeyStatus: document.getElementById('apiKeyStatus'),
    apiKeyStatusDot: document.getElementById('apiKeyStatusDot'),
    deleteApiKeyBtn: document.getElementById('deleteApiKeyBtn'),

    // Toast
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage')
  };

  // ==========================================
  // TEXTOS DE DATOS GUARDADOS
  // ==========================================
  // Las fichas guardadas antes de existir el selector de idioma pueden llevar
  // el aviso de "sin sinopsis" o nombres genéricos de episodio en español:
  // se reconocen y se muestran en el idioma activo.
  const LEGACY_NO_SYNOPSIS = ['Sin descripción disponible.', 'Sin sinopsis disponible.'];

  function getSummary(item) {
    const text = ((item && item.summary) || '').trim();
    return (!text || LEGACY_NO_SYNOPSIS.includes(text)) ? t('detail.noSynopsis') : text;
  }

  // Los filtros de género usan un identificador: los géneros conocidos se unifican
  // entre idiomas ("k:scifi"); los personalizados se distinguen por su texto ("c:...").
  function genreName(identity) {
    const known = GENRES.labelForIdentity(identity);
    if (known) return known;
    return state.customGenreNames[identity] || String(identity).slice(2);
  }

  function itemHasGenre(item, identity) {
    return Array.isArray(item.genres) && item.genres.some(g => GENRES.identity(g) === identity);
  }

  function episodeName(ep) {
    const name = ((ep && ep.name) || '').trim();
    if (!name || /^(Cap[ií]tulo|Episodio) \d+$/.test(name)) return t('ep.default', { n: ep.number });
    return name;
  }

  // ==========================================
  // NOTIFICACIONES TOAST
  // ==========================================
  function showToast(message, type = 'success') {
    if (!DOM.toast) return;
    DOM.toastMessage.textContent = message;
    
    DOM.toast.className = 'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl transition-all duration-300 transform translate-y-0 opacity-100 font-medium text-sm ' + 
      (type === 'error' ? 'bg-rose-600 text-white shadow-rose-900/40' : 'bg-amber-500 text-slate-950 font-bold shadow-amber-950/40');

    setTimeout(() => {
      DOM.toast.className = 'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl transition-all duration-300 transform translate-y-8 opacity-0 pointer-events-none';
    }, 3200);
  }

  // ==========================================
  // CONTADORES DE LAS PESTAÑAS PRINCIPALES
  // ==========================================
  function renderStats() {
    const stats = STORAGE_SERVICE.calculateStats();
    if (DOM.typeCountAll) DOM.typeCountAll.textContent = stats.total;
    if (DOM.typeCountMovies) DOM.typeCountMovies.textContent = stats.moviesCount;
    if (DOM.typeCountSeries) DOM.typeCountSeries.textContent = stats.seriesCount;
  }

  // ==========================================
  // RENDERIZADO DE LA BIBLIOTECA (DIVIDIDA)
  // ==========================================
  function renderLibrary() {
    renderStats();
    const allItems = STORAGE_SERVICE.getItems();

    // 1. Filtrar por estado
    let filteredItems = allItems;
    if (state.statusFilter === 'watching') {
      filteredItems = filteredItems.filter(i => i.status === 'watching');
    } else if (state.statusFilter === 'plan_to_watch') {
      filteredItems = filteredItems.filter(i => i.status === 'plan_to_watch');
    } else if (state.statusFilter === 'completed') {
      filteredItems = filteredItems.filter(i => i.status === 'completed');
    } else if (state.statusFilter === 'favorites') {
      filteredItems = filteredItems.filter(i => i.favorite);
    }

    // 2. Filtrar por búsqueda en tiempo real
    if (state.searchFilter.trim()) {
      const q = state.searchFilter.toLowerCase();
      filteredItems = filteredItems.filter(i => 
        i.title.toLowerCase().includes(q) || 
        (i.genres && i.genres.some(g => g.toLowerCase().includes(q) || GENRES.label(g).toLowerCase().includes(q))) ||
        (i.platform && i.platform.toLowerCase().includes(q))
      );
    }

    // 3. Ordenar
    const sortFn = (a, b) => {
      if (state.sortBy === 'recent') return (b.createdAt || 0) - (a.createdAt || 0);
      if (state.sortBy === 'rating') return (b.userRating || 0) - (a.userRating || 0);
      if (state.sortBy === 'title') return a.title.localeCompare(b.title, I18N.locale);
      if (state.sortBy === 'year') return (b.year || '').localeCompare(a.year || '');
      return 0;
    };
    filteredItems.sort(sortFn);

    // Separar en series y películas
    const seriesList = filteredItems.filter(i => i.type === 'series');
    let moviesList = filteredItems.filter(i => i.type === 'movie');
    const totalMoviesInLibrary = allItems.filter(i => i.type === 'movie').length;
    const totalSeriesInLibrary = allItems.filter(i => i.type === 'series').length;

    // Actualizar controles y pills de género (películas y series)
    updateGenreFilterUI({
      items: allItems,
      type: 'movie',
      stateKey: 'movieGenreFilter',
      barEl: DOM.movieGenreBar,
      pillsEl: DOM.movieGenrePills,
      selectEl: DOM.movieGenreSelect,
      activePillClass: GENRE_PILL_ACTIVE_ORANGE,
      inactivePillClass: GENRE_PILL_INACTIVE
    });
    updateGenreFilterUI({
      items: allItems,
      type: 'series',
      stateKey: 'seriesGenreFilter',
      barEl: DOM.seriesGenreBar,
      pillsEl: DOM.seriesGenrePills,
      selectEl: null,
      activePillClass: GENRE_PILL_ACTIVE_AMBER,
      inactivePillClass: GENRE_PILL_INACTIVE
    });

    // Filtrar películas por género si está activo
    const isGenreActive = state.movieGenreFilter && state.movieGenreFilter !== 'all';
    let displayedMovies = moviesList;
    if (isGenreActive) {
      displayedMovies = moviesList.filter(m => itemHasGenre(m, state.movieGenreFilter));
    }

    // Filtrar series por género si está activo
    const isSeriesGenreActive = state.seriesGenreFilter && state.seriesGenreFilter !== 'all';
    let displayedSeries = seriesList;
    if (isSeriesGenreActive) {
      displayedSeries = seriesList.filter(sItem => itemHasGenre(sItem, state.seriesGenreFilter));
    }

    // Determinar qué secciones mostrar según el filtro de tipo
    const showSeries = (state.typeFilter === 'all' || state.typeFilter === 'series') && (seriesList.length > 0 || (isSeriesGenreActive && totalSeriesInLibrary > 0));
    const showMovies = (state.typeFilter === 'all' || state.typeFilter === 'movie') && (moviesList.length > 0 || (isGenreActive && totalMoviesInLibrary > 0));

    const totalVisible = (state.typeFilter === 'series'
      ? displayedSeries.length
      : (state.typeFilter === 'movie' ? displayedMovies.length : (displayedSeries.length + displayedMovies.length)));

    // Si no hay resultados visibles
    if (totalVisible === 0 && !isGenreActive && !isSeriesGenreActive) {
      if (DOM.seriesSection) DOM.seriesSection.classList.add('hidden');
      if (DOM.moviesSection) DOM.moviesSection.classList.add('hidden');
      if (DOM.catalogDivider) DOM.catalogDivider.classList.add('hidden');
      if (DOM.emptyState) DOM.emptyState.classList.remove('hidden');

      if (state.typeFilter === 'movie') {
        if (DOM.emptyStateTitle) DOM.emptyStateTitle.textContent = t('empty.movies.title');
        if (DOM.emptyStateDesc) DOM.emptyStateDesc.textContent = t('empty.movies.desc');
      } else if (state.typeFilter === 'series') {
        if (DOM.emptyStateTitle) DOM.emptyStateTitle.textContent = t('empty.series.title');
        if (DOM.emptyStateDesc) DOM.emptyStateDesc.textContent = t('empty.series.desc');
      } else {
        if (DOM.emptyStateTitle) DOM.emptyStateTitle.textContent = t('empty.all.title');
        if (DOM.emptyStateDesc) DOM.emptyStateDesc.textContent = t('empty.all.desc');
      }
      return;
    }

    if (DOM.emptyState) DOM.emptyState.classList.add('hidden');

    // Renderizar sección de Series
    if (showSeries) {
      DOM.seriesSection.classList.remove('hidden');
      if (DOM.seriesCountBadge) {
        DOM.seriesCountBadge.textContent = isSeriesGenreActive
          ? t('section.genreCount', { a: displayedSeries.length, b: seriesList.length, genre: genreName(state.seriesGenreFilter) })
          : tp('count.series', seriesList.length);
      }
      if (DOM.seriesSectionSub) {
        const epWatched = displayedSeries.reduce((acc, s) => acc + (s.currentEpisode || 0), 0);
        DOM.seriesSectionSub.textContent = (isSeriesGenreActive
          ? tp('series.ofGenre', displayedSeries.length, { genre: genreName(state.seriesGenreFilter) })
          : t('series.tracking', { n: seriesList.length })) + ' • ' + tp('count.episodesWatched', epWatched);
      }
      if (DOM.viewOnlySeriesBtn) {
        DOM.viewOnlySeriesBtn.classList.toggle('hidden', state.typeFilter === 'series');
      }

      DOM.seriesGrid.innerHTML = '';
      if (displayedSeries.length === 0 && isSeriesGenreActive) {
        DOM.seriesGrid.innerHTML = `
          <div class="col-span-full py-12 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800/80 p-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 mx-auto mb-2 text-amber-400/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            <p class="font-bold text-white text-sm">${t('genre.emptySeries', { genre: genreName(state.seriesGenreFilter) })}</p>
            <p class="text-xs text-slate-500 mt-1">${t('genre.emptyHint')}</p>
            <button id="resetSeriesGenreBtn" class="mt-3.5 text-xs font-bold px-4 py-2 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all shadow-md shadow-amber-500/20 cursor-pointer">
              ${t('genre.viewAll')}
            </button>
          </div>
        `;
        const resetSeriesBtn = DOM.seriesGrid.querySelector('#resetSeriesGenreBtn');
        if (resetSeriesBtn) {
          resetSeriesBtn.addEventListener('click', () => {
            state.seriesGenreFilter = 'all';
            renderLibrary();
          });
        }
      } else {
        displayedSeries.forEach(item => DOM.seriesGrid.appendChild(createItemCard(item)));
      }
    } else {
      DOM.seriesSection.classList.add('hidden');
    }

    // Separador decorativo (solo si ambas secciones están visibles a la vez en "all")
    if (showSeries && showMovies && state.typeFilter === 'all') {
      DOM.catalogDivider.classList.remove('hidden');
    } else {
      DOM.catalogDivider.classList.add('hidden');
    }

    // Renderizar sección de Películas
    if (showMovies) {
      DOM.moviesSection.classList.remove('hidden');
      if (DOM.moviesCountBadge) {
        DOM.moviesCountBadge.textContent = isGenreActive
          ? t('section.genreCount', { a: displayedMovies.length, b: moviesList.length, genre: genreName(state.movieGenreFilter) })
          : tp('count.movies', moviesList.length);
      }
      if (DOM.moviesSectionSub) {
        let totalMins = 0;
        displayedMovies.forEach(m => {
          if (m.durationMinutes) totalMins += Number(m.durationMinutes);
          else if (m.duration) {
            const match = String(m.duration).match(/(\d+)/);
            if (match) totalMins += parseInt(match[1], 10);
          }
        });
        const hoursPart = totalMins > 0 ? ' • ' + t('movies.runtime', { h: Math.round(totalMins / 60), m: totalMins % 60 }) : '';
        DOM.moviesSectionSub.textContent = (isGenreActive
          ? tp('movies.ofGenre', displayedMovies.length, { genre: genreName(state.movieGenreFilter) })
          : tp('count.features', moviesList.length)) + hoursPart;
      }
      if (DOM.viewOnlyMoviesBtn) {
        DOM.viewOnlyMoviesBtn.classList.toggle('hidden', state.typeFilter === 'movie');
      }

      DOM.moviesGrid.innerHTML = '';
      if (displayedMovies.length === 0 && isGenreActive) {
        DOM.moviesGrid.innerHTML = `
          <div class="col-span-full py-12 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800/80 p-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 mx-auto mb-2 text-orange-400/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            <p class="font-bold text-white text-sm">${t('genre.emptyMovies', { genre: genreName(state.movieGenreFilter) })}</p>
            <p class="text-xs text-slate-500 mt-1">${t('genre.emptyHint')}</p>
            <button id="resetMovieGenreBtn" class="mt-3.5 text-xs font-bold px-4 py-2 rounded-xl bg-orange-500 text-slate-950 hover:bg-orange-400 transition-all shadow-md shadow-orange-500/20 cursor-pointer">
              ${t('genre.viewAll')}
            </button>
          </div>
        `;
        const resetBtn = DOM.moviesGrid.querySelector('#resetMovieGenreBtn');
        if (resetBtn) {
          resetBtn.addEventListener('click', () => {
            state.movieGenreFilter = 'all';
            if (DOM.movieGenreSelect) DOM.movieGenreSelect.value = 'all';
            renderLibrary();
          });
        }
      } else {
        displayedMovies.forEach(item => DOM.moviesGrid.appendChild(createItemCard(item)));
      }
    } else {
      DOM.moviesSection.classList.add('hidden');
    }
  }

  // ==========================================
  // FILTRO DINÁMICO DE GÉNEROS (PELÍCULAS Y SERIES)
  // ==========================================
  // Los géneros son texto libre: cualquiera que se escriba en el campo
  // "Género(s)" del formulario de edición o de alta manual aparece aquí
  // automáticamente como una píldora de filtro más, sin necesidad de
  // configurarlo en ningún sitio.
  const GENRE_PILL_ACTIVE_ORANGE = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20 border border-orange-400 transition-all cursor-pointer flex items-center gap-1.5 shrink-0';
  const GENRE_PILL_ACTIVE_AMBER = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 border border-amber-400 transition-all cursor-pointer flex items-center gap-1.5 shrink-0';
  const GENRE_PILL_INACTIVE = 'px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer flex items-center gap-1.5 shrink-0';

  function updateGenreFilterUI({ items, type, stateKey, barEl, pillsEl, selectEl, activePillClass, inactivePillClass }) {
    const filtered = items.filter(i => i.type === type);

    if (barEl) barEl.classList.toggle('hidden', filtered.length === 0);
    if (selectEl) selectEl.classList.toggle('hidden', filtered.length === 0);

    if (filtered.length === 0) {
      state[stateKey] = 'all';
      return;
    }

    // Contar títulos por género. Los géneros conocidos se unifican entre idiomas
    // ("Ciencia Ficción" = "Science Fiction"); los personalizados se cuentan tal cual.
    const genreCounts = {};
    filtered.forEach(m => {
      if (m.genres && Array.isArray(m.genres)) {
        const countedInItem = new Set();
        m.genres.forEach(g => {
          const clean = String(g).trim();
          if (!clean) return;
          const id = GENRES.identity(clean);
          if (countedInItem.has(id)) return;
          countedInItem.add(id);
          genreCounts[id] = (genreCounts[id] || 0) + 1;
          if (id.startsWith('c:') && !state.customGenreNames[id]) state.customGenreNames[id] = clean;
        });
      }
    });

    const uniqueGenres = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]);

    // 1. Selector Dropdown en barra superior (solo lo tienen las películas)
    if (selectEl) {
      const currentSelected = state[stateKey] || 'all';
      selectEl.innerHTML = `<option value="all">${t('genre.selectAll', { n: filtered.length })}</option>`;
      uniqueGenres.forEach(id => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = `${genreName(id)} (${genreCounts[id]})`;
        if (id === currentSelected) {
          opt.selected = true;
        }
        selectEl.appendChild(opt);
      });
      if (currentSelected !== 'all' && !uniqueGenres.includes(currentSelected)) {
        state[stateKey] = 'all';
        selectEl.value = 'all';
      }
    }

    // 2. Barra de pills dentro de la sección correspondiente
    if (pillsEl) {
      pillsEl.innerHTML = '';

      // Pill 'Todos'
      const isAll = !state[stateKey] || state[stateKey] === 'all';
      const allPill = document.createElement('button');
      allPill.type = 'button';
      allPill.className = isAll ? activePillClass : inactivePillClass;
      allPill.innerHTML = `<span>${t('genre.all')}</span><span class="text-[10px] font-bold opacity-80 ${isAll ? 'bg-slate-950/20' : 'bg-black/30'} px-1.5 py-0.5 rounded-full">${filtered.length}</span>`;
      allPill.addEventListener('click', () => {
        state[stateKey] = 'all';
        if (selectEl) selectEl.value = 'all';
        renderLibrary();
      });
      pillsEl.appendChild(allPill);

      // Pills individuales, una por cada género distinto encontrado
      uniqueGenres.forEach(id => {
        const isActive = state[stateKey] === id;
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = isActive ? activePillClass : inactivePillClass;
        pill.innerHTML = `<span>${genreName(id)}</span><span class="text-[10px] font-bold opacity-80 ${isActive ? 'bg-slate-950/20' : 'bg-black/30'} px-1.5 py-0.5 rounded-full">${genreCounts[id]}</span>`;
        pill.addEventListener('click', () => {
          state[stateKey] = isActive ? 'all' : id;
          if (selectEl) selectEl.value = state[stateKey];
          renderLibrary();
        });
        pillsEl.appendChild(pill);
      });
    }
  }

  // ==========================================
  // GENERADOR DE TARJETA ESTILIZADA (SERIE / PELÍCULA)
  // ==========================================
  function createItemCard(item) {
    const card = document.createElement('div');
    const isMovie = item.type === 'movie';
    
    card.className = isMovie 
      ? 'poster-card card-movie group rounded-2xl overflow-hidden bg-slate-900/90 flex flex-col cursor-pointer border border-slate-800/80 hover:border-rose-500/45 transition-all'
      : 'poster-card card-series group rounded-2xl overflow-hidden bg-slate-900/90 flex flex-col cursor-pointer border border-slate-800/80 hover:border-indigo-500/45 transition-all';

    // Etiqueta y color según estado
    let statusLabel = t('card.status.plan');
    let statusBg = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    if (item.status === 'watching') {
      statusLabel = t('card.status.watching');
      statusBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    } else if (item.status === 'completed') {
      statusLabel = t('card.status.completed');
      statusBg = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    } else if (item.status === 'on_hold') {
      statusLabel = t('card.status.onHold');
      statusBg = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    }

    // Barra de progreso y botón para Series
    let progressHtml = '';
    let quickActionBtn = '';

    if (!isMovie) {
      const currentEp = (item.watchedEpisodes && item.watchedEpisodes.length > 0) 
        ? item.watchedEpisodes.length 
        : (item.currentEpisode || 0);
      const totalEp = item.totalEpisodes || (item.episodesList ? item.episodesList.length : 10);
      const percent = totalEp > 0 ? Math.min(100, Math.round((currentEp / totalEp) * 100)) : 0;
      progressHtml = `
        <div class="mt-2.5">
          <div class="flex justify-between items-center text-[11px] text-slate-400 mb-1 font-medium">
            <span>${t('card.progress', { s: item.currentSeason || 1, c: currentEp, t: totalEp })}</span>
            <span class="text-amber-400 font-bold">${percent}%</span>
          </div>
          <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div class="bg-gradient-to-r from-amber-500 to-orange-500 h-1.5 rounded-full transition-all duration-300 progress-bar-glow" style="width: ${percent}%"></div>
          </div>
        </div>
      `;

      quickActionBtn = `
        <button 
          data-quick-ep="${item.id}" 
          title="${t('card.nextEpTitle')}"
          class="text-[11px] bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 border border-amber-500/30 hover:scale-105 active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>${t('card.nextEp')}</span>
        </button>
      `;
    } else {
      // Botón de acción rápida para Películas (Marcar como vista en 1 clic)
      const isCompleted = item.status === 'completed';
      quickActionBtn = `
        <button 
          data-quick-movie="${item.id}"
          title="${isCompleted ? t('card.markPendingTitle') : t('card.markDoneTitle')}"
          class="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${isCompleted ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30' : 'bg-orange-500/15 hover:bg-orange-500 text-orange-300 hover:text-white border border-orange-500/30 hover:scale-105 active:scale-95'}">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>${isCompleted ? t('card.watched') : t('card.mark')}</span>
        </button>
      `;
    }

    // Estrellas de puntuación
    const starsHtml = item.userRating > 0 ? `
      <div class="flex items-center gap-1 text-amber-400 font-bold text-xs bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 fill-amber-400" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span>${item.userRating}/10</span>
      </div>
    ` : '';

    // Plataforma badge
    const platformHtml = item.platform && item.platform !== 'General' ? `
      <span class="text-[10px] font-medium bg-slate-800/90 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
        ${item.platform}
      </span>
    ` : '';

    const safeTitle = (item.title || t('card.titleFallback')).replace(/"/g, '&quot;');
    const posterSrc = item.poster || API_SERVICE.getPlaceholderPoster(item.title, item.type);

    card.innerHTML = `
      <div class="relative aspect-[2/3] w-full overflow-hidden bg-slate-800">
        <img 
          src="${posterSrc}" 
          alt="${safeTitle}" 
          loading="lazy"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onerror="API_SERVICE.handleImgError(this, '${item.type}')"
        />
        <div class="poster-overlay absolute inset-0 opacity-80 group-hover:opacity-60 transition-opacity"></div>
        
        <!-- Badges superiores -->
        <div class="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-center pointer-events-none">
          <span class="text-[10px] font-bold uppercase tracking-wider text-white px-2 py-0.5 rounded-md shadow-md ${isMovie ? 'badge-movie' : 'badge-series'} flex items-center gap-1">
            ${isMovie 
              ? `<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line></svg><span>${t('type.movie')}</span>` 
              : `<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg><span>${t('type.series')}</span>`
            }
          </span>
          <button 
            data-favorite="${item.id}" 
            class="pointer-events-auto p-1.5 rounded-full bg-black/40 hover:bg-black/80 backdrop-blur-md text-white transition-all transform hover:scale-110 active:scale-95"
            title="${item.favorite ? t('card.favRemove') : t('card.favAdd')}">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 ${item.favorite ? 'fill-rose-500 text-rose-500' : 'text-slate-300'}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        </div>

        <!-- Estado Badge inferior de la imagen -->
        <div class="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border backdrop-blur-md ${statusBg}">
            ${statusLabel}
          </span>
          ${platformHtml}
        </div>
      </div>

      <div class="p-3 sm:p-3.5 flex flex-col flex-grow justify-between">
        <div>
          <h3 class="font-bold text-white text-[15px] leading-snug line-clamp-2 ${isMovie ? 'group-hover:text-orange-400' : 'group-hover:text-amber-400'} transition-colors" title="${item.title}">
            ${item.title}
          </h3>

          <div class="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-slate-400">
            <span>${item.year || ''}</span>
            ${item.duration ? `<span class="text-slate-600">&bull;</span><span>${item.duration}</span>` : ''}
          </div>

          ${item.genres && item.genres.length ? `
            <div class="flex items-center gap-1 flex-wrap mt-2">
              ${item.genres.slice(0, 2).map(g => `
                <button 
                  type="button" 
                  data-genre-click="${g}" 
                  title="${isMovie ? t('card.filterMovies', { g: GENRES.label(g) }) : GENRES.label(g)}"
                  class="text-[10px] font-semibold text-slate-400 hover:text-orange-300 hover:bg-orange-500/15 px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/50 transition-all cursor-pointer">
                  ${GENRES.label(g)}
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <div>
          ${progressHtml}

          <div class="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-1.5">
              ${starsHtml}
              ${!item.userRating ? `<span class="text-xs text-slate-500 italic">${t('card.unrated')}</span>` : ''}
            </div>
            <div>
              ${quickActionBtn}
            </div>
          </div>
        </div>
      </div>
    `;

    // Eventos dentro de la tarjeta
    card.addEventListener('click', (e) => {
      // Clic en etiqueta de género (películas y series)
      const genreBtn = e.target.closest('[data-genre-click]');
      if (genreBtn) {
        e.stopPropagation();
        const genre = genreBtn.getAttribute('data-genre-click');
        if (isMovie) {
          state.movieGenreFilter = GENRES.identity(genre);
          if (state.typeFilter === 'series') state.typeFilter = 'all';
          if (DOM.movieGenreSelect) DOM.movieGenreSelect.value = state.movieGenreFilter;
          showToast(t('toast.genreMovies', { g: GENRES.label(genre) }));
        } else {
          state.seriesGenreFilter = GENRES.identity(genre);
          if (state.typeFilter === 'movie') state.typeFilter = 'all';
          showToast(t('toast.genreSeries', { g: GENRES.label(genre) }));
        }
        renderLibrary();
        return;
      }

      // 1. Favorito
      const favBtn = e.target.closest('[data-favorite]');
      if (favBtn) {
        e.stopPropagation();
        STORAGE_SERVICE.toggleFavorite(item.id);
        renderLibrary();
        showToast(item.favorite ? t('toast.favRemoved', { t: item.title }) : t('toast.favAdded', { t: item.title }));
        return;
      }

      // 2. +1 Episodio rápido (Series)
      const epBtn = e.target.closest('[data-quick-ep]');
      if (epBtn) {
        e.stopPropagation();
        const updated = STORAGE_SERVICE.incrementEpisode(item.id);
        renderLibrary();
        showToast(t('toast.epLogged', { n: updated.currentEpisode, t: item.title }));
        return;
      }

      // 3. Marcar como vista (Películas)
      const movieBtn = e.target.closest('[data-quick-movie]');
      if (movieBtn) {
        e.stopPropagation();
        const newStatus = item.status === 'completed' ? 'plan_to_watch' : 'completed';
        STORAGE_SERVICE.updateItem(item.id, { status: newStatus });
        renderLibrary();
        showToast(newStatus === 'completed' ? t('toast.markedDone', { t: item.title }) : t('toast.markedPending', { t: item.title }));
        return;
      }

      // 4. Modal de detalle/edición
      openEditModal(item);
    });

    return card;
  }

  // ==========================================
  // MODAL DE BÚSQUEDA EN APIS PÚBLICAS
  // ==========================================
  let searchTimeout = null;

  // ==========================================
  // CLAVE DE TMDB (guardada solo en este dispositivo)
  // ==========================================
  function refreshApiKeyUI() {
    const key = API_SERVICE.getTmdbKey();
    const hasKey = key.length > 0;

    if (DOM.apiKeyMenuState) {
      DOM.apiKeyMenuState.textContent = hasKey
        ? t('menu.apiKeySaved')
        : t('menu.apiKeyNeeded');
      DOM.apiKeyMenuState.className = hasKey
        ? 'text-[10px] text-emerald-400/90 block'
        : 'text-[10px] text-amber-400/90 block';
    }

    if (DOM.apiKeyStatus) {
      DOM.apiKeyStatus.textContent = hasKey
        ? t('apiKey.statusSaved', { last: key.slice(-4) })
        : t('apiKey.statusNone');
      DOM.apiKeyStatus.className = hasKey
        ? 'text-[11px] font-semibold text-emerald-300'
        : 'text-[11px] font-semibold text-slate-400';
    }

    if (DOM.apiKeyStatusDot) {
      DOM.apiKeyStatusDot.className = hasKey
        ? 'w-2 h-2 rounded-full bg-emerald-400 shrink-0'
        : 'w-2 h-2 rounded-full bg-slate-600 shrink-0';
    }
  }

  function openApiKeyModal() {
    if (!DOM.apiKeyModal) return;
    closeOptionsMenu();
    DOM.apiKeyInput.value = API_SERVICE.getTmdbKey();
    refreshApiKeyUI();
    DOM.apiKeyModal.classList.remove('hidden');
    setTimeout(() => DOM.apiKeyInput.focus(), 100);
  }

  function closeApiKeyModal() {
    if (DOM.apiKeyModal) DOM.apiKeyModal.classList.add('hidden');
  }

  // ==========================================
  // ESTADO DE LA CONEXIÓN
  // ==========================================
  function offlineNoticeHtml() {
    return `
      <div class="col-span-full py-12 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto mb-3 text-rose-500/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <line x1="1" y1="1" x2="23" y2="23"></line>
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.58 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"></path>
        </svg>
        <p class="font-semibold text-slate-300">${t('offline.title')}</p>
        <p class="text-xs text-slate-500 mt-1">${t('offline.desc1')}<br>${t('offline.desc2')}</p>
      </div>
    `;
  }

  window.addEventListener('offline', () => {
    showToast(t('toast.lostConn'), 'error');
  });

  window.addEventListener('online', () => {
    showToast(t('toast.backOnline'));
    // Si el buscador está abierto con texto, se repite la búsqueda
    if (DOM.searchModal && !DOM.searchModal.classList.contains('hidden') && DOM.apiSearchInput.value.trim()) {
      handleApiSearch();
    }
  });

  function openSearchModal() {
    DOM.searchModal.classList.remove('hidden');
    DOM.apiSearchInput.value = '';
    DOM.apiSearchResults.innerHTML = '';
    DOM.apiSearchEmpty.classList.remove('hidden');
    DOM.apiSearchLoading.classList.add('hidden');
    setTimeout(() => DOM.apiSearchInput.focus(), 100);
  }

  function closeSearchModal() {
    DOM.searchModal.classList.add('hidden');
  }

  async function handleApiSearch() {
    const query = DOM.apiSearchInput.value.trim();
    const filter = DOM.apiFilterSelect.value;

    if (!query) {
      DOM.apiSearchResults.innerHTML = '';
      DOM.apiSearchEmpty.classList.remove('hidden');
      DOM.apiSearchLoading.classList.add('hidden');
      return;
    }

    DOM.apiSearchEmpty.classList.add('hidden');
    DOM.apiSearchLoading.classList.remove('hidden');
    DOM.apiSearchResults.innerHTML = '';

    // El buscador necesita internet: sin conexión se avisa en vez de esperar
    // a que caduquen las peticiones una tras otra.
    if (navigator.onLine === false) {
      DOM.apiSearchLoading.classList.add('hidden');
      DOM.apiSearchResults.innerHTML = offlineNoticeHtml();
      showToast(t('toast.offline'), 'error');
      return;
    }

    try {
      const results = await API_SERVICE.searchUnified(query, filter);
      DOM.apiSearchLoading.classList.add('hidden');

      // Sin clave de TMDB no hay películas: se avisa en vez de fallar en silencio
      const needsKey = !API_SERVICE.hasTmdbKey() && (filter === 'all' || filter === 'movie');
      const keyNotice = needsKey ? `
        <div class="sm:col-span-2 flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-amber-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <div class="min-w-0 flex-grow">
            <p class="text-xs font-semibold text-amber-200">${t('keyNotice.title')}</p>
            <p class="text-[11px] text-amber-200/70 mt-0.5">${t('keyNotice.desc')}</p>
          </div>
          <button type="button" data-open-api-key class="text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-lg shrink-0 transition-all">
            ${t('action.add')}
          </button>
        </div>
      ` : '';

      if (results.length === 0 && navigator.onLine === false) {
        DOM.apiSearchResults.innerHTML = offlineNoticeHtml();
        showToast(t('toast.offline'), 'error');
        return;
      }

      if (results.length === 0) {
        DOM.apiSearchResults.innerHTML = keyNotice + `
          <div class="col-span-full py-12 text-center text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto mb-3 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <p class="font-medium text-slate-300">${t('search.noResults', { q: query })}</p>
            <p class="text-xs text-slate-500 mt-1">${t('search.noResultsHint')}</p>
          </div>
        `;
        return;
      }

      state.apiSearchResults = results;
      DOM.apiSearchResults.innerHTML = keyNotice;

      results.forEach((item, index) => {
        const resultCard = document.createElement('div');
        resultCard.className = 'flex gap-3.5 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/50 transition-all items-start';

        const safeTitle = (item.title || t('card.titleFallback')).replace(/"/g, '&quot;');
        const posterSrc = item.poster || API_SERVICE.getPlaceholderPoster(item.title, item.type);

        resultCard.innerHTML = `
          <img 
            src="${posterSrc}" 
            alt="${safeTitle}" 
            class="w-16 h-24 object-cover rounded-lg shrink-0 shadow-md bg-slate-900"
            onerror="API_SERVICE.handleImgError(this, '${item.type}')"
          />
          <div class="flex-grow min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-bold uppercase tracking-wider text-white px-1.5 py-0.5 rounded ${item.type === 'movie' ? 'badge-movie' : 'badge-series'}">
                ${item.type === 'movie' ? t('type.movie') : t('type.series')}
              </span>
              <span class="text-xs text-slate-400 font-medium">${item.year || ''}</span>
              ${item.duration ? `<span class="text-xs text-slate-400 font-medium">• ${item.duration}</span>` : ''}
            </div>
            <h4 class="font-bold text-white text-sm line-clamp-1 mt-1">${item.title}</h4>
            <p class="text-xs text-slate-400 line-clamp-2 mt-1">${getSummary(item)}</p>
            ${item.matchedPerson ? `
              <p class="text-[11px] text-amber-300/90 mt-1 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4M12 8h.01"></path></svg>
                <span>${item.matchedRole === 'Director' ? t('result.directedBy') : t('result.with')} ${item.matchedPerson}</span>
              </p>
            ` : ''}
            ${Array.isArray(item.cast) && item.cast.length > 0 ? `
              <p class="text-[11px] text-slate-500 line-clamp-1 mt-1">
                <span class="text-slate-600">${t('result.cast')}</span> ${item.cast.slice(0, 5).join(', ')}
              </p>
            ` : ''}
            
            <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
              <select id="statusSelect_${index}" class="text-xs bg-slate-900 text-slate-300 border border-slate-700 rounded-lg px-2 py-1 outline-none focus:border-amber-500">
                <option value="watching">${t('statusChip.watching')}</option>
                <option value="plan_to_watch" selected>${t('manualStatus.plan')}</option>
                <option value="completed">${t('editStatus.completed')}</option>
              </select>

              <button 
                data-add-index="${index}"
                class="text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1 rounded-lg transition-all flex items-center gap-1 shadow-md shadow-amber-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                <span>${t('action.add')}</span>
              </button>
            </div>
          </div>
        `;

        // Evento botón añadir
        const addBtn = resultCard.querySelector(`[data-add-index="${index}"]`);
        addBtn.addEventListener('click', async () => {
          const statusSelect = resultCard.querySelector(`#statusSelect_${index}`);
          const chosenStatus = statusSelect.value;
          
          let totalEpisodes = item.totalEpisodes || 10;
          let totalSeasons = item.totalSeasons || 1;
          let episodesList = null;
          let watchedEpisodes = [];
          let currentEpisode = 0;
          let currentSeason = 1;

          // Si es serie de TVMaze, obtener recuento real de episodios
          if (item.type === 'series' && item.originalId) {
            try {
              const episodes = await API_SERVICE.getShowEpisodes(item.originalId);
              if (episodes && episodes.length > 0) {
                totalEpisodes = episodes.length;
                const maxSeason = Math.max(...episodes.map(ep => ep.season || 1));
                totalSeasons = maxSeason || 1;
                episodesList = episodes.map(ep => ({
                  id: ep.id,
                  season: ep.season || 1,
                  number: ep.number || 1,
                  name: ep.name || '',
                  runtime: ep.runtime || item.episodeDuration || 45,
                  airdate: ep.airdate || null,
                  summary: API_SERVICE.stripHtml(ep.summary)
                }));
              }
            } catch (e) {
              console.warn('No se pudieron obtener episodios detallados:', e);
            }
          }

          if (item.type === 'series' && chosenStatus === 'completed' && episodesList) {
            watchedEpisodes = episodesList.map(ep => `${ep.season}_${ep.number}`);
            currentEpisode = totalEpisodes;
            currentSeason = totalSeasons;
          }

          const result = STORAGE_SERVICE.addItem({
            ...item,
            totalEpisodes,
            totalSeasons,
            status: chosenStatus,
            episodesList,
            watchedEpisodes,
            currentEpisode,
            currentSeason
          });

          if (result.success) {
            showToast(t('toast.added', { t: item.title }));
            renderLibrary();
            addBtn.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>${t('result.added')}</span>
            `;
            addBtn.className = 'text-xs font-semibold bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-lg flex items-center gap-1 cursor-default';
            addBtn.disabled = true;
          } else {
            showToast(result.message, 'error');
          }
        });

        DOM.apiSearchResults.appendChild(resultCard);
      });

    } catch (err) {
      DOM.apiSearchLoading.classList.add('hidden');
      showToast(t('search.error'), 'error');
    }
  }

  // ==========================================
  // GESTIÓN INTERACTIVA DE TEMPORADAS Y CAPÍTULOS
  // ==========================================

  // Genera episodios sintéticos si no provienen de API o está offline
  function generateFallbackEpisodes(totalSeasons, totalEpisodes, epDuration = 45) {
    totalSeasons = Math.max(1, parseInt(totalSeasons) || 1);
    totalEpisodes = Math.max(1, parseInt(totalEpisodes) || 1);
    
    const episodes = [];
    const epsPerSeason = Math.max(1, Math.ceil(totalEpisodes / totalSeasons));
    let remaining = totalEpisodes;

    for (let s = 1; s <= totalSeasons; s++) {
      const count = (s === totalSeasons) ? remaining : Math.min(remaining, epsPerSeason);
      for (let n = 1; n <= count; n++) {
        episodes.push({
          id: `fb_${s}_${n}`,
          season: s,
          number: n,
          name: '',
          runtime: epDuration
        });
      }
      remaining -= count;
      if (remaining <= 0) break;
    }
    return episodes;
  }

  // Obtiene episodios guardados o los descarga de TVMaze API
  async function getOrFetchItemEpisodes(item) {
    if (item.episodesList && Array.isArray(item.episodesList) && item.episodesList.length > 0) {
      return item.episodesList;
    }

    const showId = item.originalId || (item.apiId && String(item.apiId).startsWith('tvmaze_') ? String(item.apiId).replace('tvmaze_', '') : null);
    if (showId) {
      try {
        const rawEps = await API_SERVICE.getShowEpisodes(showId);
        if (rawEps && rawEps.length > 0) {
          const episodesList = rawEps.map(ep => ({
            id: ep.id,
            season: ep.season || 1,
            number: ep.number || 1,
            name: ep.name || '',
            runtime: ep.runtime || item.episodeDuration || 45,
            airdate: ep.airdate || null,
            summary: API_SERVICE.stripHtml(ep.summary)
          }));
          const maxSeason = Math.max(...episodesList.map(e => e.season || 1));
          item.episodesList = episodesList;
          item.totalEpisodes = episodesList.length;
          item.totalSeasons = maxSeason || 1;
          STORAGE_SERVICE.updateItem(item.id, {
            episodesList,
            totalEpisodes: item.totalEpisodes,
            totalSeasons: item.totalSeasons
          });
          return episodesList;
        }
      } catch (err) {
        console.warn('Error obteniendo episodios de TVMaze:', err);
      }
    }

    // Fallback estructurado
    const fallback = generateFallbackEpisodes(item.totalSeasons || 1, item.totalEpisodes || 10, item.episodeDuration || 45);
    item.episodesList = fallback;
    STORAGE_SERVICE.updateItem(item.id, { episodesList: fallback });
    return fallback;
  }

  // Asegura que las series tengan migrado su array de watchedEpisodes
  function ensureItemWatchedEpisodes(item) {
    if (!Array.isArray(item.watchedEpisodes)) {
      item.watchedEpisodes = [];
    }

    // Si ya tenía episodios vistos contados pero el array está vacío, poblar los primeros N episodios
    if (item.watchedEpisodes.length === 0 && item.episodesList && item.episodesList.length > 0) {
      if (item.status === 'completed') {
        item.watchedEpisodes = item.episodesList.map(ep => `${ep.season}_${ep.number}`);
        item.currentEpisode = item.episodesList.length;
        STORAGE_SERVICE.updateItem(item.id, { watchedEpisodes: item.watchedEpisodes, currentEpisode: item.currentEpisode });
      } else if (item.currentEpisode > 0) {
        const sorted = [...item.episodesList].sort((a, b) => (a.season !== b.season ? a.season - b.season : a.number - b.number));
        const toTake = Math.min(sorted.length, item.currentEpisode);
        item.watchedEpisodes = sorted.slice(0, toTake).map(ep => `${ep.season}_${ep.number}`);
        STORAGE_SERVICE.updateItem(item.id, { watchedEpisodes: item.watchedEpisodes });
      }
    }
  }

  // Carga episodios en el modal y renderiza la vista
  async function loadSeriesEpisodesIntoModal(item) {
    const listEl = document.getElementById('seasonEpisodesList');
    if (listEl) {
      listEl.innerHTML = `
        <div class="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <svg class="animate-spin w-4 h-4 text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>${t('ep.loading')}</span>
        </div>
      `;
    }

    await getOrFetchItemEpisodes(item);
    ensureItemWatchedEpisodes(item);

    // Calcular qué temporada abrir inicialmente
    let initialSeason = 1;
    if (item.episodesList && item.episodesList.length > 0) {
      const watched = new Set(item.watchedEpisodes || []);
      // Abrir la primera temporada con episodios pendientes de ver
      const firstUnwatched = item.episodesList.find(ep => !watched.has(`${ep.season}_${ep.number}`));
      if (firstUnwatched) {
        initialSeason = firstUnwatched.season;
      } else {
        // Si todos están vistos, abrir la última temporada
        const lastEp = item.episodesList[item.episodesList.length - 1];
        initialSeason = lastEp ? lastEp.season : 1;
      }
    }

    state.activeSeason = initialSeason;
    renderSeriesEpisodesUI(item, initialSeason);
  }

  // Renderiza pestañas de temporadas, botones de acción y lista de capítulos
  function renderSeriesEpisodesUI(item, activeSeason) {
    if (!item.episodesList || item.episodesList.length === 0) return;

    // Agrupar por temporada
    const seasonsMap = {};
    item.episodesList.forEach(ep => {
      const s = ep.season || 1;
      if (!seasonsMap[s]) seasonsMap[s] = [];
      seasonsMap[s].push(ep);
    });

    const seasonNumbers = Object.keys(seasonsMap).map(Number).sort((a, b) => a - b);
    if (!seasonsMap[activeSeason]) {
      activeSeason = seasonNumbers[0] || 1;
    }
    state.activeSeason = activeSeason;

    const watchedSet = new Set(item.watchedEpisodes || []);
    const totalEpisodes = item.episodesList.length;
    const totalWatched = watchedSet.size;
    const percent = totalEpisodes > 0 ? Math.min(100, Math.round((totalWatched / totalEpisodes) * 100)) : 0;

    // 1. Encabezado de progreso general
    const progressTextEl = document.getElementById('seriesModalProgressText');
    const progressBarEl = document.getElementById('seriesModalProgressBar');
    const btnToggleAllSeries = document.getElementById('btnToggleAllSeries');
    const btnToggleAllSeriesText = document.getElementById('btnToggleAllSeriesText');
    const seriesSeasonsSummary = document.getElementById('seriesSeasonsSummary');

    if (progressTextEl) progressTextEl.textContent = t('series.progress', { w: totalWatched, t: totalEpisodes, p: percent });
    if (progressBarEl) progressBarEl.style.width = `${percent}%`;
    if (seriesSeasonsSummary) seriesSeasonsSummary.textContent = tp('count.seasonsAvailable', seasonNumbers.length);

    const isAllSeriesComplete = totalWatched === totalEpisodes && totalEpisodes > 0;
    if (btnToggleAllSeries && btnToggleAllSeriesText) {
      if (isAllSeriesComplete) {
        btnToggleAllSeriesText.textContent = t('series.unmarkAll');
        btnToggleAllSeries.className = 'text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm';
      } else {
        btnToggleAllSeriesText.textContent = t('series.markAll');
        btnToggleAllSeries.className = 'text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm';
      }

      btnToggleAllSeries.onclick = () => {
        const shouldComplete = !isAllSeriesComplete;
        const updated = STORAGE_SERVICE.setAllSeriesWatched(item.id, shouldComplete);
        if (updated) {
          Object.assign(item, updated);
          state.activeModalItem = item;
          document.getElementById('editCurrentEpisode').value = item.currentEpisode || 0;
          document.getElementById('editCurrentSeason').value = item.currentSeason || 1;
          document.getElementById('editTotalEpisodes').value = item.totalEpisodes || 1;
          document.getElementById('editStatus').value = item.status;
          renderSeriesEpisodesUI(item, activeSeason);
          renderLibrary();
          showToast(shouldComplete ? t('toast.seriesDone', { t: item.title }) : t('toast.seriesUndone'));
        }
      };
    }

    // 2. Tabs de temporadas
    const tabsContainer = document.getElementById('seasonTabsContainer');
    if (tabsContainer) {
      tabsContainer.innerHTML = '';
      seasonNumbers.forEach(sNum => {
        const sEps = seasonsMap[sNum] || [];
        const sWatched = sEps.filter(ep => watchedSet.has(`${ep.season}_${ep.number}`)).length;
        const sComplete = sWatched === sEps.length && sEps.length > 0;
        const isActive = sNum === activeSeason;

        const tabBtn = document.createElement('button');
        tabBtn.type = 'button';
        tabBtn.className = isActive
          ? 'shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 border border-amber-400 transition-all cursor-pointer flex items-center gap-1.5'
          : (sComplete
            ? 'shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/40 transition-all cursor-pointer flex items-center gap-1.5'
            : 'shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer flex items-center gap-1.5');

        tabBtn.innerHTML = `
          <span>${t('season.tab', { n: sNum })}</span>
          <span class="text-[10px] font-semibold opacity-90 ${isActive ? 'bg-slate-950/20 px-1.5 py-0.5 rounded' : ''}">${sComplete ? '✓' : `${sWatched}/${sEps.length}`}</span>
        `;

        tabBtn.addEventListener('click', () => {
          renderSeriesEpisodesUI(item, sNum);
        });

        tabsContainer.appendChild(tabBtn);
      });
    }

    // 3. Cabecera y botón de la temporada activa
    const activeSeasonEps = seasonsMap[activeSeason] || [];
    const activeSeasonWatched = activeSeasonEps.filter(ep => watchedSet.has(`${ep.season}_${ep.number}`)).length;
    const isSeasonComplete = activeSeasonWatched === activeSeasonEps.length && activeSeasonEps.length > 0;

    const titleEl = document.getElementById('activeSeasonHeaderTitle');
    const badgeEl = document.getElementById('activeSeasonBadge');
    const btnToggleSeason = document.getElementById('btnToggleActiveSeason');
    const btnToggleSeasonText = document.getElementById('btnToggleActiveSeasonText');

    if (titleEl) titleEl.textContent = t('season.title', { n: activeSeason });
    if (badgeEl) badgeEl.textContent = t('season.badge', { a: activeSeasonWatched, b: activeSeasonEps.length });

    if (btnToggleSeason && btnToggleSeasonText) {
      if (isSeasonComplete) {
        btnToggleSeasonText.textContent = t('season.unmark');
        btnToggleSeason.className = 'text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 transition-all flex items-center gap-1.5 cursor-pointer';
      } else {
        btnToggleSeasonText.textContent = t('season.mark');
        btnToggleSeason.className = 'text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 text-slate-200 hover:text-slate-950 border border-slate-700/80 transition-all flex items-center gap-1.5 cursor-pointer';
      }

      btnToggleSeason.onclick = () => {
        const shouldCompleteSeason = !isSeasonComplete;
        const updated = STORAGE_SERVICE.setSeasonWatched(item.id, activeSeason, shouldCompleteSeason);
        if (updated) {
          Object.assign(item, updated);
          state.activeModalItem = item;
          document.getElementById('editCurrentEpisode').value = item.currentEpisode || 0;
          document.getElementById('editCurrentSeason').value = item.currentSeason || 1;
          document.getElementById('editTotalEpisodes').value = item.totalEpisodes || 1;
          document.getElementById('editStatus').value = item.status;
          renderSeriesEpisodesUI(item, activeSeason);
          renderLibrary();
          showToast(shouldCompleteSeason ? t('toast.seasonDone', { n: activeSeason }) : t('toast.seasonUndone', { n: activeSeason }));
        }
      };
    }

    // 4. Lista de episodios de la temporada activa
    const episodesListEl = document.getElementById('seasonEpisodesList');
    if (episodesListEl) {
      episodesListEl.innerHTML = '';
      activeSeasonEps.forEach(ep => {
        const epKey = `${ep.season}_${ep.number}`;
        const isWatched = watchedSet.has(epKey);

        const epRow = document.createElement('div');
        epRow.className = isWatched
          ? 'group flex items-center justify-between p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15 transition-all cursor-pointer select-none'
          : 'group flex items-center justify-between p-2.5 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/70 hover:border-slate-700 transition-all cursor-pointer select-none';

        const durationBadge = ep.runtime ? `<span class="text-[10px] text-slate-400 bg-slate-800/90 px-1.5 py-0.5 rounded border border-slate-700/60">${ep.runtime} min</span>` : '';
        const airdateBadge = ep.airdate ? `<span class="text-[10px] text-slate-500">${ep.airdate}</span>` : '';

        epRow.innerHTML = `
          <div class="flex items-center gap-3 min-w-0 flex-grow pr-2">
            <div class="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${isWatched ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/40' : 'border border-slate-600 bg-slate-900 group-hover:border-amber-400/70'}">
              ${isWatched ? '<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
            </div>
            <div class="min-w-0 flex-grow">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold ${isWatched ? 'text-amber-400' : 'text-slate-400'}">E${ep.number}</span>
                <span class="text-xs font-semibold truncate ${isWatched ? 'text-white' : 'text-slate-200'}">${episodeName(ep)}</span>
              </div>
              ${(durationBadge || airdateBadge) ? `<div class="flex items-center gap-2 mt-0.5">${durationBadge}${airdateBadge}</div>` : ''}
            </div>
          </div>
          <div class="shrink-0 flex items-center gap-1">
            <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full transition-all ${isWatched ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 opacity-0 group-hover:opacity-100 bg-slate-800/80'}">
              ${isWatched ? t('ep.watched') : t('ep.mark')}
            </span>
          </div>
        `;

        epRow.addEventListener('click', () => {
          const updated = STORAGE_SERVICE.toggleEpisode(item.id, ep.season, ep.number);
          if (updated) {
            Object.assign(item, updated);
            state.activeModalItem = item;
            document.getElementById('editCurrentEpisode').value = item.currentEpisode || 0;
            document.getElementById('editCurrentSeason').value = item.currentSeason || 1;
            document.getElementById('editTotalEpisodes').value = item.totalEpisodes || 1;
            document.getElementById('editStatus').value = item.status;
            renderSeriesEpisodesUI(item, activeSeason);
            renderLibrary();
          }
        });

        episodesListEl.appendChild(epRow);
      });
    }
  }

  // ==========================================
  // MODAL DE DETALLES Y EDICIÓN
  // ==========================================
  function openEditModal(item) {
    state.activeModalItem = item;

    // Rellenar formulario
    document.getElementById('editItemId').value = item.id;
    document.getElementById('editTitle').textContent = item.title;
    document.getElementById('editTypeBadge').textContent = item.type === 'movie' ? t('type.movie') : t('type.series');
    document.getElementById('editTypeBadge').className = `text-xs font-bold uppercase tracking-wider text-white px-2 py-0.5 rounded ${item.type === 'movie' ? 'badge-movie' : 'badge-series'}`;
    document.getElementById('editYear').textContent = item.year || 'N/A';
    const durationEl = document.getElementById('editDurationBadge');
    if (durationEl) {
      durationEl.textContent = item.duration ? `• ${item.duration}` : '';
    }
    document.getElementById('editSummary').textContent = getSummary(item);

    const castRow = document.getElementById('editCastRow');
    const hasCastInfo = item.type === 'movie' && (
      (item.director && item.director !== 'Desconocido') ||
      (Array.isArray(item.cast) && item.cast.length > 0)
    );
    if (castRow) {
      if (hasCastInfo) {
        castRow.classList.remove('hidden');
        const directorLine = document.getElementById('editDirectorLine');
        const castLine = document.getElementById('editCastLine');
        directorLine.innerHTML = (item.director && item.director !== 'Desconocido')
          ? `<span class="text-slate-500">${t('detail.directedBy')}</span> <span class="font-semibold text-white">${item.director}</span>`
          : '';
        castLine.innerHTML = (Array.isArray(item.cast) && item.cast.length > 0)
          ? `<span class="text-slate-500">${t('detail.cast')}</span> ${item.cast.slice(0, 5).join(', ')}`
          : '';
      } else {
        castRow.classList.add('hidden');
      }
    }
    const editImg = document.getElementById('editPosterImg');
    editImg.alt = item.title || t('detail.cover');
    editImg.onerror = () => API_SERVICE.handleImgError(editImg, item.type);
    editImg.src = item.poster || API_SERVICE.getPlaceholderPoster(item.title, item.type);

    const editPosterInput = document.getElementById('editPoster');
    if (editPosterInput) {
      editPosterInput.value = item.poster && !item.poster.startsWith('data:image') ? item.poster : '';
    }
    
    document.getElementById('editStatus').value = item.status || 'plan_to_watch';
    document.getElementById('editRating').value = item.userRating || '0';
    document.getElementById('editRatingValue').textContent = (item.userRating || 0) + ' / 10';
    document.getElementById('editPlatform').value = item.platform || 'General';
    document.getElementById('editNotes').value = item.notes || '';

    const editGenresInput = document.getElementById('editGenres');
    if (editGenresInput) {
      editGenresInput.value = (item.genres && Array.isArray(item.genres)) ? item.genres.map(g => GENRES.label(g)).join(', ') : '';
    }

    // Mostrar u ocultar controles de episodios si es serie
    const seriesControls = document.getElementById('seriesEpisodeControls');
    if (item.type === 'series') {
      seriesControls.classList.remove('hidden');
      const watchedCount = (Array.isArray(item.watchedEpisodes) && item.watchedEpisodes.length > 0) ? item.watchedEpisodes.length : (item.currentEpisode || 0);
      document.getElementById('editCurrentSeason').value = item.currentSeason || 1;
      document.getElementById('editCurrentEpisode').value = watchedCount;
      document.getElementById('editTotalEpisodes').value = item.totalEpisodes || 10;
      loadSeriesEpisodesIntoModal(item);
    } else {
      seriesControls.classList.add('hidden');
    }

    DOM.editModal.classList.remove('hidden');
  }

  function closeEditModal() {
    DOM.editModal.classList.add('hidden');
    state.activeModalItem = null;
  }

  // Guardar cambios del formulario de edición
  DOM.editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!state.activeModalItem) return;

    const id = state.activeModalItem.id;
    const updates = {
      status: document.getElementById('editStatus').value,
      userRating: parseInt(document.getElementById('editRating').value) || 0,
      platform: document.getElementById('editPlatform').value,
      notes: document.getElementById('editNotes').value
    };

    const editGenresInput = document.getElementById('editGenres');
    if (editGenresInput) {
      const gList = editGenresInput.value.split(',').map(s => s.trim()).filter(Boolean);
      updates.genres = gList;
    }

    const editPosterInput = document.getElementById('editPoster');
    if (editPosterInput) {
      const newPoster = editPosterInput.value.trim();
      if (newPoster) {
        updates.poster = newPoster;
        updates.backdrop = newPoster;
      }
    }

    if (state.activeModalItem.type === 'series') {
      updates.currentSeason = parseInt(document.getElementById('editCurrentSeason').value) || 1;
      updates.currentEpisode = parseInt(document.getElementById('editCurrentEpisode').value) || 0;
      updates.totalEpisodes = parseInt(document.getElementById('editTotalEpisodes').value) || 1;
      if (state.activeModalItem.watchedEpisodes) {
        updates.watchedEpisodes = state.activeModalItem.watchedEpisodes;
      }
      if (state.activeModalItem.episodesList) {
        updates.episodesList = state.activeModalItem.episodesList;
      }
    }

    STORAGE_SERVICE.updateItem(id, updates);
    renderLibrary();
    closeEditModal();
    showToast(t('toast.saved'));
  });

  // Eliminar ítem
  DOM.deleteItemBtn.addEventListener('click', () => {
    if (!state.activeModalItem) return;
    if (confirm(t('confirm.delete', { t: state.activeModalItem.title }))) {
      STORAGE_SERVICE.deleteItem(state.activeModalItem.id);
      renderLibrary();
      closeEditModal();
      showToast(t('toast.deleted', { t: state.activeModalItem.title }));
    }
  });

  // Actualizar etiqueta del slider de estrellas en edición
  document.getElementById('editRating').addEventListener('input', (e) => {
    document.getElementById('editRatingValue').textContent = e.target.value + ' / 10';
  });

  // Previsualización en tiempo real del póster al editar
  const editPosterInput = document.getElementById('editPoster');
  if (editPosterInput) {
    editPosterInput.addEventListener('input', (e) => {
      const url = e.target.value.trim();
      const editImg = document.getElementById('editPosterImg');
      if (url) {
        editImg.src = url;
      } else if (state.activeModalItem) {
        editImg.src = API_SERVICE.getPlaceholderPoster(state.activeModalItem.title, state.activeModalItem.type);
      }
    });
  }

  // ==========================================
  // MODAL PARA AÑADIR MANUALMENTE
  // ==========================================
  function openManualModal() {
    DOM.manualForm.reset();
    DOM.manualModal.classList.remove('hidden');
  }

  function closeManualModal() {
    DOM.manualModal.classList.add('hidden');
  }

  DOM.manualForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('manualTitle').value.trim();
    const type = document.getElementById('manualType').value;
    const posterUrl = document.getElementById('manualPoster').value.trim();
    const status = document.getElementById('manualStatus').value;
    const year = document.getElementById('manualYear').value.trim() || new Date().getFullYear().toString();
    const platform = document.getElementById('manualPlatform').value;
    const totalEpisodes = parseInt(document.getElementById('manualEpisodes').value) || (type === 'series' ? 10 : 1);
    const summary = document.getElementById('manualSummary').value.trim();

    const rawGenres = document.getElementById('manualGenres') ? document.getElementById('manualGenres').value.trim() : '';
    const genres = rawGenres ? rawGenres.split(',').map(g => g.trim()).filter(Boolean) : (type === 'movie' ? [t('genre.defaultMovie')] : [t('genre.defaultSeries')]);

    const newItem = {
      title,
      type,
      poster: posterUrl || API_SERVICE.getPlaceholderPoster(title, type),
      status,
      year,
      platform,
      genres,
      totalEpisodes,
      summary
    };

    if (type === 'series') {
      const totalSeasons = Math.max(1, Math.ceil(totalEpisodes / 10));
      newItem.totalSeasons = totalSeasons;
      newItem.episodesList = generateFallbackEpisodes(totalSeasons, totalEpisodes, 45);
      if (status === 'completed') {
        newItem.watchedEpisodes = newItem.episodesList.map(ep => `${ep.season}_${ep.number}`);
        newItem.currentEpisode = totalEpisodes;
        newItem.currentSeason = totalSeasons;
      } else {
        newItem.watchedEpisodes = [];
        newItem.currentEpisode = 0;
        newItem.currentSeason = 1;
      }
    }

    const res = STORAGE_SERVICE.addItem(newItem);
    if (res.success) {
      renderLibrary();
      closeManualModal();
      showToast(t('toast.addedManual', { t: title }));
    } else {
      showToast(res.message, 'error');
    }
  });

  // Controlar visibilidad del campo de episodios en el formulario manual
  document.getElementById('manualType').addEventListener('change', (e) => {
    const epField = document.getElementById('manualEpisodeField');
    if (e.target.value === 'series') {
      epField.classList.remove('hidden');
    } else {
      epField.classList.add('hidden');
    }
  });

  // ==========================================
  // BACKUP (EXPORTACIÓN / IMPORTACIÓN & DROPDOWN)
  // ==========================================
  function closeOptionsMenu() {
    if (DOM.optionsDropdownMenu) {
      DOM.optionsDropdownMenu.classList.add('hidden');
    }
    if (DOM.optionsDropdownBtn) {
      DOM.optionsDropdownBtn.setAttribute('aria-expanded', 'false');
      DOM.optionsDropdownBtn.classList.remove('bg-slate-700', 'text-white', 'border-slate-600');
    }
  }

  if (DOM.optionsDropdownBtn && DOM.optionsDropdownMenu) {
    DOM.optionsDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isClosed = DOM.optionsDropdownMenu.classList.contains('hidden');
      if (isClosed) {
        DOM.optionsDropdownMenu.classList.remove('hidden');
        DOM.optionsDropdownBtn.setAttribute('aria-expanded', 'true');
        DOM.optionsDropdownBtn.classList.add('bg-slate-700', 'text-white', 'border-slate-600');
      } else {
        closeOptionsMenu();
      }
    });

    // Cerrar al hacer clic en cualquier lugar fuera del menú
    document.addEventListener('click', (e) => {
      if (!DOM.optionsDropdownMenu.contains(e.target) && !DOM.optionsDropdownBtn.contains(e.target)) {
        closeOptionsMenu();
      }
    });
  }

  DOM.exportBtn.addEventListener('click', () => {
    STORAGE_SERVICE.exportData();
    closeOptionsMenu();
    showToast(t('toast.backupDownloaded'));
  });

  DOM.importBtn.addEventListener('click', () => {
    closeOptionsMenu();
    DOM.importFileInput.click();
  });

  DOM.importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const res = STORAGE_SERVICE.importData(event.target.result);
      if (res.success) {
        renderLibrary();
        showToast(tp('count.titlesImported', res.count));
      } else {
        showToast(t('toast.importError', { e: res.error }), 'error');
      }
    };
    reader.readAsText(file);
    DOM.importFileInput.value = '';
  });

  DOM.resetDemoBtn.addEventListener('click', () => {
    closeOptionsMenu();
    if (confirm(t('confirm.reset'))) {
      STORAGE_SERVICE.clearAll();
      state.movieGenreFilter = 'all';
      state.seriesGenreFilter = 'all';
      renderLibrary();
      showToast(t('toast.resetDone'));
    }
  });

  // ==========================================
  // EVENTOS DE NAVEGACIÓN Y FILTROS
  // ==========================================
  
  // Selector de Tipo Principal
  DOM.typeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remover clases activas de todos
      DOM.typeTabs.forEach(t => {
        t.classList.remove('font-bold', 'bg-gradient-to-r', 'from-amber-500', 'to-orange-500', 'text-slate-950', 'shadow-lg', 'shadow-amber-500/20');
        t.classList.add('font-semibold', 'text-slate-400', 'hover:text-white', 'hover:bg-slate-800/80');
      });
      // Añadir clases activas al seleccionado
      tab.classList.remove('font-semibold', 'text-slate-400', 'hover:text-white', 'hover:bg-slate-800/80');
      tab.classList.add('font-bold', 'bg-gradient-to-r', 'from-amber-500', 'to-orange-500', 'text-slate-950', 'shadow-lg', 'shadow-amber-500/20');
      
      state.typeFilter = tab.getAttribute('data-type-tab');
      renderLibrary();
    });
  });

  // Selector de Estado: chips en escritorio, desplegable en móvil.
  // Ambos representan el mismo state.statusFilter y se mantienen sincronizados
  // entre sí, para que cambiar de tamaño de ventana no los deje descoordinados.
  function setStatusFilter(value) {
    state.statusFilter = value;

    DOM.statusTabs.forEach(t => {
      const isActive = t.getAttribute('data-status-tab') === value;
      t.classList.toggle('font-bold', isActive);
      t.classList.toggle('text-white', isActive);
      t.classList.toggle('bg-slate-800', isActive);
      t.classList.toggle('border-slate-700', isActive);
      t.classList.toggle('font-semibold', !isActive);
      t.classList.toggle('text-slate-400', !isActive);
      t.classList.toggle('hover:text-white', !isActive);
      t.classList.toggle('hover:bg-slate-800/60', !isActive);
      t.classList.toggle('border-transparent', !isActive);
    });

    if (DOM.statusFilterSelect) DOM.statusFilterSelect.value = value;

    renderLibrary();
  }

  DOM.statusTabs.forEach(tab => {
    tab.addEventListener('click', () => setStatusFilter(tab.getAttribute('data-status-tab')));
  });

  if (DOM.statusFilterSelect) {
    DOM.statusFilterSelect.addEventListener('change', () => setStatusFilter(DOM.statusFilterSelect.value));
  }

  // Botones de Ver Solo Series/Películas en las cabeceras de sección
  if (DOM.viewOnlySeriesBtn) {
    DOM.viewOnlySeriesBtn.addEventListener('click', () => {
      document.querySelector('[data-type-tab="series"]').click();
    });
  }
  if (DOM.viewOnlyMoviesBtn) {
    DOM.viewOnlyMoviesBtn.addEventListener('click', () => {
      document.querySelector('[data-type-tab="movie"]').click();
    });
  }

  // Buscador local en tiempo real
  DOM.searchInput.addEventListener('input', (e) => {
    state.searchFilter = e.target.value;
    renderLibrary();
  });

  // Selector de ordenación
  DOM.sortSelect.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    renderLibrary();
  });

  // Selector de género de películas
  if (DOM.movieGenreSelect) {
    DOM.movieGenreSelect.addEventListener('change', (e) => {
      state.movieGenreFilter = e.target.value;
      renderLibrary();
    });
  }

  // Búsqueda en API con debounce
  DOM.apiSearchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(handleApiSearch, 450);
  });

  DOM.apiFilterSelect.addEventListener('change', () => {
    handleApiSearch();
  });

  // Abrir / Cerrar Modales
  DOM.openSearchModalBtn.addEventListener('click', openSearchModal);
  if (DOM.heroSearchBtn) DOM.heroSearchBtn.addEventListener('click', openSearchModal);
  DOM.closeSearchModalBtn.addEventListener('click', closeSearchModal);

  DOM.closeEditModalBtn.addEventListener('click', closeEditModal);
  DOM.openManualModalBtn.addEventListener('click', openManualModal);
  DOM.closeManualModalBtn.addEventListener('click', closeManualModal);

  // ── Clave de TMDB ──────────────────────────────────────────────
  if (DOM.apiKeyBtn) DOM.apiKeyBtn.addEventListener('click', openApiKeyModal);
  if (DOM.closeApiKeyModalBtn) DOM.closeApiKeyModalBtn.addEventListener('click', closeApiKeyModal);

  if (DOM.apiKeyForm) {
    DOM.apiKeyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = DOM.apiKeyInput.value.trim();

      if (!value) {
        showToast(t('toast.keyNeeded'), 'error');
        return;
      }
      if (!/^[a-f0-9]{32}$/i.test(value)) {
        showToast(t('toast.keyInvalid'), 'error');
        return;
      }
      if (!API_SERVICE.setTmdbKey(value)) {
        showToast(t('toast.keySaveFail'), 'error');
        return;
      }

      refreshApiKeyUI();
      closeApiKeyModal();
      showToast(t('toast.keySaved'));

      // Si el buscador está abierto con texto, se repite la búsqueda
      if (DOM.searchModal && !DOM.searchModal.classList.contains('hidden') && DOM.apiSearchInput.value.trim()) {
        handleApiSearch();
      }
    });
  }

  if (DOM.deleteApiKeyBtn) {
    DOM.deleteApiKeyBtn.addEventListener('click', () => {
      if (!API_SERVICE.getTmdbKey()) {
        showToast(t('toast.keyNone'), 'error');
        return;
      }
      API_SERVICE.setTmdbKey('');
      DOM.apiKeyInput.value = '';
      refreshApiKeyUI();
      showToast(t('toast.keyDeleted'));
    });
  }

  // Botón "Añadir" del aviso que sale dentro del buscador
  if (DOM.apiSearchResults) {
    DOM.apiSearchResults.addEventListener('click', (e) => {
      if (e.target.closest('[data-open-api-key]')) openApiKeyModal();
    });
  }

  // Cerrar modales haciendo clic en el backdrop oscuro
  [DOM.searchModal, DOM.editModal, DOM.manualModal, DOM.apiKeyModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  });

  // Tecla Escape para cerrar modales o dropdowns
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      DOM.searchModal.classList.add('hidden');
      DOM.editModal.classList.add('hidden');
      DOM.manualModal.classList.add('hidden');
      if (DOM.apiKeyModal) DOM.apiKeyModal.classList.add('hidden');
      closeOptionsMenu();
    }
  });

  // Toggle Genres UI
  if (DOM.toggleMovieGenresBtn && DOM.movieGenrePillsContainer && DOM.movieGenreIcon) {
    DOM.toggleMovieGenresBtn.addEventListener('click', () => {
      DOM.movieGenrePillsContainer.classList.toggle('hidden');
      DOM.movieGenreIcon.classList.toggle('-rotate-90');
    });
  }

  if (DOM.toggleSeriesGenresBtn && DOM.seriesGenrePillsContainer && DOM.seriesGenreIcon) {
    DOM.toggleSeriesGenresBtn.addEventListener('click', () => {
      DOM.seriesGenrePillsContainer.classList.toggle('hidden');
      DOM.seriesGenreIcon.classList.toggle('-rotate-90');
    });
  }

  // ==========================================
  // IDIOMA (español / inglés / polaco)
  // ==========================================
  document.querySelectorAll('[data-lang]').forEach(btn => {
    btn.addEventListener('click', () => I18N.setLang(btn.getAttribute('data-lang')));
  });

  // I18N.setLang ya traduce el HTML estático; aquí se redibuja lo que genera app.js
  document.addEventListener('cinetrack:languagechange', () => {
    renderLibrary();
    refreshApiKeyUI();
  });

  // ==========================================
  // INICIALIZACIÓN
  // ==========================================
  renderLibrary();
  refreshApiKeyUI();

});
