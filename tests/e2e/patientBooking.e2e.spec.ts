import { test, expect } from '@playwright/test'

test.describe('Patient Complete Appointment Booking Journey E2E', () => {
  test('allows a patient to sign in, select doctor, date, and available slot to confirm booking', async ({ page }) => {
    // 1. Visit Patient Login
    await page.goto('/patient/login')
    await expect(page.locator('h1')).toContainText('Patient Portal')

    // 2. Fill credentials for Patient 1
    await page.fill('#email', 'patient1@test.com')
    await page.fill('#password', 'Test@123')
    await page.click('button[type="submit"]')

    // 3. Navigate to Book Appointment
    await page.waitForURL('/patient/dashboard')
    await page.goto('/patient/appointments/book')
    await expect(page.locator('h1')).toContainText('Book an Appointment')

    // 4. Select Doctor
    const doctorSelect = page.locator('select')
    await doctorSelect.selectOption({ index: 1 })

    // 5. Select Date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 2)
    const dateStr = tomorrow.toISOString().slice(0, 10)
    await page.fill('input[type="date"]', dateStr)

    // 6. Wait for available slots buttons to render and click first slot
    const slotButton = page.locator('button:has-text("am"), button:has-text("pm")').first()
    await expect(slotButton).toBeVisible({ timeout: 10000 })
    await slotButton.click()

    // 7. Submit booking
    await page.click('button:has-text("Confirm Appointment")')

    // 8. Confirm redirect to my appointments page
    await page.waitForURL('/patient/appointments')
    await expect(page.locator('h1')).toContainText('My Appointments')
  })
})
