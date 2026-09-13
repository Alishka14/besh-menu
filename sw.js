const CACHE='besh-menu-v1';
const ASSETS=['./','./index.html','./styles.css','./data.js','./app.js','./icon.svg','./manifest.webmanifest',
'./assets/beshimg-000.jpg','./assets/beshimg-001.jpg','./assets/beshimg-002.jpg','./assets/beshimg-003.jpg','./assets/beshimg-004.jpg','./assets/beshimg-005.jpg','./assets/beshimg-006.jpg','./assets/beshimg-007.jpg','./assets/beshimg-008.jpg','./assets/beshimg-009.jpg','./assets/beshimg-010.jpg','./assets/beshimg-011.jpg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return res;}).catch(()=>caches.match('./index.html'))));});
