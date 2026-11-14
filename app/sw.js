/* 설치형 앱용 최소 서비스 워커: 캐시 없이 항상 사이트에서 바로 받아서, 사이트가 업데이트되면 앱도 그대로 따라와요.
   다른 주소(frenchfries777.com의 아이콘·사진 등)는 건드리지 않고 브라우저가 직접 받게 둬요. 서비스 워커가 대신 받으면
   이 사이트의 CSP(connect-src 'self')에 막혀서 사진이 안 떠요. */
self.addEventListener('install',function(){ self.skipWaiting(); });
self.addEventListener('activate',function(e){ e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch',function(e){
  if(new URL(e.request.url).origin!==self.location.origin) return;
  e.respondWith(fetch(e.request));
});
