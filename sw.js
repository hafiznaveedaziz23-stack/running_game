const CACHE='running-rush-3d-v2';
const FILES=['index.html','manifest.json','icon.png','game.js','shop.js','multiplayer.js','style.css'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('fetch',e=>{
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
