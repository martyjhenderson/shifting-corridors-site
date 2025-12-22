import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    // Extremely aggressive CI settings
    watch: false,
    run: true,
    passWithNoTests: true,
    testTimeout: 2000,
    hookTimeout: 2000,
    teardownTimeout: 500,
    // Single thread execution for Vitest 4+
    pool: 'forks',
    singleFork: true,
    isolate: false,
    // Disable everything that might cause hanging
    fileParallelism: false,
    reporter: 'default',
    dangerouslyIgnoreUnhandledErrors: true,
    coverage: {
      enabled: false
    },
    env: {
      CI: 'true',
      NODE_ENV: 'test',
      REACT_APP_USE_FALLBACK: 'true'
    }
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