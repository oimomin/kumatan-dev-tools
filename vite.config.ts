import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/kumatan-32.png', 'icons/kumatan-180.png', 'icons/kumatan-source.png'],
      manifest: {
        name: 'Kumatan Dev Tools',
        short_name: 'Kuma Dev',
        description: '開発中によく使う変換と整形をまとめたPWAアプリ。',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f7fcff',
        theme_color: '#8ee8ee',
        icons: [
          {
            src: '/icons/kumatan-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/kumatan-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/kumatan-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
      },
    }),
  ],
})
