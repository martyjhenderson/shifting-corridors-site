import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    // e2e/ holds Playwright specs (real-browser mobile layout checks, run
    // via `npm run test:e2e`), not Vitest tests — exclude them from the
    // default jsdom run.
    exclude: ['e2e/**', 'node_modules/**'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'buffer': 'buffer',
      'process': 'process/browser',
      'stream': 'stream-browserify',
      'util': 'util'
    }
  },
  define: {
    global: 'globalThis',
  }
})