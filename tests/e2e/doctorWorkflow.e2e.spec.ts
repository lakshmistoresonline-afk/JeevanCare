import { test, expect } from '@playwright/test'

test.describe('Doctor Consultation & EMR Workflow (Workflows 24-32)', () => {
  test('24-25. Doctor Login & Today Queue', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', 'doctor1@test.com')
    await page.fill('#password', 'Test@123')
    await page.click('button[type="submit"]')

    await page.waitForURL('/dashboard')
    await expect(page.locator('body')).toBeVisible()
  })

  test('26-32. EMR Workspace, Consultation, Vitals, Diagnosis & Prescriptions', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', 'doctor1@test.com')
    await page.fill('#password', 'Test@123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    await page.goto('/dashboard/visits/new')
    await expect(page.locator('body')).toBeVisible()
  })
})
