const CACHE_NAME = "pokedex-v1";
const API_CACHE_NAME = "pokedex-api-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/src/main.tsx"
];

const API_HOSTS = ["pokeapi.co", "raw.githubusercontent.com"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME && key !== API_CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.hostname === "pokeapi.co") {
    event.respondWith(
      caches.open(API_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          return new Response(null, { status: 503 });
        }
      })
    );
    return;
  }

  if (url.hostname === "raw.githubusercontent.com" && url.pathname.includes("/sprites/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          return new Response(null, { status: 503 });
        }
      })
    );
    return;
  }

  if (event.request.method === "GET") {
    event.respondWith(
      caches.match(event.request).then((response) => response || fetch(event.request))
    );
  }
});