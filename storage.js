/**
 * CineTrack - Servicio de Almacenamiento Local (LocalStorage)
 * Gestiona la persistencia de datos, estadísticas y copias de seguridad.
 */

const STORAGE_KEY = 'cinetrack_user_library_v1';

// Datos de demostración iniciales con portadas HD para dar la bienvenida al usuario
const INITIAL_DEMO_ITEMS = [
  {
    id: 'demo-1',
    originalId: 169,
    apiId: 'tvmaze_169',
    title: 'Breaking Bad',
    type: 'series',
    status: 'completed',
    favorite: true,
    poster: 'https://static.tvmaze.com/uploads/images/original_untouched/501/1253519.jpg',
    backdrop: 'https://static.tvmaze.com/uploads/images/original_untouched/501/1253519.jpg',
    year: '2008',
    genres: ['Drama', 'Crime', 'Thriller'],
    userRating: 10,
    platform: 'Netflix',
    notes: 'Una de las mejores series de la historia. El desarrollo de Walter White es sublime.',
    currentSeason: 5,
    currentEpisode: 62,
    totalEpisodes: 62,
    totalSeasons: 5,
    duration: '60 min/ep',
    episodeDuration: 60,
    summary: 'Un profesor de química con cáncer terminal se asocia con un antiguo alumno para fabricar metanfetamina y asegurar el futuro económico de su familia.',
    createdAt: Date.now() - 86400000 * 10
  },
  {
    id: 'demo-2',
    title: 'Interstellar',
    type: 'movie',
    status: 'completed',
    favorite: true,
    poster: 'https://is1-ssl.mzstatic.com/image/thumb/Video5/v4/94/0b/4e/940b4e58-6628-dfb4-2565-5521c11dcdd4/pr_source.lsr/600x600bb.jpg',
    backdrop: 'https://is1-ssl.mzstatic.com/image/thumb/Video5/v4/94/0b/4e/940b4e58-6628-dfb4-2565-5521c11dcdd4/pr_source.lsr/600x600bb.jpg',
    year: '2014',
    genres: ['Ciencia Ficción', 'Aventura', 'Drama'],
    userRating: 10,
    platform: 'Max',
    notes: 'Banda sonora increíble de Hans Zimmer. Obra maestra de Christopher Nolan.',
    durationMinutes: 169,
    duration: '169 min',
    summary: 'Un grupo de exploradores viaja a través de un agujero de gusano en el espacio en un intento por asegurar la supervivencia de la humanidad.',
    createdAt: Date.now() - 86400000 * 5
  },
  {
    id: 'demo-3',
    originalId: 2993,
    apiId: 'tvmaze_2993',
    title: 'Stranger Things',
    type: 'series',
    status: 'watching',
    favorite: false,
    poster: 'https://static.tvmaze.com/uploads/images/original_untouched/470/1177062.jpg',
    backdrop: 'https://static.tvmaze.com/uploads/images/original_untouched/470/1177062.jpg',
    year: '2016',
    genres: ['Drama', 'Fantasy', 'Horror', 'Mystery'],
    userRating: 9,
    platform: 'Netflix',
    notes: 'Esperando con ganas la última temporada.',
    currentSeason: 4,
    currentEpisode: 34,
    totalEpisodes: 42,
    totalSeasons: 5,
    duration: '65 min/ep',
    episodeDuration: 65,
    summary: 'Cuando un niño desaparece en Hawkins, una pequeña localidad, sus amigos, la familia y la policía se ven envueltos en una conspiración secreta del gobierno.',
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: 'demo-4',
    title: 'Dune: Parte 2',
    type: 'movie',
    status: 'plan_to_watch',
    favorite: false,
    poster: 'https://is1-ssl.mzstatic.com/image/thumb/Video221/v4/71/a8/31/71a8312e-a20a-29b2-af70-5cab08908657/aca7621e-74e7-419a-96cd-5aaff99fb0cc_DUNE_PART2_V_DD_KA_TT_2000x3000_300dpi_EN-srgb.lsr/600x600bb.jpg',
    backdrop: 'https://is1-ssl.mzstatic.com/image/thumb/Video221/v4/71/a8/31/71a8312e-a20a-29b2-af70-5cab08908657/aca7621e-74e7-419a-96cd-5aaff99fb0cc_DUNE_PART2_V_DD_KA_TT_2000x3000_300dpi_EN-srgb.lsr/600x600bb.jpg',
    year: '2024',
    genres: ['Ciencia Ficción', 'Acción'],
    userRating: 0,
    platform: 'Max',
    notes: 'Pendiente para ver este fin de semana.',
    durationMinutes: 166,
    duration: '166 min',
    summary: 'Paul Atreides se une a Chani y a los Fremen mientras busca venganza contra los conspiradores que destruyeron a su familia.',
    createdAt: Date.now() - 86400000 * 1
  }
];

