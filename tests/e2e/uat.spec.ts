import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

test.use({ viewport: { width: 1440, height: 900 } })

const OWNER_EMAIL = process.env.JEEVANCARE_E2E_OWNER_EMAIL || 'owner1@test.com'
const OWNER_PASSWORD = process.env.JEEVANCARE_E2E_OWNER_PASSWORD || 'Test@123'

test.describe('JeevanCare Complete Browser UAT', () => {
  const screenshotsDir = path.join(process.cwd(), 'tests', 'e2e', 'screenshots')

  test.beforeAll(async () => {
    if (!OWNER_EMAIL || !OWNER_PASSWORD) {
      throw new Error('E2E Setup Error: JEEVANCARE_E2E_OWNER_EMAIL and JEEVANCARE_E2E_OWNER_PASSWORD must be configured for E2E testing.')
    }
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true })
    }
  })

  test('1. Owner Login Workflow & Dashboard', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await page.fill('input[name="email"]', OWNER_EMAIL)
    await page.fill('input[name="password"]', OWNER_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard**', { timeout: 15_000 })
    await expect(page.locator('h1')).toContainText('Owner')
    await page.screenshot({ path: path.join(screenshotsDir, '01-login.png') })
  })

  test('2. Unauthenticated Access Guard', async ({ browser }) => {
    // Isolated fresh unauthenticated browser context
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto('/dashboard/patients')
    await page.waitForURL(/.*login/, { timeout: 15_000 })
    await expect(page).toHaveURL(/.*login/)
    await page.screenshot({ path: path.join(screenshotsDir, '02-unauth.png') })
    await context.close()
  })

  test('3. Responsive Viewport Tests', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/login')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await page.screenshot({ path: path.join(screenshotsDir, '10-mobile.png') })
  })
})
