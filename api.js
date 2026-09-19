/**
 * CineTrack - Servicio de Integración con APIs Públicas
 *
 * Películas: TMDB (The Movie Database) — requiere una clave gratuita que el
 *            usuario introduce desde la propia app (se guarda en el navegador).
 * Series:    TVMaze (sin clave) con TMDB como respaldo si TVMaze no responde.
 *
 * Nota: iTunes se eliminó porque su catálogo de películas devuelve 0 resultados
 * para cualquier búsqueda, e IMDb Suggestion porque no envía cabeceras CORS.
 */

/**
 * La clave de TMDB NO se guarda en el código: se pide al usuario desde la app
 * y se almacena en el navegador (localStorage). Así el repositorio y la web
 * publicada no contienen ningún secreto.
 */
const TMDB_KEY_STORAGE = 'cinetrack_tmdb_key';

const API_SERVICE = {
  TMDB_BASE: 'https://api.themoviedb.org/3',
  TMDB_IMG: 'https://image.tmdb.org/t/p',
  TMDB_LANG: 'es-ES',

  _tmdbGenreCache: null,
  _tmdbKeyWarned: false,

  // Limpia etiquetas HTML que TVMaze suele incluir en la sinopsis
  stripHtml(html) {
    if (!html) return 'Sin descripción disponible.';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  },

  // Generador de imagen placeholder SVG elegante cuando no hay póster
  getPlaceholderPoster(title, type = 'movie') {
    const rawTitle = title || (type === 'movie' ? 'Película' : 'Serie');
    const safeTitle = rawTitle.length > 22 ? rawTitle.substring(0, 20) + '...' : rawTitle;
    const label = type === 'movie' ? 'PELÍCULA' : 'SERIE';
    const bg = type === 'movie' ? '#ea580c' : '#f59e0b';
    const bgDark = type === 'movie' ? '#c2410c' : '#d97706';

    // Escapar entidades XML para que no rompan el SVG
    const xmlTitle = safeTitle
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'>
      <defs>
        <linearGradient id='bgGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stop-color='#0f172a'/>
          <stop offset='100%' stop-color='#1e293b'/>
        </linearGradient>
      </defs>
      <rect width='300' height='450' fill='url(#bgGrad)'/>
      <circle cx='150' cy='185' r='46' fill='${bgDark}' opacity='0.3'/>
      <polygon points='142,168 168,185 142,202' fill='${bg}'/>
      <rect y='360' width='300' height='90' fill='#090d16' opacity='0.95'/>
      <rect y='358' width='300' height='2' fill='${bg}'/>
      <text x='50%' y='255' dominant-baseline='middle' text-anchor='middle' fill='#94a3b8' font-family='system-ui, -apple-system, sans-serif' font-size='12' font-weight='700' letter-spacing='2'>${label}</text>
      <text x='50%' y='405' dominant-baseline='middle' text-anchor='middle' fill='#ffffff' font-family='system-ui, -apple-system, sans-serif' font-size='15' font-weight='bold'>${xmlTitle}</text>
    </svg>`;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg).replace(/'/g, '%27')}`;
  },

  // Manejador seguro para errores de carga de imágenes (evita bucles infinitos)
  handleImgError(img, type = 'movie') {
    if (!img) return;
    img.onerror = null;
    const title = img.getAttribute('alt') || '';
    img.src = this.getPlaceholderPoster(title, type);
  },

  /**
   * fetch con timeout (AbortController) y reintentos.
   * Evita que una petición colgada bloquee la búsqueda indefinidamente.
   */
  async fetchJson(url, { timeout = 8000, retries = 1 } = {}) {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (error) {
        lastError = error;
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError;
  },

  // ───────────────────────────── TMDB ─────────────────────────────

  /**
   * Devuelve la clave guardada en este navegador, o cadena vacía si no hay.
   * localStorage puede lanzar excepción en modo privado, de ahí el try/catch.
   */
  getTmdbKey() {
    try {
      return (localStorage.getItem(TMDB_KEY_STORAGE) || '').trim();
    } catch (e) {
      return '';
    }
  },

  /**
   * Guarda la clave en este dispositivo. Devuelve true si se pudo guardar.
   */
  setTmdbKey(key) {
    const clean = (key || '').trim();
    try {
      if (clean) {
        localStorage.setItem(TMDB_KEY_STORAGE, clean);
      } else {
        localStorage.removeItem(TMDB_KEY_STORAGE);
      }
      // La caché de géneros se pidió con la clave anterior
      this._tmdbGenreCache = null;
      this._tmdbKeyWarned = false;
      return true;
    } catch (e) {
      console.warn('No se pudo guardar la clave de TMDB:', e.message || e);
      return false;
    }
  },

  hasTmdbKey() {
    if (this.getTmdbKey()) return true;
    if (!this._tmdbKeyWarned) {
      this._tmdbKeyWarned = true;
      console.warn(
        'CineTrack: falta la clave de TMDB, las búsquedas de películas están desactivadas. ' +
        'Añádela desde el menú de opciones de la app.'
      );
    }
    return false;
  },

  tmdbUrl(path, params = {}) {
    const query = new URLSearchParams({
      api_key: this.getTmdbKey(),
      language: this.TMDB_LANG,
      ...params
    });
    return `${this.TMDB_BASE}${path}?${query.toString()}`;
  },

  tmdbImage(path, size = 'w500') {
    return path ? `${this.TMDB_IMG}/${size}${path}` : null;
  },

  // Mapa id→nombre de géneros de películas (se pide una sola vez por sesión)
  async getTmdbMovieGenres() {
    if (this._tmdbGenreCache) return this._tmdbGenreCache;
    try {
      const data = await this.fetchJson(this.tmdbUrl('/genre/movie/list'), { timeout: 6000 });
      this._tmdbGenreCache = new Map((data.genres || []).map(g => [g.id, g.name]));
    } catch (error) {
      this._tmdbGenreCache = new Map();
    }
    return this._tmdbGenreCache;
  },

  /**
   * Buscar películas en TMDB por título, y también por actor o director:
   * el mismo cuadro de búsqueda prueba ambas cosas a la vez, sin modo aparte.
   * Para los primeros resultados se piden detalles (duración, director,
   * reparto, géneros) en paralelo.
   */
  async searchMovies(query) {
    if (!this.hasTmdbKey()) return [];

    try {
      const [data, genreMap] = await Promise.all([
        this.fetchJson(this.tmdbUrl('/search/movie', { query, include_adult: 'false' }), { timeout: 8000, retries: 1 }),
        this.getTmdbMovieGenres()
      ]);

      const titleResults = (data.results || []).slice(0, 12);
      const titleIds = new Set(titleResults.map(m => m.id));

      const personResults = await this._searchMoviesByPerson(query, titleIds);
      // Con una persona reconocible, sus créditos van antes que coincidencias
      // de título incidentales (p. ej. documentales menores sobre esa misma
      // persona, que si no compiten con sus películas de verdad).
      const combined = [...personResults, ...titleResults].slice(0, 18);

      if (combined.length === 0) return [];

      return await this._buildMovieCards(combined, genreMap, query);
    } catch (error) {
      console.warn('TMDB no disponible, no se pudieron buscar películas:', error.message || error);
      return [];
    }
  },

  /**
   * Busca películas donde el texto coincide con un actor o director, no con
   * el título. TMDB no distingue bien "actor" de "director" en el campo
   * known_for_department (a Clint Eastwood lo marca como "Acting" aunque
   * tenga decenas de películas dirigidas), así que se combinan siempre los
   * créditos de reparto y de dirección de la persona encontrada.
   */
  async _searchMoviesByPerson(query, excludeIds = new Set()) {
    try {
      const data = await this.fetchJson(
        this.tmdbUrl('/search/person', { query, include_adult: 'false' }),
        { timeout: 6000, retries: 0 }
      );

      const person = (data.results || [])[0];
      if (!person || (person.popularity || 0) < 2) return [];

      const credits = await this.fetchJson(
        this.tmdbUrl(`/person/${person.id}/movie_credits`),
        { timeout: 6000, retries: 0 }
      );

      const directed = (credits.crew || []).filter(c => c.job === 'Director');
      const acted = credits.cast || [];

      const pool = [
        ...directed.map(m => ({ ...m, _matchedRole: 'Director' })),
        ...acted.map(m => ({ ...m, _matchedRole: 'Actor' }))
      ];

      const seen = new Set(excludeIds);
      const results = [];

      pool.forEach(movie => {
        if (!movie.id || seen.has(movie.id)) return;
        seen.add(movie.id);
        results.push({ ...movie, _matchedPerson: person.name });
      });

      // Se ordena por popularidad, no por fecha: TMDB registra como "reparto"
      // cualquier aparición como "Self" en documentales y homenajes, casi
      // siempre con fecha más reciente que sus películas de verdad, que
      // quedarían enterradas si se ordenara por estreno.
      results.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

      return results.slice(0, 8);
    } catch (error) {
      console.warn('TMDB: no se pudo buscar por actor/director:', error.message || error);
      return [];
    }
  },

  /**
   * Convierte resultados básicos de TMDB (de /search/movie o de créditos de
   * una persona) en las tarjetas que usa el resto de la app. Solo se piden
   * detalles completos (duración, director, reparto) de los 10 primeros.
   */
  async _buildMovieCards(basicResults, genreMap, fallbackTitle) {
    const detailed = await Promise.all(
      basicResults.map((movie, index) =>
        index < 10
          ? this.fetchJson(this.tmdbUrl(`/movie/${movie.id}`, { append_to_response: 'credits' }), { timeout: 8000, retries: 0 })
              .catch(() => null)
          : Promise.resolve(null)
      )
    );

    return basicResults.map((movie, index) => {
      const detail = detailed[index];
      const genres = detail?.genres?.length
        ? detail.genres.map(g => g.name)
        : (movie.genre_ids || []).map(id => genreMap.get(id)).filter(Boolean);

      const director = detail?.credits?.crew?.find(person => person.job === 'Director')?.name || 'Desconocido';
      const cast = (detail?.credits?.cast || []).slice(0, 5).map(person => person.name);
      const runtime = detail?.runtime || null;
      const poster = this.tmdbImage(movie.poster_path, 'w500');

      return {
        apiId: `tmdb_${movie.id}`,
        originalId: movie.id,
        title: movie.title || movie.original_title || fallbackTitle,
        type: 'movie',
        poster: poster || this.getPlaceholderPoster(movie.title, 'movie'),
        backdrop: this.tmdbImage(movie.backdrop_path, 'w1280') || poster,
        year: movie.release_date ? movie.release_date.substring(0, 4) : 'N/A',
        genres: genres.length ? genres : ['Cine'],
        status: detail?.status || 'Released',
        summary: movie.overview || detail?.overview || 'Sin descripción disponible.',
        rating: movie.vote_average ? Number(movie.vote_average).toFixed(1) : null,
        director: director,
        cast: cast,
        durationMinutes: runtime,
        duration: runtime ? `${runtime} min` : null,
        previewUrl: null,
        officialSite: detail?.homepage || `https://www.themoviedb.org/movie/${movie.id}`,
        matchedPerson: movie._matchedPerson || null,
        matchedRole: movie._matchedRole || null
      };
    });
  },

  /**
   * Buscar series en TMDB (respaldo cuando TVMaze no responde)
   */
  async _searchShowsTmdb(query) {
    if (!this.hasTmdbKey()) return [];

    try {
      const data = await this.fetchJson(
        this.tmdbUrl('/search/tv', { query, include_adult: 'false' }),
        { timeout: 8000, retries: 0 }
      );

      return (data.results || []).slice(0, 12).map(show => {
        const poster = this.tmdbImage(show.poster_path, 'w500');
        return {
          apiId: `tmdbtv_${show.id}`,
          // Prefijo "tmdb:" para que getShowEpisodes sepa a qué API preguntar
          originalId: `tmdb:${show.id}`,
          title: show.name || show.original_name || query,
          type: 'series',
          poster: poster || this.getPlaceholderPoster(show.name, 'series'),
          backdrop: this.tmdbImage(show.backdrop_path, 'w1280') || poster,
          year: show.first_air_date ? show.first_air_date.substring(0, 4) : 'N/A',
          genres: [],
          status: 'Unknown',
          summary: show.overview || 'Sin descripción disponible.',
          rating: show.vote_average ? Number(show.vote_average).toFixed(1) : null,
          duration: null,
          episodeDuration: 45,
          network: 'TV/Streaming',
          officialSite: `https://www.themoviedb.org/tv/${show.id}`,
          totalEpisodes: 10,
          totalSeasons: 1
        };
      });
    } catch (error) {
      console.warn('TMDB tampoco pudo buscar series:', error.message || error);
      return [];
    }
  },

  // ───────────────────────────── TVMaze ─────────────────────────────

  /**
   * Buscar series en TVMaze (sin clave). Si falla, se usa TMDB.
   */
  async searchShows(query) {
    try {
      const data = await this.fetchJson(
        `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`,
        { timeout: 8000, retries: 1 }
      );

      return data.map(item => {
        const show = item.show;
        let posterUrl = show.image?.original || show.image?.medium || null;
        if (posterUrl) {
          posterUrl = posterUrl.replace(/^http:\/\//i, 'https://');
        } else {
          posterUrl = this.getPlaceholderPoster(show.name, 'series');
        }
        const year = show.premiered ? show.premiered.substring(0, 4) : 'N/A';
        const rating = show.rating?.average ? Number(show.rating.average).toFixed(1) : null;
        const epDuration = show.averageRuntime || show.runtime || null;

        return {
          apiId: `tvmaze_${show.id}`,
          originalId: show.id,
          title: show.name,
          type: 'series',
          poster: posterUrl,
          backdrop: show.image?.original || posterUrl,
          year: year,
          genres: show.genres || [],
          status: show.status || 'Unknown',
          summary: this.stripHtml(show.summary),
          rating: rating,
          duration: epDuration ? `${epDuration} min/ep` : null,
          episodeDuration: epDuration || 45,
          network: show.network?.name || show.webChannel?.name || 'TV/Streaming',
          officialSite: show.officialSite || null,
          totalEpisodes: 10, // Estimado inicial que se puede enriquecer al añadir
          totalSeasons: 1
        };
      });
    } catch (error) {
      console.warn('TVMaze no disponible, se prueba TMDB para series:', error.message || error);
      return await this._searchShowsTmdb(query);
    }
  },

  /**
   * Episodios reales de una serie.
   * Acepta un id numérico de TVMaze o "tmdb:<id>" para series de TMDB.
   * Siempre devuelve el formato de TVMaze: { season, number, name, runtime, summary }.
   */
  async getShowEpisodes(showId) {
    const id = String(showId || '');

    if (id.startsWith('tmdb:')) {
      return await this._getTmdbEpisodes(id.slice(5));
    }

    try {
      return await this.fetchJson(`https://api.tvmaze.com/shows/${id}/episodes`, { timeout: 8000 });
    } catch (e) {
      console.warn('No se pudieron obtener episodios detallados:', e.message || e);
      return null;
    }
  },

  async _getTmdbEpisodes(tmdbId) {
    if (!this.hasTmdbKey()) return null;

    try {
      const show = await this.fetchJson(this.tmdbUrl(`/tv/${tmdbId}`), { timeout: 8000 });
      // Se ignoran los "especiales" (temporada 0) y se limita a 20 temporadas
      const seasons = (show.seasons || [])
        .filter(s => s.season_number > 0)
        .slice(0, 20);

      const seasonData = await Promise.all(
        seasons.map(s =>
          this.fetchJson(this.tmdbUrl(`/tv/${tmdbId}/season/${s.season_number}`), { timeout: 8000, retries: 0 })
            .catch(() => null)
        )
      );

      const episodes = [];
      seasonData.forEach(season => {
        (season?.episodes || []).forEach(ep => {
          episodes.push({
            season: ep.season_number,
            number: ep.episode_number,
            name: ep.name || `Episodio ${ep.episode_number}`,
            runtime: ep.runtime || show.episode_run_time?.[0] || 45,
            summary: ep.overview || ''
          });
        });
      });

      return episodes.length > 0 ? episodes : null;
    } catch (e) {
      console.warn('No se pudieron obtener episodios de TMDB:', e.message || e);
      return null;
    }
  },

  /**
   * Búsqueda unificada con filtro de tipo (all, series, movie)
   */
  async searchUnified(query, filter = 'all') {
    if (!query || query.trim().length === 0) return [];
    const trimmedQuery = query.trim();

    if (filter === 'series') {
      return await this.searchShows(trimmedQuery);
    } else if (filter === 'movie') {
      return await this.searchMovies(trimmedQuery);
    } else {
      // Buscar ambos en paralelo
      const [shows, movies] = await Promise.all([
        this.searchShows(trimmedQuery),
        this.searchMovies(trimmedQuery)
      ]);

      // Intercalar resultados para una lista atractiva
      const combined = [];
      const maxLength = Math.max(shows.length, movies.length);
      for (let i = 0; i < maxLength; i++) {
        if (shows[i]) combined.push(shows[i]);
        if (movies[i]) combined.push(movies[i]);
      }
      return combined;
    }
  }
};

window.API_SERVICE = API_SERVICE;
