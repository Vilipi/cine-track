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

## ✨ Qué hace

- **Buscador con datos reales**: series desde TVMaze y películas desde TMDB, en español, con carátulas, sinopsis, duración, director, géneros y valoración.
- **Seguimiento de series por episodios**: lista real de temporadas y capítulos, marcado individual, por temporada o serie completa, y barra de progreso.
- **Estados**: *Viendo*, *Por ver*, *Completadas*, *En pausa* y *Favoritas*.
- **Valoración personal** de 0 a 10, plataforma de streaming y notas.
- **Filtros** por tipo, estado, género y búsqueda de texto sobre tu propia lista.
- **Copias de seguridad**: exportar e importar toda la biblioteca en un archivo JSON.
- **Datos de ejemplo** al abrirla por primera vez (Breaking Bad, Stranger Things, Interstellar y Dune: Parte 2), que puedes recuperar desde ⚙️ → *Restablecer Ejemplos*.
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

---

## 🗂️ Estructura

| Archivo | Contenido |
|---|---|
| `index.html` | Estructura de la interfaz y modales |
| `styles.css` | Estilos propios, rejilla de pósters y ajustes de móvil |
| `api.js` | Integración con TMDB y TVMaze, y gestión de la clave |
| `storage.js` | Persistencia en `localStorage`, datos de ejemplo y copias de seguridad |
| `app.js` | Lógica de interfaz: renderizado, filtros, modales y eventos |

Los estilos base vienen de **Tailwind** y la tipografía **Outfit** de Google Fonts, ambos
cargados desde internet, así que la primera carga necesita conexión. Los datos de tu
biblioteca se guardan en `localStorage` y no se pierden al cerrar el navegador, pero son
propios de cada dispositivo y navegador: usa la exportación a JSON para pasarlos de uno a otro.
