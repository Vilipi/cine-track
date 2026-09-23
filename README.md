# CineTrack — Seguimiento de series y películas 🎬

Aplicación web para llevar el control de las series y películas que estás viendo, tienes pendientes o ya has terminado. Sin servidor, sin base de datos: todo se guarda en el navegador.

---

## 🔑 Antes de empezar: la clave de TMDB

Las búsquedas de **películas** usan [The Movie Database](https://www.themoviedb.org), que pide una clave gratuita. Las **series** funcionan sin clave, a través de TVMaze.

1. Crea una cuenta en [themoviedb.org/signup](https://www.themoviedb.org/signup).
2. Entra en [Ajustes → API](https://www.themoviedb.org/settings/api) y solicita una clave de tipo *Developer*. Se aprueba al instante.
3. Copia la **API Key (v3 auth)**: 32 caracteres hexadecimales. No confundir con el *Read Access Token*, que es mucho más largo y empieza por `eyJ`.
4. En CineTrack, abre el menú ⚙️ → **Clave de TMDB**, pégala y guarda.

La clave se almacena **solo en tu navegador** (`localStorage`). No está escrita en el código ni se envía a ningún servidor, así que el repositorio y la web publicada no contienen ningún secreto. Cada dispositivo que uses necesita introducirla una vez.

---

## ⭐ Opcional: notas de IMDb y Metacritic

Las puntuaciones de **IMDb** y el **Metascore** de **Metacritic** se piden a [OMDb](https://www.omdbapi.com), la única API pública que publica las dos. También pide una clave gratuita, pero es **opcional**: sin ella la app funciona igual, solo que sin esas notas.

1. Pide la clave en [omdbapi.com/apikey.aspx](https://www.omdbapi.com/apikey.aspx), opción **FREE** (1.000 consultas al día).
2. Te llega por correo: pulsa el enlace de activación, o la clave no funcionará.
3. En CineTrack, abre el menú ⚙️ → **Notas de IMDb y Metacritic**, pégala y guarda.

Se guarda igual que la de TMDB: solo en ese navegador. Las notas se muestran en los resultados de búsqueda, en la ficha de vista previa y en las tarjetas de tu biblioteca, y quedan guardadas junto al título. Para no gastar la cuota diaria, las respuestas se **cachean una semana** en el navegador, solo los 10 primeros resultados de cada búsqueda consultan OMDb, y los títulos que ya tenías guardados se van completando poco a poco según navegas.

---

## ✨ Qué hace

- **Buscador con datos reales**: series desde TVMaze y películas desde TMDB, en español, con carátulas, sinopsis, duración, director, géneros y valoración.
- **Notas de IMDb y Metacritic** (opcional, vía OMDb): se ven en el buscador, en la vista previa y en tu biblioteca, con el Metascore coloreado como en Metacritic.
- **Seguimiento de series por episodios**: lista real de temporadas y capítulos, marcado individual, por temporada o serie completa, y barra de progreso.
- **Estados**: *Viendo*, *Por ver*, *Completadas*, *En pausa* y *Favoritas*.
- **Valoración personal** de 0 a 10, plataforma de streaming y notas.
- **Filtros** por tipo, estado, género y búsqueda de texto sobre tu propia lista.
- **Copias de seguridad**: exportar e importar toda la biblioteca en un archivo JSON.
- **Empieza vacía**: la primera vez que la abres no hay ningún título de ejemplo, la lista es tuya desde el principio. Para vaciarla en cualquier momento, ⚙️ → *Restablecer* (antes conviene descargar una copia). Restablecer no toca el idioma ni las claves de TMDB y OMDb.
- **Tres idiomas**: español, inglés y polaco. Se elige desde ⚙️ → *Idioma* (con banderas) y se recuerda en cada dispositivo. También cambia el idioma en que TMDB devuelve títulos y sinopsis.
- **Diseño adaptado a móvil**, con modales a pantalla completa y áreas táctiles cómodas.

---

## 🚀 Cómo usarla

Abre `index.html` en el navegador. No hace falta instalar ni compilar nada.

Para usarla desde el móvil tienes dos opciones:

- **Publicarla** en GitHub Pages (o Netlify) y abrir la URL en el teléfono.
- **Copiar la carpeta** al teléfono y abrir `index.html` con el navegador.

En ambos casos tendrás que introducir tu clave de TMDB una vez en ese dispositivo.

### 📱 Instalarla en el móvil

Una vez publicada, abre la URL en el teléfono y:

- **Android (Chrome):** menú ⋮ → *Instalar aplicación* (o *Añadir a pantalla de inicio*).
- **iPhone (Safari):** botón compartir → *Añadir a pantalla de inicio*.

Queda un icono propio en el escritorio y la app arranca a pantalla completa, sin la barra
de direcciones del navegador. Necesita conexión para buscar en TMDB y TVMaze; si se cae,
avisa con un mensaje en lugar de quedarse colgada. Tu biblioteca ya guardada se ve igual.

### 🌍 Añadir o corregir traducciones

Todos los textos viven en [`i18n.js`](i18n.js), una línea por texto con sus tres idiomas:

```js
add('menu.export', 'Descargar Copia', 'Download backup', 'Pobierz kopię');
```

Los textos del HTML llevan `data-i18n="clave"`; los que genera `app.js` usan `t('clave')`, o `tp('clave', n)` cuando dependen de una cantidad (el polaco tiene tres formas plurales). Los **géneros estándar** (los de TMDB y TVMaze) se reconocen en cualquiera de los tres idiomas y se muestran en el idioma activo; además, "Ciencia Ficción", "Science Fiction" y "Science-Fiction" cuentan como un solo filtro. La tabla está en [`genres.js`](genres.js). Los **géneros personalizados** que escribas tú nunca se traducen. Tampoco se traducen tus títulos, notas ni las sinopsis ya descargadas: se muestran tal como los guardaste.

---

## 🗂️ Estructura

| Archivo | Contenido |
|---|---|
| `index.html` | Estructura de la interfaz y modales |
| `styles.css` | Estilos propios, rejilla de pósters y ajustes de móvil |
| `i18n.js` | Traducciones (es / en / pl), plurales y cambio de idioma |
| `genres.js` | Tabla de géneros conocidos y sus nombres en los tres idiomas |
| `api.js` | Integración con TMDB, TVMaze y OMDb, y gestión de las claves |
| `storage.js` | Persistencia en `localStorage` y copias de seguridad |
| `app.js` | Lógica de interfaz: renderizado, filtros, modales y eventos |

Los estilos base vienen de **Tailwind** y la tipografía **Outfit** de Google Fonts, ambos
cargados desde internet, así que la primera carga necesita conexión. Los datos de tu
biblioteca se guardan en `localStorage` y no se pierden al cerrar el navegador, pero son
propios de cada dispositivo y navegador: usa la exportación a JSON para pasarlos de uno a otro.
