// Service Worker — 想法工作台
// 每次构建后请递增 VERSION，旧缓存会被自动清除
const VERSION = 2026111802
const CACHE_NAME = `idea-workbench-v${VERSION}`

// 强制激活新版本，不等待所有标签页关闭
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.webmanifest',
        '/favicon.svg',
      ])
    })
  )
  self.skipWaiting()
})

// 激活时清除所有旧版本缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => k.startsWith('idea-workbench-') && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch 策略：
// - HTML: network first（每次都取最新，离线才用缓存）
// - 静态资源 (js/css/png/svg): stale-while-revalidate
self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  const pathname = url.pathname

  // HTML: network first
  if (pathname === '/' || pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          return response
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // 静态资源: stale-while-revalidate
  if (/\.(js|css|png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf)$/.test(pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        }).catch(() => cached)
        return cached || fetchPromise
      })
    )
    return
  }

  // 其他请求: 直接透传
})
