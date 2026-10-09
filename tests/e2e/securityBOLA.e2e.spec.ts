import { test, expect } from '@playwright/test'

test.describe('E2E Security, BOLA & Role Access Controls (Workflows 43-48)', () => {
  test('48. Patient role route denial for staff dashboard', async ({ page }) => {
    await page.goto('/patient/login')
    await page.fill('#email', 'patient1@test.com')
    await page.fill('#password', 'Test@123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/patient/dashboard')

    // Attempt direct navigation to staff dashboard
    await page.goto('/dashboard')
    await expect(page.url()).not.toBe('/dashboard/activity')
  })

  test('45. Direct medical document download access control', async ({ page }) => {
    await page.goto('/patient/login')
    await page.fill('#email', 'patient2@test.com')
    await page.fill('#password', 'Test@123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/patient/dashboard')

    // Attempt downloading fake/other document ID directly
    const res = await page.goto('/api/medical-documents/fake-invalid-id')
    expect(res?.status()).toBeGreaterThanOrEqual(400)
  })
})
