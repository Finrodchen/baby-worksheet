// 緩存名稱，更新版本時需要更改
const CACHE_NAME = 'daily-worksheet-v1';

// 需要緩存的資源列表
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './db.js',
  './manifest.json',
  './icons/favicon.ico',
  './icons/favicon-196.png',
  './icons/apple-icon-180.png',
  './icons/manifest-icon-192.maskable.png',
  './icons/manifest-icon-512.maskable.png'
];

// 安裝 Service Worker 並緩存資源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('緩存已開啟');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// 清理舊版本緩存
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 攔截網絡請求，優先使用緩存
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果在緩存中找到匹配的資源，則返回緩存的資源
        if (response) {
          return response;
        }
        
        // 否則發送網絡請求
        return fetch(event.request).then(
          response => {
            // 檢查是否收到有效的響應
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 克隆響應，因為響應是流，只能使用一次
            const responseToCache = response.clone();

            // 將新資源添加到緩存
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});