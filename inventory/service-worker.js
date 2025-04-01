const CACHE_NAME = 'inventory-manager-cache-v2'; // 캐시 버전 업데이트
const urlsToCache = [
  '/',
  '/index.html',
  '/qr.html',
  '/qr-fixed.js',
  '/qr.js',
  '/styles.css',
  '/style.css',
  '/admin.html',
  '/admin.js',
  '/sounds/beep.mp3',
  '/sounds/in.mp3',
  '/sounds/out.mp3',
  '/sounds/defect.mp3',
  '/sounds/return.mp3',
  '/sounds/new.mp3',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
  'https://unpkg.com/html5-qrcode',
  'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js'
];

// 앱 설치 시 리소스 캐싱
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('캐시 생성됨');
        return cache.addAll(urlsToCache);
      })
  );
});

// 캐시된 리소스 사용 및 네트워크 요청 처리
self.addEventListener('fetch', event => {
  // Google Sheets API 호출은 네트워크로 직접 전달
  if (event.request.url.includes('sheets.googleapis.com') || 
      event.request.url.includes('accounts.google.com')) {
    // API 요청은 네트워크로 직접 처리하고 토큰 유지를 위해 특별한 처리는 하지 않음
    return;
  }
  
  // 일반 리소스 요청은 캐시 우선 전략 사용
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 캐시에서 응답을 찾았으면 반환
        if (response) {
          return response;
        }
        
        // 캐시에 없으면 네트워크에서 가져옴
        return fetch(event.request)
          .then(response => {
            // 유효한 응답이 아니면 그대로 반환
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 네트워크 응답을 복제해서 캐시에 저장
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          })
          .catch(error => {
            // 오프라인 시 폴백
            console.log('네트워크 요청 실패, 오프라인 폴백:', error);
            
            // html 요청인 경우 qr.html로 폴백
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('qr.html');
            }
            
            // 그 외 리소스는 적절한 오프라인 폴백 반환
            return new Response('오프라인 상태입니다', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// 오래된 캐시 정리
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // 화이트리스트에 없는 캐시 삭제
            console.log('오래된 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 새 서비스 워커가 페이지 제어권을 즉시 가져옴
      return self.clients.claim();
    })
  );
});

// 온라인 상태 변경 시 알림 전송
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'ONLINE_STATUS_CHANGE') {
    const isOnline = event.data.isOnline;
    
    // 모든 클라이언트에게 온라인 상태 변경 알림
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'ONLINE_STATUS_UPDATE',
          isOnline: isOnline
        });
      });
    });
  }
});
