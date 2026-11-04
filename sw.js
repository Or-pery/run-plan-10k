const C="run-v1",A=["./","index.html","manifest.webmanifest"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)));self.skipWaiting()});
self.addEventListener("activate",e=>e.waitUntil(clients.claim()));
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);if(u.origin!==location.origin)return;
  const net=/(plan\.json|firebase-config\.js|onboarding\.js|workout-tools\.js|index\.html|\/)$/.test(u.pathname);
  e.respondWith(net?fetch(e.request).then(r=>{const k=r.clone();caches.open(C).then(c=>c.put(e.request,k));return r}).catch(()=>caches.match(e.request)):caches.match(e.request).then(r=>r||fetch(e.request)));
});
