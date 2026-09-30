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
    // emdash/ is the Astro + EmDash rewrite, a separate project with its own
    // dependencies; its node_modules would otherwise be scanned for tests.
    exclude: ['e2e/**', 'node_modules/**', 'emdash/**'],
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