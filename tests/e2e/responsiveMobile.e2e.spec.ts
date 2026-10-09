import { test, expect } from '@playwright/test'

test.describe('Mobile Viewport Responsive UAT (Workflows 49-51)', () => {
  test('49. Mobile Patient Booking Viewport (390x844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/patient/login')
    await page.fill('#email', 'patient1@test.com')
    await page.fill('#password', 'Test@123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/patient/dashboard')

    await page.goto('/patient/appointments/book')
    await expect(page.locator('h1')).toContainText('Book an Appointment')
  })

  test('50. Mobile Appointment History Viewport (412x915)', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 })
    await page.goto('/patient/login')
    await page.fill('#email', 'patient1@test.com')
    await page.fill('#password', 'Test@123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/patient/dashboard')

    await page.goto('/patient/history')
    await expect(page.locator('h1')).toContainText('Medical History')
  })
})
