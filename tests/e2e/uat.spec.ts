import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

test.use({ viewport: { width: 1440, height: 900 } })

test.describe('Matab Clinic Management Complete Browser UAT', () => {
  const screenshotsDir = path.join(process.cwd(), 'tests', 'e2e', 'screenshots')

  test.beforeAll(async () => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true })
    }
  })

  test('1. Owner Login Workflow & Dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await page.fill('input[name="email"]', 'owner@city.app')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard**', { timeout: 15_000 })
    await page.screenshot({ path: path.join(screenshotsDir, '01-login.png') })
  })

  test('2. Unauthenticated Access Guard', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/patients')
    await page.waitForURL(/.*login/, { timeout: 15_000 })
    await expect(page).toHaveURL(/.*login/)
    await page.screenshot({ path: path.join(screenshotsDir, '02-unauth.png') })
  })

  test('3. Responsive Viewport Tests', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('http://localhost:3000/login')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await page.screenshot({ path: path.join(screenshotsDir, '10-mobile.png') })
  })
})
