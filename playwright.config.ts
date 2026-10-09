import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  // Run the dev server automatically during local E2E runs.
  // In CI, set PLAYWRIGHT_BASE_URL to the already-running server URL and
  // set PLAYWRIGHT_SKIP_WEBSERVER=1 to skip auto-launching.
  ...(process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1'
    ? {}
    : {
        webServer: {
          command: 'npm run dev',
          url: BASE_URL,
          timeout: 120_000,
          reuseExistingServer: !process.env.CI,
        },
      }),
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
  ],
})
