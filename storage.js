/**
 * CineTrack - Servicio de Almacenamiento Local (LocalStorage)
 * Gestiona la persistencia de datos, estadísticas y copias de seguridad.
 */

const STORAGE_KEY = 'cinetrack_user_library_v1';

const STORAGE_SERVICE = {
  /**
   * Obtiene todos los títulos guardados
   */
  getItems() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        // Primera ejecución: la lista empieza vacía. Se guarda "[]" para que
        // la próxima lectura no la confunda con una instalación nueva.
        this.saveItems([]);
        return [];
      }
      let items = JSON.parse(data);
      if (!Array.isArray(items)) return [];

      let updated = false;
      items = items.map(item => {
        // Asegurar estructura de episodios en series
        if (item.type === 'series') {
          if (!Array.isArray(item.watchedEpisodes)) {
            item.watchedEpisodes = [];
            // Si ya tenía episodios vistos registrados, se inicializarán cuando se cargue su episodesList
            updated = true;
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
    } else if (item.manualComplete && item.status === 'completed' && newCount > 0) {
      // Completada a mano: marcar o desmarcar episodios no cambia el estado
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
    } else if (item.manualComplete && item.status === 'completed' && newCount > 0) {
      // Completada a mano: no se cambia el estado
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
        status: 'plan_to_watch',
        manualComplete: false
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
    // Se guarda una lista vacía ("[]") en vez de borrar la clave, para que
    // getItems() no lo tome por una instalación nueva
    this.saveItems([]);
    return [];
  }
};

window.STORAGE_SERVICE = STORAGE_SERVICE;

