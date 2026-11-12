import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Path relatif agar bisa dihosting di subfolder mana pun dan dibungkus Capacitor.
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png', 'icons/favicon-64.png'],
      manifest: {
        id: './',
        name: 'NoBaku — Belajar Bentuk Baku',
        short_name: 'NoBaku',
        description: 'Belajar bentuk baku (notasi ilmiah) langkah demi langkah untuk siswa SMP.',
        lang: 'id',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F3F2FD',
        theme_color: '#7B6CF0',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,webmanifest,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  // Pratinjau satu berkas: gambar logo ikut disematkan (data URI) agar tidak butuh berkas terpisah.
  build: process.env.VITE_PREVIEW_EMBED ? { assetsInlineLimit: 200_000 } : {},
  test: {
    environment: 'node',
  },
});
