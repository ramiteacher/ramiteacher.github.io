const CACHE_NAME = 'qr-inventory-v1';
const ASSETS = [
  '/',
  '/qr.html',
  '/admin.html',
  '/style.css',
  '/qr.js',
  '/qr-fixed.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  'https://unpkg.com/html5-qrcode'
];

// 서비스 워커 설치 및 자산 캐싱
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('캐시 생성됨');
        return cache.addAll(ASSETS);
      })
  );
});

// 네트워크 요청 가로채기 및 캐시 전략 적용
self.addEventListener('fetch', event => {
  // Google API 요청은 캐싱하지 않음 (인증 관련)
  if (event.request.url.includes('accounts.google.com') || 
      event.request.url.includes('sheets.googleapis.com')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // 캐시에 있으면 캐시에서 반환
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // 캐시에 없으면 네트워크 요청
        return fetch(event.request)
          .then(response => {
            // 응답이 유효한지 확인
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 응답을 복제하여 캐시에 저장
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // 오프라인이고 HTML 요청인 경우 오프라인 페이지 제공
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('qr.html');
            }
          });
      })
  );
});

// 이전 버전 캐시 삭제
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          console.log('오래된 캐시 삭제:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
});
