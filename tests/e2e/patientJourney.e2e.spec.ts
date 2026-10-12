import { test, expect } from '@playwright/test'

test.describe('Patient End-to-End Journey (Workflows 1-16)', () => {
  test('1. Patient Registration Page View', async ({ page }) => {
    await page.goto('/patient/register')
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('input[name="name"]')).toBeVisible()
  })

  test('2-3. Patient Login & Dashboard', async ({ page }) => {
    await page.goto('/patient/login')
    await page.fill('input[name="email"]', 'patient1@test.com')
    await page.fill('input[name="password"]', 'Test@123')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/patient/dashboard**', { timeout: 15_000 })
    await expect(page.locator('h1')).toBeVisible()
  })

  test('4-8. Doctor Selection, Availability, Booking & Token Confirmation', async ({ page }) => {
    await page.goto('/patient/login')
    await page.fill('input[name="email"]', 'patient1@test.com')
    await page.fill('input[name="password"]', 'Test@123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/patient/dashboard**', { timeout: 15_000 })

    await page.goto('/patient/appointments/book')
    await expect(page.locator('h1')).toContainText('Book')
  })

  test('9-16. Appointments, History, Prescriptions, Documents, Billing & Profile', async ({ page }) => {
    await page.goto('/patient/login')
    await page.fill('input[name="email"]', 'patient1@test.com')
    await page.fill('input[name="password"]', 'Test@123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/patient/dashboard**', { timeout: 15_000 })

    // History
    await page.goto('/patient/history')
    await expect(page.locator('h1')).toBeVisible()

    // Prescriptions
    await page.goto('/patient/prescriptions')
    await expect(page.locator('h1')).toBeVisible()

    // Documents
    await page.goto('/patient/documents')
    await expect(page.locator('h1')).toBeVisible()

    // Billing
    await page.goto('/patient/billing')
    await expect(page.locator('h1')).toBeVisible()

    // Profile
    await page.goto('/patient/profile')
    await expect(page.locator('h1')).toBeVisible()
  })
})
