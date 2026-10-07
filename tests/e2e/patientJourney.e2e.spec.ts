import { test, expect } from '@playwright/test'

test.describe('Patient End-to-End Journey (Workflows 1-16)', () => {
  test('1. Patient Registration', async ({ page }) => {
    await page.goto('/patient/register')
    await expect(page.locator('h1')).toContainText('Create your Patient Account')

    await page.selectOption('#tenant', { index: 1 })
    await page.fill('#name', 'Playwright Test Patient')
    await page.fill('#phone', '+91 98470 99887')
    await page.fill('#email', `pwpatient_${Date.now()}@test.com`)
    await page.fill('#password', 'Test@123')
    await page.click('button[type="submit"]')

    await page.waitForURL('/patient/dashboard')
    await expect(page.locator('h1')).toContainText('Welcome back')
  })

  test('2-3. Patient Login & Dashboard', async ({ page }) => {
    await page.goto('/patient/login')
    await page.fill('#email', 'patient1@test.com')
    await page.fill('#password', 'Test@123')
    await page.click('button[type="submit"]')

    await page.waitForURL('/patient/dashboard')
    await expect(page.locator('h1')).toContainText('Welcome back')
  })

  test('4-8. Doctor Selection, Availability, Booking & Token Confirmation', async ({ page }) => {
    await page.goto('/patient/login')
    await page.fill('#email', 'patient1@test.com')
    await page.fill('#password', 'Test@123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/patient/dashboard')

    await page.goto('/patient/appointments/book')
    await expect(page.locator('h1')).toContainText('Book an Appointment')

    await page.selectOption('select', { index: 1 })
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 2)
    await page.fill('input[type="date"]', tomorrow.toISOString().slice(0, 10))

    const slotBtn = page.locator('button:has-text("am"), button:has-text("pm")').first()
    await expect(slotBtn).toBeVisible({ timeout: 10000 })
    await slotBtn.click()

    await page.click('button:has-text("Confirm Appointment")')
    await page.waitForURL('/patient/appointments')
    await expect(page.locator('h1')).toContainText('My Appointments')
  })

  test('9-16. Appointments, History, Prescriptions, Documents, Billing & Profile', async ({ page }) => {
    await page.goto('/patient/login')
    await page.fill('#email', 'patient1@test.com')
    await page.fill('#password', 'Test@123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/patient/dashboard')

    // History
    await page.goto('/patient/history')
    await expect(page.locator('h1')).toContainText('Medical History')

    // Prescriptions
    await page.goto('/patient/prescriptions')
    await expect(page.locator('h1')).toContainText('My Prescriptions')

    // Documents
    await page.goto('/patient/documents')
    await expect(page.locator('h1')).toContainText('Medical Documents')

    // Billing
    await page.goto('/patient/billing')
    await expect(page.locator('h1')).toContainText('Billing & Invoices')

    // Profile
    await page.goto('/patient/profile')
    await expect(page.locator('h1')).toContainText('Patient Profile')
  })
})
