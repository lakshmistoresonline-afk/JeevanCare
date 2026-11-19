import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'
import { validateE2EDatabaseUrl } from './src/lib/databaseSafety'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

// Fail-closed database isolation check for Playwright webServer
const validatedE2EDbUrl = validateE2EDatabaseUrl(process.env.DATABASE_URL)

// Set test environment defaults if not provided in environment
process.env.JEEVANCARE_E2E_OWNER_EMAIL = process.env.JEEVANCARE_E2E_OWNER_EMAIL || 'owner1@test.com'
process.env.JEEVANCARE_E2E_OWNER_PASSWORD = process.env.JEEVANCARE_E2E_OWNER_PASSWORD || 'Test@123'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'line',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  ...(process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1'
    ? {}
    : {
        webServer: {
          command: 'npm start',
          url: BASE_URL,
          timeout: 120_000,
          reuseExistingServer: false,
          env: {
            NODE_ENV: 'production',
            DATABASE_URL: validatedE2EDbUrl,
            PAYLOAD_SECRET: process.env.PAYLOAD_SECRET || 'a3f89e2b4c7d6e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f',
          },
        },
      }),
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
  ],
})