const STORAGE_SERVICE = {
  /**
   * Obtiene todos los títulos guardados
   */
  getItems() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        // Primera ejecución: inicializar con demos
        this.saveItems(INITIAL_DEMO_ITEMS);
        return INITIAL_DEMO_ITEMS;
      }
      let items = JSON.parse(data);
      if (!Array.isArray(items)) return [];

      // Auto-reparar imágenes rotas, IDs y duraciones de las demos previas en localStorage
      let updated = false;
      items = items.map(item => {
        if (item.id === 'demo-1') {
          if (!item.originalId) { item.originalId = 169; updated = true; }
          if (!item.apiId) { item.apiId = 'tvmaze_169'; updated = true; }
          if (!item.duration) {
            item.duration = INITIAL_DEMO_ITEMS[0].duration;
            item.episodeDuration = INITIAL_DEMO_ITEMS[0].episodeDuration;
            updated = true;
          }
        }
        if (item.id === 'demo-2') {
          if (item.poster && item.poster.includes('Video116/v4/bf/f4/ba/bff4baa7-48f8-809c-3fa8-17a48d8a6fc6')) {
            item.poster = INITIAL_DEMO_ITEMS[1].poster;
            item.backdrop = INITIAL_DEMO_ITEMS[1].backdrop;
            updated = true;
          }
          if (!item.durationMinutes) {
            item.durationMinutes = INITIAL_DEMO_ITEMS[1].durationMinutes;
            item.duration = INITIAL_DEMO_ITEMS[1].duration;
            updated = true;
          }
        }
        if (item.id === 'demo-3') {
          if (!item.originalId) { item.originalId = 2993; updated = true; }
          if (!item.apiId) { item.apiId = 'tvmaze_2993'; updated = true; }
          if (!item.duration) {
            item.duration = INITIAL_DEMO_ITEMS[2].duration;
            item.episodeDuration = INITIAL_DEMO_ITEMS[2].episodeDuration;
            updated = true;
          }
        }
        if (item.id === 'demo-4') {
          if (item.poster && item.poster.includes('Video221/v4/97/3d/bf/973dbfa1-ff8b-ca52-25e6-c14fe47f48a9')) {
            item.poster = INITIAL_DEMO_ITEMS[3].poster;
            item.backdrop = INITIAL_DEMO_ITEMS[3].backdrop;
            updated = true;
          }
          if (!item.durationMinutes) {
            item.durationMinutes = INITIAL_DEMO_ITEMS[3].durationMinutes;
            item.duration = INITIAL_DEMO_ITEMS[3].duration;
            updated = true;
          }
        }

        // Asegurar estructura de episodios en series
        if (item.type === 'series') {
          if (!Array.isArray(item.watchedEpisodes)) {
            item.watchedEpisodes = [];
            // Si ya tenía episodios vistos registrados, se inicializarán cuando se cargue su episodesList
          }
        }

        return item;
      });

      if (updated) {
        this.saveItems(items);
      }

      return items;
    } catch (e) {
      console.error('Error al leer de localStorage:', e);
      return [];
    }
  },

  /**
   * Guarda la lista completa de ítems
   */
  saveItems(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Error al guardar en localStorage:', e);
    }
  },

  /**
   * Agrega un nuevo título o serie
   */
  addItem(item) {
    const items = this.getItems();
    // Validar si ya existe
    const exists = items.some(i => i.title.toLowerCase() === item.title.toLowerCase() && i.type === item.type);
    if (exists) {
      return { success: false, message: t('storage.duplicate') };
    }

    const newItem = {
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userRating: 0,
      favorite: false,
      status: item.status || 'plan_to_watch',
      currentSeason: item.currentSeason || 1,
      currentEpisode: item.currentEpisode || (item.status === 'completed' ? (item.totalEpisodes || 1) : 0),
      totalEpisodes: item.totalEpisodes || (item.type === 'series' ? 10 : 1),
      totalSeasons: item.totalSeasons || 1,
      notes: item.notes || '',
      platform: item.platform || 'General',
      createdAt: Date.now(),
      ...item
    };

    items.unshift(newItem);
    this.saveItems(items);
    return { success: true, item: newItem };
  },

  /**
   * Actualiza un ítem existente
   */
  updateItem(id, updates) {
    const items = this.getItems();
    const index = items.findIndex(i => i.id === id);
    if (index === -1) return false;

    // Si se incrementó el episodio y llega al total, preguntar o marcar como completado
    if (updates.type === 'series' || items[index].type === 'series') {
      const total = updates.totalEpisodes || items[index].totalEpisodes;
      const current = updates.currentEpisode !== undefined ? updates.currentEpisode : items[index].currentEpisode;
      if (total && current >= total && items[index].status === 'watching') {
        updates.status = 'completed';
      }
    }

    items[index] = { ...items[index], ...updates, updatedAt: Date.now() };
    this.saveItems(items);
    return items[index];
  },

  /**
   * Elimina un ítem
   */
  deleteItem(id) {
    const items = this.getItems().filter(i => i.id !== id);
    this.saveItems(items);
    return true;
  },

  /**
   * Incrementa en 1 los episodios vistos de una serie
   */
  incrementEpisode(id) {
    const items = this.getItems();
    const item = items.find(i => i.id === id);
    if (!item || item.type !== 'series') return null;

    let watched = Array.isArray(item.watchedEpisodes) ? [...item.watchedEpisodes] : [];
    let currentSeason = item.currentSeason || 1;

    if (item.episodesList && item.episodesList.length > 0) {
      // Buscar el primer episodio que no esté visto
      const nextEp = item.episodesList.find(ep => !watched.includes(`${ep.season}_${ep.number}`));
      if (nextEp) {
        watched.push(`${nextEp.season}_${nextEp.number}`);
        currentSeason = nextEp.season;
      }
    }

    const newEpisodeCount = watched.length > 0 ? watched.length : (item.currentEpisode || 0) + 1;
    const totalEp = item.totalEpisodes || (item.episodesList ? item.episodesList.length : 10);
    const updates = { 
      watchedEpisodes: watched,
      currentEpisode: newEpisodeCount,
      currentSeason: currentSeason
    };

    if (newEpisodeCount >= totalEp) {
      updates.status = 'completed';
    } else if (item.status === 'plan_to_watch' || (item.status === 'completed' && newEpisodeCount < totalEp)) {
      updates.status = 'watching';
    }

    return this.updateItem(id, updates);
  },

  /**
   * Alterna el estado de visto/no visto de un episodio específico
   */
  toggleEpisode(id, season, number) {
    const items = this.getItems();
    const item = items.find(i => i.id === id);
    if (!item || item.type !== 'series') return null;

    let watched = Array.isArray(item.watchedEpisodes) ? [...item.watchedEpisodes] : [];
    const key = `${season}_${number}`;
    const idx = watched.indexOf(key);

    if (idx >= 0) {
      watched.splice(idx, 1);
    } else {
      watched.push(key);
    }

    const totalEp = item.totalEpisodes || (item.episodesList ? item.episodesList.length : 1);
    const newCount = watched.length;
    const updates = {
      watchedEpisodes: watched,
      currentEpisode: newCount,
      currentSeason: season
    };

    if (newCount >= totalEp && totalEp > 0) {
      updates.status = 'completed';
    } else if (newCount > 0) {
      if (item.status === 'plan_to_watch' || item.status === 'completed') {
        updates.status = 'watching';
      }
    } else if (newCount === 0) {
      if (item.status === 'completed') {
        updates.status = 'plan_to_watch';
      }
    }

    return this.updateItem(id, updates);
  },

  /**
   * Marca o desmarca todos los episodios de una temporada
   */
  setSeasonWatched(id, season, shouldWatch) {
    const items = this.getItems();
    const item = items.find(i => i.id === id);
    if (!item || item.type !== 'series') return null;

    let watched = Array.isArray(item.watchedEpisodes) ? [...item.watchedEpisodes] : [];
    const seasonStr = `${season}_`;

    if (!shouldWatch) {
      // Quitar todos los episodios de esta temporada
      watched = watched.filter(k => !k.startsWith(seasonStr));
    } else {
      // Agregar todos los episodios conocidos de esta temporada
      if (item.episodesList && item.episodesList.length > 0) {
        const seasonEps = item.episodesList.filter(ep => ep.season === season);
        seasonEps.forEach(ep => {
          const key = `${ep.season}_${ep.number}`;
          if (!watched.includes(key)) watched.push(key);
        });
      }
    }

    const totalEp = item.totalEpisodes || (item.episodesList ? item.episodesList.length : 1);
    const newCount = watched.length;
    const updates = {
      watchedEpisodes: watched,
      currentEpisode: newCount,
      currentSeason: season
    };

    if (newCount >= totalEp && totalEp > 0) {
      updates.status = 'completed';
    } else if (newCount > 0) {
      if (item.status === 'plan_to_watch' || item.status === 'completed') {
        updates.status = 'watching';
      }
    } else if (newCount === 0 && item.status === 'completed') {
      updates.status = 'plan_to_watch';
    }

    return this.updateItem(id, updates);
  },

  /**
   * Marca o desmarca la serie completa
   */
  setAllSeriesWatched(id, shouldWatch) {
    const items = this.getItems();
    const item = items.find(i => i.id === id);
    if (!item || item.type !== 'series') return null;

    let watched = [];
    const totalEp = item.totalEpisodes || (item.episodesList ? item.episodesList.length : 1);

    if (shouldWatch) {
      if (item.episodesList && item.episodesList.length > 0) {
        watched = item.episodesList.map(ep => `${ep.season}_${ep.number}`);
      } else {
        for (let i = 1; i <= totalEp; i++) {
          watched.push(`1_${i}`);
        }
      }
      return this.updateItem(id, {
        watchedEpisodes: watched,
        currentEpisode: totalEp,
        status: 'completed'
      });
    } else {
      return this.updateItem(id, {
        watchedEpisodes: [],
        currentEpisode: 0,
        status: 'plan_to_watch'
      });
    }
  },

  /**
   * Alterna estado de favorito
   */
  toggleFavorite(id) {
    const items = this.getItems();
    const item = items.find(i => i.id === id);
    if (!item) return null;
    return this.updateItem(id, { favorite: !item.favorite });
  },

  /**
   * Contadores para las pestañas Todo / Películas / Series
   */
  calculateStats() {
    const items = this.getItems();

    return {
      total: items.length,
      moviesCount: items.filter(i => i.type === 'movie').length,
      seriesCount: items.filter(i => i.type === 'series').length
    };
  },

  /**
   * Exporta la biblioteca en formato JSON
   */
  exportData() {
    const items = this.getItems();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `cinetrack_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  /**
   * Importa datos desde un string JSON
   */
  importData(jsonString) {
    try {
      const items = JSON.parse(jsonString);
      if (!Array.isArray(items)) throw new Error(t('storage.badFormat'));
      this.saveItems(items);
      return { success: true, count: items.length };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Reinicia la biblioteca
   */
  clearAll() {
    // Se guarda una lista vacía ("[]"), no se borra la clave: si faltara,
    // getItems() lo tomaría por una primera ejecución y volvería a cargar los ejemplos
    this.saveItems([]);
    return [];
  }
};

window.STORAGE_SERVICE = STORAGE_SERVICE;

