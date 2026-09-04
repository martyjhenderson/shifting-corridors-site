import { defineConfig, devices } from '@playwright/test';

// Mobile-usability-focused end-to-end config. Uses the system-installed
// Chrome (channel: 'chrome') rather than a downloaded Chromium build, since
// `playwright install` requires apt/sudo access this environment doesn't
// have. If a teammate's machine has `playwright install chromium` browsers
// available instead, swap `channel: 'chrome'` for the default Chromium.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    channel: 'chrome',
    launchOptions: {
      args: ['--no-sandbox'],
    },
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    {
      // iPhone SE's device preset defaults to WebKit; force Chromium since
      // that's the only engine channel: 'chrome' can launch here.
      name: 'mobile-iphone-se',
      use: { ...devices['iPhone SE'], browserName: 'chromium' },
    },
    {
      name: 'mobile-pixel-5',
      use: { ...devices['Pixel 5'], browserName: 'chromium' },
    },
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'], browserName: 'chromium' },
    },
  ],
});
