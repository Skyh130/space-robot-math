/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  // 정적 호스팅에서 하위 경로로 배포해도 열리게 상대 경로로 뽑는다
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: '우주 로봇 수학 모험',
        short_name: '수학 모험',
        description: '우주를 여행하며 로봇 부품을 모으는 초등 수학 게임',
        lang: 'ko',
        start_url: './',
        scope: './',
        display: 'standalone',
        // 세로 모드 고정. 홈 화면에 추가해 열면 이 값이 방향을 잠근다.
        orientation: 'portrait',
        background_color: '#1B2A6B',
        theme_color: '#1B2A6B',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // 폰트까지 전부 미리 받아 둬야 비행기 모드에서 글자가 깨지지 않는다
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,txt}'],
        // Pretendard 한 벌이 790KB 다. 기본 상한(2MB)보다 넉넉히 잡는다.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        // 개발 서버에서는 서비스 워커를 켜지 않는다. 화면 검사에 캐시가 끼면 헷갈린다.
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
