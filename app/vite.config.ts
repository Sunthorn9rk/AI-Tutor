import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      workbox: {
        // ไฟล์ใหญ่ (wasm 21MB, ตัวละคร vrm 10MB) — ไม่ precache แต่ cache ตอนถูกใช้ครั้งแรกแทน
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        globIgnores: ['**/*.wasm', '**/*.vrm'],
        runtimeCaching: [
          {
            urlPattern: /\.wasm$/,
            handler: 'CacheFirst',
            options: { cacheName: 'wasm-cache', expiration: { maxEntries: 4 } },
          },
          {
            urlPattern: /\.vrm$/,
            handler: 'CacheFirst',
            options: { cacheName: 'avatar-cache', expiration: { maxEntries: 2 } },
          },
        ],
      },
      manifest: {
        name: 'AI Tutor — ฝึกพูดภาษาอังกฤษ',
        short_name: 'AI Tutor',
        description: 'ฝึกพูดภาษาอังกฤษกับ AI tutor',
        theme_color: '#FFC53D',
        background_color: '#FFFBF2',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
