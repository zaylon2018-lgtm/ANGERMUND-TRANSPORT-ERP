
const CACHE = 'angermund-erp-v12';
const CORE = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/truck-bg.jpg',
  '/icon-192.png',
  '/icon-512.png',
  '/maskable-icon-512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE.filter(Boolean))).catch(()=>null));
});

self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET') return;

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(req).catch(() => new Response(JSON.stringify({offline:true,error:'Offline. Try again when connected.'}), {headers:{'Content-Type':'application/json'}})));
    return;
  }

  event.respondWith(
    fetch(req).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(cache => cache.put(req, copy)).catch(()=>null);
      return resp;
    }).catch(async () => {
      const cached = await caches.match(req);
      return cached || caches.match('/') || new Response('Offline', {status: 503});
    })
  );
});

self.addEventListener('sync', event => {
  if (event.tag === 'angermund-sync') {
    event.waitUntil(self.clients.matchAll().then(clients => {
      clients.forEach(client => client.postMessage({type:'BACKGROUND_SYNC'}));
    }));
  }
});

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'Angermund ERP', {
      body: data.body || 'New ERP notification',
      icon: '/icon-192.png',
      badge: '/icon-72.png',
      data: data.url || '/'
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data || '/'));
});
