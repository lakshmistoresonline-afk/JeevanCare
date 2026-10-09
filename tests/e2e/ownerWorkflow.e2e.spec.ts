import { test, expect } from '@playwright/test'

test.describe('Clinic Owner Administration Workflow (Workflows 33-38)', () => {
  test('33-38. Dashboard, Revenue, Staff, Settings, Plans & Audit Trail', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', 'owner1@test.com')
    await page.fill('#password', 'Test@123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // Revenue / Invoices
    await page.goto('/dashboard/invoices')
    await expect(page.locator('h1')).toContainText('Invoices')

    // Staff Management
    await page.goto('/dashboard/staff')
    await expect(page.locator('h1')).toContainText('Staff')

    // Clinic Settings
    await page.goto('/dashboard/settings')
    await expect(page.locator('h1')).toContainText('Clinic Settings')

    // Subscription Plans
    await page.goto('/dashboard/plans')
    await expect(page.locator('h1')).toContainText('Subscription Plan')

    // Activity Audit Log
    await page.goto('/dashboard/activity')
    await expect(page.locator('h1')).toContainText('Activity Audit Log')
  })
})
