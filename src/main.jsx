import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { registerSW } from 'virtual:pwa-register'
import { startAutoSync } from './services/syncService.js'

// Service worker (generado por vite-plugin-pwa): permite instalar la app y abrirla sin conexión.
// En desarrollo NO se usa: un SW cacheando los módulos de Vite sirve versiones viejas de React
// y rompe la app ("Invalid hook call"). Por eso en dev se eliminan los SW y cachés existentes.
if (import.meta.env.DEV) {
  navigator.serviceWorker?.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()))
  window.caches?.keys().then((keys) => keys.forEach((k) => caches.delete(k)))
} else {
  // Limpia la caché del SW manual anterior (cafesmart-v1..v3); Workbox usa sus propias cachés.
  window.caches?.keys().then((keys) =>
    keys.filter((k) => k.startsWith('cafesmart-')).forEach((k) => caches.delete(k)),
  )
  const updateSW = registerSW({
    onNeedRefresh() {
      if (window.confirm('Hay una nueva versión de CafeSmart. ¿Actualizar ahora?')) {
        void updateSW(true)
      }
    },
  })
}

// Sincroniza la cola offline al abrir, al reconectar y periódicamente.
startAutoSync()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
