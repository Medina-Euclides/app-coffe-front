const CACHE_NAME = 'cafesmart-v3';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png',
  '/icons.svg'
];

// Instalar el Service Worker y guardar los recursos esenciales.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(
        ASSETS_TO_CACHE.map(async (url) => {
          try {
            await cache.add(url);
          } catch (error) {
            console.warn(`No se pudo almacenar ${url}:`, error);
          }
        })
      );
    })
  );

  self.skipWaiting();
});

// Activar la nueva versión y limpiar las cachés anteriores de CafeSmart.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith('cafesmart-') && key !== CACHE_NAME
          )
          .map((key) => caches.delete(key))
      );

      await self.clients.claim();
    })
  );
});

// Manejar solicitudes para permitir el uso de recursos guardados.
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Solo manejar peticiones GET del mismo sitio.
  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  // No guardar ni interceptar peticiones de la API.
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Para las páginas, intentar primero conectarse a internet.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copia = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put('/index.html', copia);
            });
          }

          return response;
        })
        .catch(async () => {
          const paginaGuardada = await caches.match('/index.html');
          return (
            paginaGuardada ||
            new Response('CafeSmart no está disponible sin conexión.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            })
          );
        })
    );

    return;
  }

  // Para recursos estáticos, utilizar caché y luego la red.
  event.respondWith(
    caches.match(request).then(async (respuestaGuardada) => {
      if (respuestaGuardada) {
        return respuestaGuardada;
      }

      try {
        const respuesta = await fetch(request);

        if (respuesta.ok) {
          const copia = respuesta.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, copia);
          });
        }

        return respuesta;
      } catch {
        return new Response('Recurso no disponible sin conexión.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    })
  );
});