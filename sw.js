const CACHE_NAME = 'la-rp-v3-cache-v22';
const urlsToCache = [
    '/',
    '/index.html',
    '/scripts.html',
    '/style.css?v=22',
    '/app.js?v=22',
    '/assets/logo.jpg?v=2'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => response || fetch(event.request))
    );
});
