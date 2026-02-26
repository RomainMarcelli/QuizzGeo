const CACHE_NAME = "quiz-drapeau-v20";
const APP_ASSETS = [
  "./",
  "./quizz.html",
  "./styles.css",
  "./src/styles/tokens.css",
  "./src/styles/layout.css",
  "./src/styles/components.css",
  "./src/styles/responsive.css",
  "./quiz-logic.js",
  "./data.js",
  "./src/js/modules/constants.js",
  "./src/js/modules/state.js",
  "./src/js/modules/dom.js",
  "./src/js/modules/icons.js",
  "./src/js/modules/renderers.js",
  "./src/js/modules/storage.js",
  "./src/js/modules/quiz-app.js",
  "./app.js",
  "./pwa.js",
  "./manifest.webmanifest",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg",
];

const APP_SHELL_FILES = new Set([
  "quizz.html",
  "styles.css",
  "tokens.css",
  "layout.css",
  "components.css",
  "responsive.css",
  "quiz-logic.js",
  "data.js",
  "constants.js",
  "state.js",
  "dom.js",
  "icons.js",
  "renderers.js",
  "storage.js",
  "quiz-app.js",
  "app.js",
  "pwa.js",
  "manifest.webmanifest",
]);

function isAppShellRequest(pathname) {
  if (pathname === "/" || pathname.endsWith("/")) {
    return true;
  }

  const fileName = pathname.split("/").pop() || "";
  return APP_SHELL_FILES.has(fileName);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((oldKey) => caches.delete(oldKey))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  const shouldUseNetworkFirst = isAppShellRequest(requestUrl.pathname);

  if (shouldUseNetworkFirst) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => {
            if (cached) {
              return cached;
            }
            return caches.match("./quizz.html");
          })
        )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
