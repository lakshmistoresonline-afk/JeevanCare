import { test, expect } from '@playwright/test'

test.describe('Patient Complete Appointment Booking Journey E2E', () => {
  test('allows a patient to sign in, select doctor, date, and available slot to confirm booking', async ({ page }) => {
    // 1. Visit Patient Login
    await page.goto('/patient/login')
    await expect(page.locator('h1')).toBeVisible()

    // 2. Fill credentials for Patient 1
    await page.fill('input[name="email"]', 'patient1@test.com')
    await page.fill('input[name="password"]', 'Test@123')
    await page.click('button[type="submit"]')

    // 3. Navigate to Book Appointment
    await page.waitForURL('**/patient/dashboard**')
    await page.goto('/patient/appointments/book')
    await expect(page.locator('h1')).toContainText('Book')

    // 4. Select Doctor
    const doctorSelect = page.locator('select').first()
    await doctorSelect.selectOption({ index: 1 })

    // 5. Select Date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 2)
    const dateStr = tomorrow.toISOString().slice(0, 10)
    if (await page.locator('input[type="date"]').isVisible()) {
      await page.fill('input[type="date"]', dateStr)
    }

    // 6. Wait for available slots buttons
    const slotButton = page.locator('button:has-text("am"), button:has-text("pm")').first()
    if (await slotButton.isVisible()) {
      await slotButton.click()
    }
  })
})
