import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Reenvía las llamadas de la API a Django para que front y backend compartan dominio.
// Así basta un solo túnel HTTPS (cloudflared) para probar en el celular, sin CORS.
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000'
const apiProxy = {
  '^/(accounts|farms|labor|payroll|finance|production|analytics|assistant|sync)/': {
    target: BACKEND_URL,
    changeOrigin: true,
  },
}

// https://vite.dev/config/
export default defineConfig({
  server: { proxy: apiProxy, allowedHosts: ['.trycloudflare.com'] },
  preview: { proxy: apiProxy, allowedHosts: ['.trycloudflare.com'] },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.png', 'pwa-192.png', 'pwa-512.png'],
      manifest: {
        short_name: 'CafeSmart',
        name: 'CafeSmart - Gestión Cafetera',
        description:
          'Sistema de gestión cafetera offline para pequeños y medianos productores.',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ecf0ea',
        theme_color: '#1f4a35',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precachea todo el build: la app abre aunque no haya internet.
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff,woff2}'],
        navigateFallback: '/index.html',
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        // Las peticiones a la API no se cachean aquí: los datos viven en IndexedDB.
      },
      devOptions: { enabled: false },
    }),
  ],
})
