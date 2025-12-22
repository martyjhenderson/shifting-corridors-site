import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    // CI-specific settings
    watch: !isCI,
    run: isCI,
    passWithNoTests: true,
    testTimeout: isCI ? 10000 : 5000,
    hookTimeout: isCI ? 10000 : 5000,
    // Ensure tests exit in CI
    ...(isCI && {
      pool: 'threads',
      poolOptions: {
        threads: {
          singleThread: true,
        },
      },
    }),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
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