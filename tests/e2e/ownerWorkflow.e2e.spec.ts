import { test, expect } from '@playwright/test'

test.describe('Clinic Owner Administration Workflow (Workflows 33-38)', () => {
  test('33-38. Dashboard, Revenue, Staff, Settings, Plans & Audit Trail', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'owner1@test.com')
    await page.fill('input[name="password"]', 'Test@123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard**', { timeout: 15_000 })

    // Revenue / Reports
    await page.goto('/dashboard/reports')
    await expect(page.locator('h1')).toBeVisible()

    // Staff Management
    await page.goto('/dashboard/staff')
    await expect(page.locator('h1')).toContainText('Staff')

    // Clinic Settings
    await page.goto('/dashboard/settings')
    await expect(page.locator('h1')).toContainText('Settings')

    // Subscription Plan
    await page.goto('/dashboard/plan')
    await expect(page.locator('h1')).toBeVisible()

    // Activity Audit Log
    await page.goto('/dashboard/activity')
    await expect(page.locator('h1')).toBeVisible()
  })
})
