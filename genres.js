/**
 * CineTrack - Géneros conocidos y su traducción
 *
 * Los géneros se guardan como texto, en el idioma en que llegaron (TMDB los
 * devuelve traducidos, TVMaze siempre en inglés) o tal como los escribe el
 * usuario. Esta tabla reconoce los nombres estándar en cualquiera de los tres
 * idiomas y los muestra en el idioma activo. Un mismo género en distintos
 * idiomas ("Ciencia Ficción" / "Science Fiction" / "Science-Fiction") cuenta
 * como uno solo al filtrar.
 *
 * Todo lo que NO esté en la tabla se considera un género personalizado del
 * usuario: se muestra exactamente como lo escribió y nunca se traduce.
 */
(function () {
  // key: identificador interno · es/en/pl: nombre a mostrar · aliases: otras grafías conocidas
  // tmdbTv: id del género en las series de TMDB (para el respaldo cuando TVMaze no responde)
  const CATALOG = [
    // Géneros de películas de TMDB
    { key: 'action', es: 'Acción', en: 'Action', pl: 'Akcja' },
    { key: 'adventure', es: 'Aventura', en: 'Adventure', pl: 'Przygodowy', aliases: ['Aventuras'] },
    { key: 'animation', es: 'Animación', en: 'Animation', pl: 'Animacja', tmdbTv: 16 },
    { key: 'comedy', es: 'Comedia', en: 'Comedy', pl: 'Komedia', tmdbTv: 35 },
    { key: 'crime', es: 'Crimen', en: 'Crime', pl: 'Kryminał', tmdbTv: 80 },
    { key: 'documentary', es: 'Documental', en: 'Documentary', pl: 'Dokumentalny', tmdbTv: 99 },
    { key: 'drama', es: 'Drama', en: 'Drama', pl: 'Dramat', tmdbTv: 18 },
    { key: 'family', es: 'Familia', en: 'Family', pl: 'Familijny', tmdbTv: 10751 },
    { key: 'fantasy', es: 'Fantasía', en: 'Fantasy', pl: 'Fantasy' },
    { key: 'history', es: 'Historia', en: 'History', pl: 'Historyczny' },
    { key: 'horror', es: 'Terror', en: 'Horror', pl: 'Horror', aliases: ['Horror'] },
    { key: 'music', es: 'Música', en: 'Music', pl: 'Muzyczny' },
    { key: 'mystery', es: 'Misterio', en: 'Mystery', pl: 'Tajemnica', tmdbTv: 9648 },
    { key: 'romance', es: 'Romance', en: 'Romance', pl: 'Romans' },
    { key: 'scifi', es: 'Ciencia Ficción', en: 'Science Fiction', pl: 'Sci-Fi', aliases: ['Science-Fiction', 'SciFi'] },
    { key: 'tvmovie', es: 'Película de TV', en: 'TV Movie', pl: 'Film TV' },
    { key: 'thriller', es: 'Suspense', en: 'Thriller', pl: 'Thriller', aliases: ['Suspenso'] },
    { key: 'war', es: 'Bélica', en: 'War', pl: 'Wojenny', aliases: ['Guerra'] },
    { key: 'western', es: 'Western', en: 'Western', pl: 'Western', tmdbTv: 37 },

    // Géneros propios de las series de TMDB
    { key: 'actionadventure', es: 'Acción y Aventura', en: 'Action & Adventure', pl: 'Akcja i Przygoda', tmdbTv: 10759 },
    { key: 'kids', es: 'Infantil', en: 'Kids', pl: 'Dla dzieci', aliases: ['Children', 'Niños'], tmdbTv: 10762 },
    { key: 'news', es: 'Noticias', en: 'News', pl: 'Wiadomości', tmdbTv: 10763 },
    { key: 'reality', es: 'Reality', en: 'Reality', pl: 'Reality', aliases: ['Telerrealidad'], tmdbTv: 10764 },
    { key: 'scifantasy', es: 'Ciencia Ficción y Fantasía', en: 'Sci-Fi & Fantasy', pl: 'Sci-Fi i Fantasy', tmdbTv: 10765 },
    { key: 'soap', es: 'Telenovela', en: 'Soap', pl: 'Opera mydlana', aliases: ['Soap Opera'], tmdbTv: 10766 },
    { key: 'talk', es: 'Talk Show', en: 'Talk', pl: 'Talk-show', aliases: ['Talk Show'], tmdbTv: 10767 },
    { key: 'warpolitics', es: 'Bélica y Política', en: 'War & Politics', pl: 'Wojna i Polityka', tmdbTv: 10768 },

    // Géneros adicionales que usa TVMaze
    { key: 'supernatural', es: 'Sobrenatural', en: 'Supernatural', pl: 'Nadprzyrodzone' },
    { key: 'anime', es: 'Anime', en: 'Anime', pl: 'Anime' },
    { key: 'medical', es: 'Médico', en: 'Medical', pl: 'Medyczny' },
    { key: 'legal', es: 'Legal', en: 'Legal', pl: 'Prawniczy' },
    { key: 'espionage', es: 'Espionaje', en: 'Espionage', pl: 'Szpiegowski' },
    { key: 'sports', es: 'Deportes', en: 'Sports', pl: 'Sportowy' },
    { key: 'food', es: 'Gastronomía', en: 'Food', pl: 'Kulinarny' },
    { key: 'travel', es: 'Viajes', en: 'Travel', pl: 'Podróżniczy' },
    { key: 'nature', es: 'Naturaleza', en: 'Nature', pl: 'Przyrodniczy' },
    { key: 'diy', es: 'Bricolaje', en: 'DIY', pl: 'Zrób to sam' },
    { key: 'adult', es: 'Adultos', en: 'Adult', pl: 'Dla dorosłych' },

    // Géneros por defecto que asigna la propia app cuando no se indica ninguno
    { key: 'cinema', es: 'Cine', en: 'Cinema', pl: 'Kino', aliases: ['Cine'] },
    { key: 'tvseries', es: 'Serie', en: 'Series', pl: 'Serial', aliases: ['Serie', 'Series'] }
  ];

  // Normaliza para comparar: sin tildes, sin mayúsculas ni signos ("Sci-Fi" = "scifi")
  function norm(text) {
    return String(text || '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/ł/g, 'l')
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '');
  }

  const BY_KEY = {};
  const BY_ALIAS = {};
  const BY_TMDB_TV = {};

  CATALOG.forEach(entry => {
    BY_KEY[entry.key] = entry;
    [entry.es, entry.en, entry.pl].concat(entry.aliases || []).forEach(name => {
      const alias = norm(name);
      if (alias && !BY_ALIAS[alias]) BY_ALIAS[alias] = entry.key;
    });
    if (entry.tmdbTv) BY_TMDB_TV[entry.tmdbTv] = entry.key;
  });

  const GENRES = {
    catalog: CATALOG,

    // Clave interna del género conocido, o null si es personalizado
    knownKey(name) {
      return BY_ALIAS[norm(name)] || null;
    },

    // Identificador para agrupar y filtrar: los conocidos se unifican entre
    // idiomas ("k:scifi"); los personalizados se distinguen por su texto ("c:...")
    identity(name) {
      const key = this.knownKey(name);
      return key ? 'k:' + key : 'c:' + String(name || '').trim().toLowerCase();
    },

    // Nombre a mostrar en el idioma activo; un género personalizado se devuelve tal cual
    label(name) {
      const key = this.knownKey(name);
      return key ? this.labelForKey(key) : String(name || '').trim();
    },

    labelForKey(key) {
      const entry = BY_KEY[key];
      if (!entry) return key;
      const lang = (window.I18N && window.I18N.lang) || 'es';
      return entry[lang] || entry.es;
    },

    // Nombre a mostrar a partir de un identificador ("k:scifi"); los personalizados
    // ("c:...") no llevan el texto original, que lo guarda quien los muestra
    labelForIdentity(id) {
      return String(id).startsWith('k:') ? this.labelForKey(String(id).slice(2)) : null;
    },

    // Géneros de una serie de TMDB (ids numéricos) en el idioma activo
    fromTmdbTv(ids) {
      return (ids || []).map(id => BY_TMDB_TV[id]).filter(Boolean).map(key => this.labelForKey(key));
    }
  };

  window.GENRES = GENRES;
})();
