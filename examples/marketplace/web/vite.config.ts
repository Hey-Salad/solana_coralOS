/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: process.env.VITE_HOST ?? '127.0.0.1',
    allowedHosts: ['coral.heysalad.app'],
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_FEED_PROXY ?? 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: process.env.VITE_HOST ?? '127.0.0.1',
    allowedHosts: ['coral.heysalad.app'],
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_FEED_PROXY ?? 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'], // tests/ holds Playwright e2e, run separately
  },
})
