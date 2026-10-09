import { test, expect } from '@playwright/test'

test.describe('Receptionist End-to-End Workflow (Workflows 17-23)', () => {
  test('17. Receptionist Login & Dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', 'staff1@test.com')
    await page.fill('#password', 'Test@123')
    await page.click('button[type="submit"]')

    await page.waitForURL('/dashboard')
    await expect(page.locator('body')).toBeVisible()
  })

  test('18-19. Patient Search & New Patient Registration', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', 'staff1@test.com')
    await page.fill('#password', 'Test@123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    await page.goto('/dashboard/patients')
    await expect(page.locator('h1')).toContainText('Patients')

    await page.goto('/dashboard/patients/new')
    await expect(page.locator('h1')).toContainText('New Patient')
  })

  test('20-23. Appointment Management, OPD Queue Display & Invoices', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', 'staff1@test.com')
    await page.fill('#password', 'Test@123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // Appointments
    await page.goto('/dashboard/appointments')
    await expect(page.locator('h1')).toContainText('Appointments')

    // Queue Display
    await page.goto('/dashboard/queue-display')
    await expect(page.locator('body')).toBeVisible()

    // Invoices
    await page.goto('/dashboard/invoices')
    await expect(page.locator('h1')).toContainText('Invoices')
  })
})
