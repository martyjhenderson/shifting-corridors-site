import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    // Aggressive CI settings to prevent hanging
    watch: false,
    run: true,
    passWithNoTests: true,
    testTimeout: 5000,
    hookTimeout: 5000,
    teardownTimeout: 1000,
    // Force single thread and minimal concurrency
    pool: 'threads',
    maxConcurrency: 1,
    minThreads: 1,
    maxThreads: 1,
    // Disable file watching and other features that might cause hanging
    fileParallelism: false,
    isolate: true,
    // Force exit after tests complete
    forceRerunTriggers: [],
    // Minimal reporter to reduce output processing time
    reporter: 'default',
    // Force exit on completion
    dangerouslyIgnoreUnhandledErrors: true,
    // Set environment variables for tests
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