/**
 * CineTrack - Internacionalización (español, inglés y polaco)
 *
 * Uso:
 *   t('clave')                 -> texto traducido
 *   t('clave', { n: 3 })       -> sustituye {n} en el texto
 *   tp('clave', 3, { ... })    -> variante plural correcta para el idioma
 *
 * En el HTML estático se marcan los elementos con:
 *   data-i18n="clave"             -> reemplaza el texto del elemento
 *   data-i18n-html="clave"        -> igual, pero interpretando HTML
 *   data-i18n-placeholder="clave" -> también data-i18n-title, -aria-label
 *
 * El idioma elegido se guarda en localStorage y, al cambiarlo, se dispara
 * el evento "cinetrack:languagechange" para que la app redibuje su contenido.
 */
(function () {
  const STORAGE_KEY = 'cinetrack_lang';
  const SUPPORTED = ['es', 'en', 'pl'];
  const DEFAULT_LANG = 'es';
  const LOCALES = { es: 'es-ES', en: 'en-US', pl: 'pl-PL' };

  const DICT = {};

  // Registra una clave con sus tres traducciones.
  // Un valor puede ser texto o un objeto de formas plurales { one, few, many, other }.
  function add(key, es, en, pl) {
    DICT[key] = { es, en, pl };
  }

  // ───────────────────────────── Cabecera y menú ─────────────────────────────
  add('meta.title', 'CineTrack - Tracker de Series y Películas', 'CineTrack - Series & Movies Tracker', 'CineTrack - Śledzenie seriali i filmów');
  add('header.tagline', 'Series & Movies', 'Series & Movies', 'Seriale i filmy');
  add('header.searchApi', 'Buscar en API', 'Search online', 'Szukaj online');
  add('header.search', 'Buscar', 'Search', 'Szukaj');
  add('header.addManual', 'Añadir título manualmente', 'Add a title manually', 'Dodaj tytuł ręcznie');
  add('header.options', 'Opciones y Copias de Seguridad', 'Options and backups', 'Opcje i kopie zapasowe');
  add('header.optionsAria', 'Opciones de copia de seguridad', 'Backup options', 'Opcje kopii zapasowej');

  add('menu.dataTitle', 'Datos y Respaldos', 'Data & Backups', 'Dane i kopie zapasowe');
  add('menu.dataSub', 'Administra tu biblioteca local', 'Manage your local library', 'Zarządzaj swoją lokalną biblioteką');
  add('menu.export', 'Descargar Copia', 'Download backup', 'Pobierz kopię');
  add('menu.exportSub', 'Guardar archivo JSON', 'Save a JSON file', 'Zapisz plik JSON');
  add('menu.import', 'Restaurar Copia', 'Restore backup', 'Przywróć kopię');
  add('menu.importSub', 'Importar archivo JSON', 'Import a JSON file', 'Importuj plik JSON');
  add('menu.language', 'Idioma', 'Language', 'Język');
  add('menu.apiKey', 'Clave de TMDB', 'TMDB key', 'Klucz TMDB');
  add('menu.apiKeyNeeded', 'Necesaria para buscar películas', 'Required to search movies', 'Wymagany do wyszukiwania filmów');
  add('menu.apiKeySaved', 'Guardada en este dispositivo', 'Saved on this device', 'Zapisany na tym urządzeniu');
  add('menu.reset', 'Restablecer', 'Reset', 'Resetuj');
  add('menu.resetSub', 'Vaciar la lista y empezar de cero', 'Clear the list and start fresh', 'Wyczyść listę i zacznij od nowa');

  // ───────────────────────────── Filtros y ordenación ─────────────────────────────
  add('tabs.all', 'Todo', 'All', 'Wszystko');
  add('tabs.movies', 'Películas', 'Movies', 'Filmy');
  add('tabs.series', 'Series', 'Series', 'Seriale');
  add('list.searchPlaceholder', 'Buscar en tu lista...', 'Search your list...', 'Szukaj na swojej liście...');
  add('list.genreTitle', 'Filtrar películas por género', 'Filter movies by genre', 'Filtruj filmy według gatunku');
  add('sort.recent', 'Recientes', 'Recent', 'Najnowsze');
  add('sort.rating', 'Mayor Puntuación', 'Highest rated', 'Najwyżej oceniane');
  add('sort.title', 'Título A-Z', 'Title A-Z', 'Tytuł A-Z');
  add('sort.year', 'Año de Estreno', 'Release year', 'Rok premiery');

  add('status.label', 'Estado:', 'Status:', 'Status:');
  add('statusChip.all', 'Todos los Estados', 'All statuses', 'Wszystkie statusy');
  add('statusChip.watching', 'Viendo', 'Watching', 'Oglądam');
  add('statusChip.plan', 'Por Ver', 'Plan to watch', 'Do obejrzenia');
  add('statusChip.completed', 'Completadas', 'Completed', 'Obejrzane');
  add('statusChip.favorites', 'Favoritas', 'Favorites', 'Ulubione');
  add('statusSel.all', 'Estado: Todos los Estados', 'Status: All statuses', 'Status: Wszystkie statusy');
  add('statusSel.watching', 'Estado: Viendo', 'Status: Watching', 'Status: Oglądam');
  add('statusSel.plan', 'Estado: Por ver', 'Status: Plan to watch', 'Status: Do obejrzenia');
  add('statusSel.completed', 'Estado: Completadas', 'Status: Completed', 'Status: Obejrzane');
  add('statusSel.favorites', '❤ Favoritas', '❤ Favorites', '❤ Ulubione');

  // ───────────────────────────── Secciones del catálogo ─────────────────────────────
  add('section.movies', 'Películas y Cine', 'Movies & Cinema', 'Filmy i kino');
  add('section.moviesViewOnly', 'Ver solo películas', 'View movies only', 'Tylko filmy');
  add('section.series', 'Series de Televisión', 'TV Series', 'Seriale telewizyjne');
  add('section.seriesViewOnly', 'Ver solo series', 'View series only', 'Tylko seriale');
  add('section.genreFilters', 'Filtros por Género', 'Genre filters', 'Filtry gatunków');
  add('section.genreCount', '{a} de {b} ({genre})', '{a} of {b} ({genre})', '{a} z {b} ({genre})');

  add('count.series',
    { one: '{n} serie', other: '{n} series' },
    { one: '{n} series', other: '{n} series' },
    { one: '{n} serial', few: '{n} seriale', many: '{n} seriali', other: '{n} seriali' });
  add('count.movies',
    { one: '{n} película', other: '{n} películas' },
    { one: '{n} movie', other: '{n} movies' },
    { one: '{n} film', few: '{n} filmy', many: '{n} filmów', other: '{n} filmów' });
  add('count.features',
    { one: '{n} largometraje', other: '{n} largometrajes' },
    { one: '{n} feature film', other: '{n} feature films' },
    { one: '{n} film fabularny', few: '{n} filmy fabularne', many: '{n} filmów fabularnych', other: '{n} filmów fabularnych' });
  add('count.episodesWatched',
    { one: '{n} episodio visto', other: '{n} episodios vistos' },
    { one: '{n} episode watched', other: '{n} episodes watched' },
    { one: '{n} obejrzany odcinek', few: '{n} obejrzane odcinki', many: '{n} obejrzanych odcinków', other: '{n} obejrzanych odcinków' });
  add('count.seasonsAvailable',
    { one: '{n} temporada disponible', other: '{n} temporadas disponibles' },
    { one: '{n} season available', other: '{n} seasons available' },
    { one: '{n} dostępny sezon', few: '{n} dostępne sezony', many: '{n} dostępnych sezonów', other: '{n} dostępnych sezonów' });
  add('count.titlesImported',
    { one: 'Se importó {n} título con éxito.', other: 'Se importaron {n} títulos con éxito.' },
    { one: 'Imported {n} title successfully.', other: 'Imported {n} titles successfully.' },
    { one: 'Zaimportowano {n} tytuł.', few: 'Zaimportowano {n} tytuły.', many: 'Zaimportowano {n} tytułów.', other: 'Zaimportowano {n} tytułów.' });
  add('count.newEpisodes',
    { one: '{n} episodio nuevo', other: '{n} episodios nuevos' },
    { one: '{n} new episode', other: '{n} new episodes' },
    { one: '{n} nowy odcinek', few: '{n} nowe odcinki', many: '{n} nowych odcinków', other: '{n} nowych odcinków' });
  add('series.ofGenre',
    { one: '{n} serie de {genre}', other: '{n} series de {genre}' },
    { one: '{n} {genre} series', other: '{n} {genre} series' },
    { one: '{n} serial ({genre})', few: '{n} seriale ({genre})', many: '{n} seriali ({genre})', other: '{n} seriali ({genre})' });
  add('movies.ofGenre',
    { one: '{n} película de {genre}', other: '{n} películas de {genre}' },
    { one: '{n} {genre} movie', other: '{n} {genre} movies' },
    { one: '{n} film ({genre})', few: '{n} filmy ({genre})', many: '{n} filmów ({genre})', other: '{n} filmów ({genre})' });
  add('series.tracking', '{n} en seguimiento', '{n} being tracked', '{n} w śledzeniu');
  add('movies.runtime', '{h}h {m}m de metraje', '{h}h {m}m total runtime', '{h}h {m}m łącznie');
  add('movies.subDefault', 'Largometrajes con duración real y calificaciones', 'Feature films with real runtimes and ratings', 'Filmy pełnometrażowe z rzeczywistym czasem trwania i ocenami');
  add('series.subDefault', 'Seguimiento por temporadas y episodios', 'Tracking by seasons and episodes', 'Śledzenie według sezonów i odcinków');

  add('empty.movies.title', 'No hay películas en esta vista', 'There are no movies in this view', 'W tym widoku nie ma filmów');
  add('empty.movies.desc', 'Prueba con otro estado o busca películas en la API para agregarlas.', 'Try another status or search for movies online to add them.', 'Spróbuj innego statusu lub wyszukaj filmy online, aby je dodać.');
  add('empty.series.title', 'No hay series en esta vista', 'There are no series in this view', 'W tym widoku nie ma seriali');
  add('empty.series.desc', 'Prueba con otro estado o busca series en la API para llevar su seguimiento.', 'Try another status or search for series online to start tracking them.', 'Spróbuj innego statusu lub wyszukaj seriale online, aby zacząć je śledzić.');
  add('empty.all.title', 'No se encontraron resultados', 'No results found', 'Nie znaleziono wyników');
  add('empty.all.desc', 'Prueba a cambiar los filtros o realiza una búsqueda en la API.', 'Try changing the filters or search online.', 'Spróbuj zmienić filtry lub wyszukaj online.');
  add('empty.default.title', 'No hay títulos en esta sección', 'There are no titles in this section', 'W tej sekcji nie ma tytułów');
  add('empty.default.desc', 'Utiliza el buscador con API para encontrar series y películas con sus carátulas oficiales en alta calidad.', 'Use the online search to find series and movies with their official high-quality covers.', 'Użyj wyszukiwarki online, aby znaleźć seriale i filmy z oficjalnymi okładkami w wysokiej jakości.');
  add('empty.searchBtn', 'Buscar en la API', 'Search online', 'Szukaj online');

  add('genre.all', 'Todos', 'All', 'Wszystkie');
  add('genre.selectAll', 'Género: Todos ({n})', 'Genre: All ({n})', 'Gatunek: Wszystkie');
  add('genre.emptyMovies', 'No hay películas del género "{genre}"', 'There are no movies in the genre "{genre}"', 'Brak filmów w gatunku „{genre}”');
  add('genre.emptySeries', 'No hay series del género "{genre}"', 'There are no series in the genre "{genre}"', 'Brak seriali w gatunku „{genre}”');
  add('genre.emptyHint', 'Prueba a seleccionar otro género o restablecer el filtro.', 'Try selecting another genre or resetting the filter.', 'Spróbuj wybrać inny gatunek lub zresetować filtr.');
  add('genre.viewAll', 'Ver todos los géneros', 'View all genres', 'Zobacz wszystkie gatunki');
  add('genre.defaultMovie', 'Cine', 'Cinema', 'Kino');
  add('genre.defaultSeries', 'Serie', 'Series', 'Serial');

  // ───────────────────────────── Tarjetas ─────────────────────────────
  add('card.status.plan', 'Por Ver', 'Plan to watch', 'Do obejrzenia');
  add('card.status.watching', 'Viendo', 'Watching', 'Oglądam');
  add('card.status.completed', 'Completado', 'Completed', 'Obejrzane');
  add('card.status.onHold', 'En Pausa', 'On hold', 'Wstrzymane');
  add('card.progress', 'Temp. {s} • Cap. {c}/{t}', 'S{s} • Ep. {c}/{t}', 'Sez. {s} • Odc. {c}/{t}');
  add('card.nextEpTitle', 'Avanzar +1 episodio visto', 'Advance +1 watched episode', 'Dodaj +1 obejrzany odcinek');
  add('card.nextEp', '+1 Ep', '+1 Ep', '+1 odc.');
  add('card.markPendingTitle', 'Marcar como pendiente', 'Mark as pending', 'Oznacz jako do obejrzenia');
  add('card.markDoneTitle', 'Marcar como completada', 'Mark as completed', 'Oznacz jako obejrzany');
  add('card.watched', 'Vista', 'Watched', 'Obejrzany');
  add('card.mark', 'Marcar', 'Mark', 'Oznacz');
  add('card.unrated', 'Sin calificar', 'Not rated', 'Bez oceny');
  add('card.favRemove', 'Quitar de favoritos', 'Remove from favorites', 'Usuń z ulubionych');
  add('card.favAdd', 'Marcar favorito', 'Add to favorites', 'Dodaj do ulubionych');
  add('card.filterMovies', 'Filtrar películas por {g}', 'Filter movies by {g}', 'Filtruj filmy: {g}');
  add('card.titleFallback', 'Título', 'Title', 'Tytuł');

  add('type.movie', 'Película', 'Movie', 'Film');
  add('type.series', 'Serie', 'Series', 'Serial');
  add('type.seriesTv', 'Serie de TV', 'TV series', 'Serial TV');

  // ───────────────────────────── Buscador de la API ─────────────────────────────
  add('search.title', 'Explorador de Series y Películas', 'Series & Movies Explorer', 'Przeglądarka seriali i filmów');
  add('search.subtitle', 'Portadas e información obtenidas de TVMaze & TMDB', 'Covers and info from TVMaze & TMDB', 'Okładki i informacje z TVMaze i TMDB');
  add('search.placeholder', 'Ej: Stranger Things, Breaking Bad, Inception, Dune...', 'E.g. Stranger Things, Breaking Bad, Inception, Dune...', 'Np. Stranger Things, Breaking Bad, Incepcja, Diuna...');
  add('search.filterAll', 'Todo (Series y Películas)', 'All (Series & Movies)', 'Wszystko (seriale i filmy)');
  add('search.filterSeries', 'Solo Series (TVMaze)', 'Series only (TVMaze)', 'Tylko seriale (TVMaze)');
  add('search.filterMovies', 'Solo Películas (TMDB)', 'Movies only (TMDB)', 'Tylko filmy (TMDB)');
  add('search.loading', 'Buscando portadas e información en tiempo real...', 'Searching covers and info in real time...', 'Wyszukiwanie okładek i informacji na żywo...');
  add('search.emptyTitle', 'Escribe el nombre de cualquier película o serie para buscar', 'Type the name of any movie or series to search', 'Wpisz nazwę dowolnego filmu lub serialu, aby wyszukać');
  add('search.emptySub', 'Descarga automática de carátulas en alta resolución', 'Automatic download of high-resolution covers', 'Automatyczne pobieranie okładek w wysokiej rozdzielczości');
  add('search.noResults', 'No encontramos resultados para "{q}"', 'We found no results for "{q}"', 'Nie znaleziono wyników dla „{q}”');
  add('search.noResultsHint', 'Prueba con otro título o cambia el filtro de Series/Películas.', 'Try another title or change the Series/Movies filter.', 'Spróbuj innego tytułu lub zmień filtr seriali/filmów.');
  add('search.error', 'Error al consultar la API de portadas.', 'Error while querying the covers API.', 'Błąd podczas pobierania okładek z API.');
  add('result.directedBy', 'Dirigida por', 'Directed by', 'Reżyseria:');
  add('result.with', 'Con', 'With', 'Występuje:');
  add('search.addBtn', 'Añadir', 'Add', 'Dodaj');
  add('result.added','Añadido', 'Added', 'Dodano');
  add('action.add', 'Añadir', 'Add', 'Dodaj');

  add('offline.title', 'Sin conexión a internet', 'No internet connection', 'Brak połączenia z internetem');
  add('offline.desc1', 'El buscador necesita conexión para consultar TMDB y TVMaze.', 'The search needs a connection to query TMDB and TVMaze.', 'Wyszukiwarka wymaga połączenia, aby odpytać TMDB i TVMaze.');
  add('offline.desc2', 'Tu biblioteca guardada sigue disponible.', 'Your saved library is still available.', 'Twoja zapisana biblioteka jest nadal dostępna.');
  add('keyNotice.title', 'Solo se están buscando series', 'Only series are being searched', 'Wyszukiwane są tylko seriale');
  add('keyNotice.desc', 'Añade tu clave gratuita de TMDB para que aparezcan también las películas.', 'Add your free TMDB key so movies show up too.', 'Dodaj swój darmowy klucz TMDB, aby wyświetlały się także filmy.');

  // ───────────────────────────── Ficha de detalle ─────────────────────────────
  add('detail.title', 'Detalle y Seguimiento', 'Details & Tracking', 'Szczegóły i śledzenie');
  add('detail.noSynopsis', 'Sin sinopsis disponible.', 'No synopsis available.', 'Brak dostępnego opisu.');
  add('detail.cover', 'Portada', 'Cover', 'Okładka');
  add('detail.directedBy', 'Dirigida por', 'Directed by', 'Reżyseria:');
  add('detail.cast', 'Reparto:', 'Cast:', 'Obsada:');
  add('form.status', 'Estado', 'Status', 'Status');
  add('form.platform', 'Plataforma', 'Platform', 'Platforma');
  add('editStatus.watching', 'Viendo actualmente', 'Currently watching', 'Aktualnie oglądam');
  add('editStatus.plan', 'Por ver (Pendiente)', 'Plan to watch (pending)', 'Do obejrzenia (oczekuje)');
  add('editStatus.completed', 'Completada', 'Completed', 'Obejrzane');
  add('editStatus.onHold', 'En pausa / Abandonada', 'On hold / Dropped', 'Wstrzymane / Porzucone');
  add('manualStatus.plan', 'Por ver', 'Plan to watch', 'Do obejrzenia');
  add('manualStatus.watching', 'Viendo', 'Watching', 'Oglądam');
  add('platform.cinema', 'Cine / Pantalla Grande', 'Cinema / Big screen', 'Kino / Duży ekran');
  add('platform.other', 'Otra / General', 'Other / General', 'Inna / Ogólna');
  add('platform.otherShort', 'Otra', 'Other', 'Inna');
  add('platform.cinemaShort', 'Cine', 'Cinema', 'Kino');
  add('form.rating', 'Tu Calificación Personal', 'Your personal rating', 'Twoja osobista ocena');
  add('form.genres', 'Género(s)', 'Genre(s)', 'Gatunki');
  add('form.genresHint', 'Separados por comas para clasificar y filtrar fácilmente.', 'Separated by commas to classify and filter easily.', 'Oddzielone przecinkami, aby łatwo klasyfikować i filtrować.');
  add('form.genresPlaceholder', 'Ej: Ciencia Ficción, Aventura, Drama', 'E.g. Sci-Fi, Adventure, Drama', 'Np. Sci-Fi, Przygodowy, Dramat');
  add('form.posterUrl', 'URL de la Carátula / Portada (Opcional)', 'Cover / Poster URL (optional)', 'Adres URL okładki / plakatu (opcjonalnie)');
  add('form.posterPlaceholder', 'https://ejemplo.com/poster.jpg', 'https://example.com/poster.jpg', 'https://przyklad.pl/plakat.jpg');
  add('form.notes', 'Notas o Reseña Personal', 'Notes or personal review', 'Notatki lub osobista recenzja');
  add('form.notesPlaceholder', '¿Qué te pareció el final? ¿Algún capítulo memorable?', 'What did you think of the ending? Any memorable episode?', 'Co sądzisz o zakończeniu? Jakiś niezapomniany odcinek?');
  add('form.delete', 'Eliminar de mi lista', 'Remove from my list', 'Usuń z mojej listy');
  add('form.saveChanges', 'Guardar Cambios', 'Save changes', 'Zapisz zmiany');
  add('action.save', 'Guardar', 'Save', 'Zapisz');
  add('action.cancel', 'Cancelar', 'Cancel', 'Anuluj');

  // Temporadas y episodios
  add('series.seasonsTitle', 'Temporadas y Capítulos', 'Seasons & Episodes', 'Sezony i odcinki');
  add('series.markAll', 'Marcar serie completa', 'Mark series as complete', 'Oznacz cały serial jako obejrzany');
  add('series.unmarkAll', 'Desmarcar serie completa', 'Unmark complete series', 'Odznacz cały serial');
  add('series.selectSeason', 'Selecciona Temporada:', 'Select season:', 'Wybierz sezon:');
  add('series.progress', '{w} / {t} vistos ({p}%)', '{w} / {t} watched ({p}%)', '{w} / {t} obejrzanych ({p}%)');
  add('season.tab', 'Temp. {n}', 'Season {n}', 'Sezon {n}');
  add('season.title', 'Temporada {n}', 'Season {n}', 'Sezon {n}');
  add('season.badge', '{a} / {b} vistos', '{a} / {b} watched', '{a} / {b} obejrzanych');
  add('season.badgeDefault', '0/0 vistos', '0/0 watched', '0/0 obejrzanych');
  add('season.mark', 'Marcar temp. completa', 'Mark season complete', 'Oznacz sezon jako obejrzany');
  add('season.unmark', 'Desmarcar temporada', 'Unmark season', 'Odznacz sezon');
  add('ep.default', 'Capítulo {n}', 'Episode {n}', 'Odcinek {n}');
  add('ep.loading', 'Cargando temporadas y episodios exactos...', 'Loading exact seasons and episodes...', 'Wczytywanie dokładnych sezonów i odcinków...');
  add('ep.watched', 'Visto', 'Watched', 'Obejrzany');
  add('ep.mark', 'Marcar', 'Mark', 'Oznacz');

  // ───────────────────────────── Añadir manualmente ─────────────────────────────
  add('manual.title', 'Añadir Título Manualmente', 'Add title manually', 'Dodaj tytuł ręcznie');
  add('manual.name', 'Título *', 'Title *', 'Tytuł *');
  add('manual.namePlaceholder', 'Nombre de la película o serie', 'Name of the movie or series', 'Nazwa filmu lub serialu');
  add('manual.type', 'Tipo', 'Type', 'Typ');
  add('manual.year', 'Año', 'Year', 'Rok');
  add('manual.yearPlaceholder', 'Ej: 2024', 'E.g. 2024', 'Np. 2024');
  add('manual.episodes', 'Total de Episodios Estimados', 'Estimated total episodes', 'Szacowana liczba odcinków');
  add('manual.genres', 'Género(s) (Opcional)', 'Genre(s) (optional)', 'Gatunki (opcjonalnie)');
  add('manual.genresPlaceholder', 'Ej: Ciencia Ficción, Acción, Drama', 'E.g. Sci-Fi, Action, Drama', 'Np. Sci-Fi, Akcja, Dramat');
  add('manual.posterUrl', 'URL de Portada (Opcional)', 'Cover URL (optional)', 'Adres URL okładki (opcjonalnie)');
  add('manual.posterHint', 'Si se deja vacío, se generará una carátula con estilo automáticamente.', 'If left empty, a styled cover will be generated automatically.', 'Jeśli pole zostanie puste, okładka zostanie wygenerowana automatycznie.');
  add('manual.synopsis', 'Sinopsis (Opcional)', 'Synopsis (optional)', 'Opis (opcjonalnie)');
  add('manual.synopsisPlaceholder', 'Resumen breve...', 'Short summary...', 'Krótkie streszczenie...');

  // ───────────────────────────── Clave de TMDB ─────────────────────────────
  add('apiKey.intro',
    'Las búsquedas de películas usan <span class="text-slate-200 font-semibold">The Movie Database</span>, que pide una clave gratuita. Se guarda <span class="text-slate-200 font-semibold">solo en este dispositivo</span>: no viaja a ningún servidor ni queda en el código de la app.',
    'Movie searches use <span class="text-slate-200 font-semibold">The Movie Database</span>, which requires a free key. It is stored <span class="text-slate-200 font-semibold">only on this device</span>: it is never sent to any server or left in the app code.',
    'Wyszukiwanie filmów korzysta z <span class="text-slate-200 font-semibold">The Movie Database</span>, która wymaga darmowego klucza. Jest zapisywany <span class="text-slate-200 font-semibold">tylko na tym urządzeniu</span>: nie trafia na żaden serwer ani do kodu aplikacji.');
  add('apiKey.label', 'API Key (v3 auth)', 'API Key (v3 auth)', 'Klucz API (v3 auth)');
  add('apiKey.hint', 'La consigues en themoviedb.org → Ajustes → API. Es la clave corta, no el token largo que empieza por eyJ.', 'Get it at themoviedb.org → Settings → API. It is the short key, not the long token that starts with eyJ.', 'Znajdziesz go na themoviedb.org → Ustawienia → API. To krótki klucz, a nie długi token zaczynający się od eyJ.');
  add('apiKey.placeholder', '32 caracteres, por ejemplo 8f2a1c4d…', '32 characters, e.g. 8f2a1c4d…', '32 znaki, np. 8f2a1c4d…');
  add('apiKey.statusNone', 'Sin clave guardada', 'No key saved', 'Brak zapisanego klucza');
  add('apiKey.statusSaved', 'Clave guardada (termina en …{last})', 'Key saved (ends in …{last})', 'Klucz zapisany (kończy się na …{last})');
  add('apiKey.delete', 'Borrar clave', 'Delete key', 'Usuń klucz');

  // ───────────────────────────── Avisos, confirmaciones y mensajes ─────────────────────────────
  add('toast.default', 'Operación realizada con éxito', 'Operation completed successfully', 'Operacja zakończona pomyślnie');
  add('toast.genreMovies', 'Filtrando películas por género: "{g}"', 'Filtering movies by genre: "{g}"', 'Filtrowanie filmów według gatunku: „{g}”');
  add('toast.genreSeries', 'Filtrando series por género: "{g}"', 'Filtering series by genre: "{g}"', 'Filtrowanie seriali według gatunku: „{g}”');
  add('toast.favRemoved', '"{t}" quitado de favoritos', '"{t}" removed from favorites', '„{t}” usunięto z ulubionych');
  add('toast.favAdded', '"{t}" añadido a favoritos!', '"{t}" added to favorites!', '„{t}” dodano do ulubionych!');
  add('toast.epLogged', 'Episodio {n} registrado para "{t}"', 'Episode {n} logged for "{t}"', 'Odcinek {n} zapisany dla „{t}”');
  add('toast.markedDone', '¡"{t}" marcada como vista!', '"{t}" marked as watched!', '„{t}” oznaczono jako obejrzany!');
  add('toast.markedPending', '"{t}" marcada como pendiente', '"{t}" marked as pending', '„{t}” oznaczono jako do obejrzenia');
  add('toast.added', '¡"{t}" añadida a tu lista!', '"{t}" added to your list!', '„{t}” dodano do Twojej listy!');
  add('toast.addedManual', '"{t}" añadido manualmente.', '"{t}" added manually.', '„{t}” dodano ręcznie.');
  add('toast.saved', 'Guardado correctamente', 'Saved successfully', 'Zapisano pomyślnie');
  add('toast.deleted', '"{t}" eliminado', '"{t}" removed', '"{t}" usunieto');
  add('share.text', '¡Mira "{t}" en CineTrack!', 'Check out "{t}" on CineTrack!', 'Sprawdź "{t}" na CineTrack!');
  add('toast.linkCopied', 'Enlace copiado al portapapeles', 'Link copied to clipboard', 'Link skopiowany do schowka');
  add('toast.seriesDone', '¡"{t}" completada al 100%! 🏆', '"{t}" completed 100%! 🏆', '„{t}” ukończono w 100%! 🏆');
  add('toast.seriesUndone', 'Serie desmarcada', 'Series unmarked', 'Serial odznaczony');
  add('toast.seasonDone', '¡Temporada {n} completada!', 'Season {n} completed!', 'Sezon {n} ukończony!');
  add('toast.seasonUndone', 'Temporada {n} desmarcada', 'Season {n} unmarked', 'Sezon {n} odznaczony');
  add('toast.backupDownloaded', 'Copia de seguridad descargada en JSON.', 'Backup downloaded as JSON.', 'Kopia zapasowa pobrana jako JSON.');
  add('toast.importError', 'Error al importar archivo: {e}', 'Error importing file: {e}', 'Błąd importu pliku: {e}');
  add('toast.resetDone', 'Lista vaciada.', 'List cleared.', 'Lista wyczyszczona.');
  add('toast.offline', 'Sin conexión a internet', 'No internet connection', 'Brak połączenia z internetem');
  add('toast.lostConn', 'Se ha perdido la conexión a internet', 'The internet connection was lost', 'Utracono połączenie z internetem');
  add('toast.backOnline', 'Conexión restablecida', 'Connection restored', 'Połączenie przywrócone');
  add('toast.keyNeeded', 'Escribe la clave o pulsa "Borrar clave"', 'Type the key or press "Delete key"', 'Wpisz klucz lub naciśnij „Usuń klucz”');
  add('toast.keyInvalid', 'Esa no parece la clave v3: son 32 caracteres hexadecimales', 'That does not look like the v3 key: it is 32 hexadecimal characters', 'To nie wygląda na klucz v3: to 32 znaki szesnastkowe');
  add('toast.keySaveFail', 'No se pudo guardar la clave en este navegador', 'The key could not be saved in this browser', 'Nie udało się zapisać klucza w tej przeglądarce');
  add('toast.keySaved', 'Clave guardada. Ya puedes buscar películas', 'Key saved. You can now search for movies', 'Klucz zapisany. Możesz już wyszukiwać filmy');
  add('toast.keyNone', 'No hay ninguna clave guardada', 'There is no saved key', 'Nie ma zapisanego klucza');
  add('toast.keyDeleted', 'Clave borrada de este dispositivo', 'Key deleted from this device', 'Klucz usunięty z tego urządzenia');
  add('confirm.delete', '¿Estás seguro de eliminar "{t}" de tu lista?', 'Are you sure you want to remove "{t}" from your list?', 'Czy na pewno chcesz usunąć „{t}” ze swojej listy?');
  add('confirm.reset',
    '¿Seguro que quieres borrar toda tu lista? Se eliminarán todas las películas y series guardadas y no se puede deshacer.\n\nSi quieres conservarlas, cancela y usa antes "Descargar Copia".',
    'Are you sure you want to delete your whole list? All saved movies and series will be removed and this cannot be undone.\n\nIf you want to keep them, cancel and use "Download backup" first.',
    'Czy na pewno chcesz usunąć całą listę? Wszystkie zapisane filmy i seriale zostaną usunięte, a tej operacji nie można cofnąć.\n\nJeśli chcesz je zachować, anuluj i najpierw użyj „Pobierz kopię”.');

  add('storage.duplicate', 'Este título ya está en tu lista de seguimiento.', 'This title is already in your tracking list.', 'Ten tytuł jest już na Twojej liście śledzenia.');
  add('storage.badFormat', 'El formato debe ser una lista.', 'The format must be a list.', 'Format musi być listą.');

  // ───────────────────────────── Motor ─────────────────────────────
  function readSavedLang() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return SUPPORTED.includes(saved) ? saved : null;
    } catch (e) {
      return null;
    }
  }

  const I18N = {
    lang: readSavedLang() || DEFAULT_LANG,
    supported: SUPPORTED,

    get locale() {
      return LOCALES[this.lang] || LOCALES[DEFAULT_LANG];
    },

    // Texto traducido con sustitución de {parámetros}
    t(key, params) {
      const entry = DICT[key];
      if (!entry) return key;
      let value = entry[this.lang];
      if (value === undefined) value = entry[DEFAULT_LANG];
      if (typeof value === 'object') value = value.other;
      return this._format(value, params);
    },

    // Variante plural según las reglas del idioma activo (Intl.PluralRules)
    tp(key, count, params) {
      const entry = DICT[key];
      if (!entry) return key;
      let forms = entry[this.lang];
      if (forms === undefined) forms = entry[DEFAULT_LANG];
      if (typeof forms === 'string') return this._format(forms, { n: count, ...params });

      let category = 'other';
      try {
        category = new Intl.PluralRules(this.locale).select(count);
      } catch (e) { /* se usa 'other' */ }

      const text = forms[category] !== undefined ? forms[category] : forms.other;
      return this._format(text, { n: count, ...params });
    },

    _format(text, params) {
      if (!params) return text;
      return String(text).replace(/\{(\w+)\}/g, (match, name) =>
        params[name] !== undefined ? params[name] : match
      );
    },

    // Aplica las traducciones a todo el HTML marcado con data-i18n*
    apply(root) {
      const scope = root || document;

      scope.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = this.t(el.getAttribute('data-i18n'));
      });
      scope.querySelectorAll('[data-i18n-html]').forEach(el => {
        el.innerHTML = this.t(el.getAttribute('data-i18n-html'));
      });
      ['placeholder', 'title', 'aria-label', 'alt'].forEach(attr => {
        scope.querySelectorAll('[data-i18n-' + attr + ']').forEach(el => {
          el.setAttribute(attr, this.t(el.getAttribute('data-i18n-' + attr)));
        });
      });

      document.documentElement.lang = this.lang;
      this.updateLanguageButtons();
    },

    // Resalta el botón del idioma activo en el menú de opciones
    updateLanguageButtons() {
      const ACTIVE = 'lang-btn flex flex-col items-center gap-1.5 px-1 py-2 rounded-xl border text-[11px] font-semibold transition-colors cursor-pointer bg-amber-500/15 border-amber-500/40 text-amber-200';
      const IDLE = 'lang-btn flex flex-col items-center gap-1.5 px-1 py-2 rounded-xl border text-[11px] font-semibold transition-colors cursor-pointer border-transparent text-slate-300 hover:bg-slate-800 hover:text-white';
      document.querySelectorAll('[data-lang]').forEach(btn => {
        const isActive = btn.getAttribute('data-lang') === this.lang;
        btn.className = isActive ? ACTIVE : IDLE;
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
    },

    setLang(lang) {
      if (!SUPPORTED.includes(lang) || lang === this.lang) return;
      this.lang = lang;
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch (e) { /* sin almacenamiento: el cambio dura solo esta sesión */ }
      this.apply();
      document.dispatchEvent(new CustomEvent('cinetrack:languagechange', { detail: { lang } }));
    }
  };

  window.I18N = I18N;
  window.t = (key, params) => I18N.t(key, params);
  window.tp = (key, count, params) => I18N.tp(key, count, params);

  // Traduce el HTML estático en cuanto el DOM está listo (antes que app.js)
  document.addEventListener('DOMContentLoaded', () => I18N.apply());
})();
