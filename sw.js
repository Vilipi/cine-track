/**
 * CineTrack - Service Worker
 *
 * Su función principal aquí es permitir que Android ofrezca instalar la app
 * en la pantalla de inicio. Como el móvil tendrá conexión casi siempre, la
 * estrategia es "red primero": se sirve siempre la versión más reciente y la
 * caché solo actúa de red de seguridad si la conexión falla, para que no
 * aparezca la pantalla de error del navegador.
 *
 * Al cambiar los archivos de la app, sube el número de CACHE_VERSION para
 * que los dispositivos descarten la copia antigua.
 */

const CACHE_VERSION = 'cinetrack-v1';

// Archivos propios de la app (no se cachean Tailwind, tipografías ni las APIs)
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './api.js',
  './storage.js',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      // Si algún archivo falla no se aborta la instalación entera
      .then(cache => Promise.allSettled(APP_SHELL.map(url => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.filter(name => name !== CACHE_VERSION).map(name => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  // Solo se gestionan las peticiones propias: TMDB, TVMaze, Tailwind y las
  // tipografías van directas a la red sin pasar por aquí.
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        // Copia de seguridad de lo último que funcionó
        const copy = response.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put(request, copy)).catch(() => {});
        return response;
      })
      .catch(() =>
        caches.match(request).then(cached => cached || caches.match('./index.html'))
      )
  );
});
