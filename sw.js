const CACHE_NAME = "kohinoor-app-shell-v2";
const APP_SHELL = ["./", "./index.html", "./manifest.json"];
const SUPABASE_SDK = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL).catch(() => {});
    try {
      const response = await fetch(SUPABASE_SDK, {mode:"cors"});
      if (response.ok) await cache.put(SUPABASE_SDK, response);
    } catch(e) {}
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isSdk = url.href.startsWith(SUPABASE_SDK);
  if (url.origin !== self.location.origin && !isSdk) return;

  if (req.mode === "navigate") {
    event.respondWith(fetch(req).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put("./index.html", response.clone()));
      return response;
    }).catch(() => caches.match("./index.html").then(hit => hit || caches.match("./"))));
    return;
  }
  event.respondWith(caches.match(req).then(hit => hit || fetch(req).then(response => {
    if (response && response.ok) caches.open(CACHE_NAME).then(cache => cache.put(req, response.clone()));
    return response;
  })));
});
