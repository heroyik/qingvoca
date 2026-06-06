const CACHE_VERSION = "qingvoca-v1-1-2-offline-6";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const BASE_PATH = "/qingvoca";
const OFFLINE_MANIFEST = `${BASE_PATH}/offline-manifest.json`;

const PRECACHE_ROUTES = [
  `${BASE_PATH}`,
  `${BASE_PATH}/`,
  `${BASE_PATH}/quiz/review`,
  `${BASE_PATH}/quiz/review/`,
  ...Array.from({ length: 20 }, (_, index) => `${BASE_PATH}/quiz/unit-${index + 1}`),
  ...Array.from({ length: 20 }, (_, index) => `${BASE_PATH}/quiz/unit-${index + 1}/`),
];

async function getOfflineUrls() {
  try {
    const response = await fetch(OFFLINE_MANIFEST, { cache: "no-store" });
    if (!response.ok) return [];
    const manifest = await response.json();
    const urls = Array.isArray(manifest.urls) ? manifest.urls : [];
    return urls.filter((url) => typeof url === "string" && url.startsWith(`${BASE_PATH}/`));
  } catch {
    return [];
  }
}

async function warmShellCache() {
  const cache = await caches.open(SHELL_CACHE);
  const urls = Array.from(new Set([...PRECACHE_ROUTES, OFFLINE_MANIFEST, ...(await getOfflineUrls())]));
  await cache.addAll(urls);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      await warmShellCache();
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((cacheName) => !cacheName.startsWith(CACHE_VERSION))
          .map((cacheName) => caches.delete(cacheName)),
      );
      await self.clients.claim();
    })(),
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response?.ok) {
    const cache = await caches.open(RUNTIME_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

async function matchShellRoute(pathname) {
  const shellCache = await caches.open(SHELL_CACHE);
  const normalized = pathname.replace(/\/+$/, "") || BASE_PATH;
  const candidates = [normalized, `${normalized}.html`, pathname, `${normalized}/`, `${normalized}/index.html`];

  for (const candidate of candidates) {
    const cached = await shellCache.match(candidate);
    if (cached) return cached;
  }

  return shellCache.match(`${BASE_PATH}/`);
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response?.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(request)) || caches.match(`${BASE_PATH}/`);
  }
}

async function navigateResponse(request) {
  try {
    const response = await fetch(request);
    if (response?.ok) {
      const shellCache = await caches.open(SHELL_CACHE);
      await shellCache.put(request.url, response.clone());
    }
    return response;
  } catch {
    return matchShellRoute(new URL(request.url).pathname);
  }
}

async function isOfflineReady() {
  const manifestResponse = await caches.match(OFFLINE_MANIFEST);
  if (!manifestResponse) return false;

  try {
    const manifest = await manifestResponse.json();
    const urls = Array.isArray(manifest.urls) ? manifest.urls : [];
    const checks = [BASE_PATH, `${BASE_PATH}/`, OFFLINE_MANIFEST, ...urls];
    const matches = await Promise.all(checks.map((url) => caches.match(url)));
    return matches.every(Boolean);
  } catch {
    return false;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(BASE_PATH)) return;

  if (request.mode === "navigate") {
    event.respondWith(navigateResponse(request));
    return;
  }

  const isStaticAsset =
    url.pathname.includes("/_next/static/") ||
    /\.(css|js|json|png|jpg|jpeg|svg|ico|webp|woff2?)$/i.test(url.pathname);

  event.respondWith(isStaticAsset ? cacheFirst(request) : networkFirst(request));
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "OFFLINE_STATUS") return;
  event.waitUntil(
    (async () => {
      const ready = await isOfflineReady();
      event.ports[0]?.postMessage({ ready });
    })(),
  );
});
