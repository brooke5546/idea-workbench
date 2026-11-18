import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { router } from './router'
import App from './App.vue'
import './style.css'
import { verifyDatabase } from './storage/dexie-schema'

async function bootstrap() {
  // iOS Safari: IndexedDB 可能需要在页面完全加载后才能可靠访问
  if (document.readyState !== 'complete') {
    await new Promise<void>(resolve => {
      window.addEventListener('load', () => resolve(), { once: true })
    })
  }

  // 验证 IndexedDB 可用
  const dbOk = await verifyDatabase()
  if (!dbOk) {
    console.warn('[Bootstrap] IndexedDB unavailable, app may not work correctly')
  }

  const app = createApp(App)
  app.use(createPinia())
  app.use(router)
  app.mount('#app')

  // ===== Register Service Worker (PWA) =====
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(
        (reg) => console.log('[SW] Registered:', reg.scope),
        (err) => console.warn('[SW] Registration failed:', err)
      )
    })
  }
}

bootstrap()
