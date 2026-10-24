import { test, expect } from '@playwright/test'

test.describe('JeevanCare Visual Regression Snapshot Suite', () => {
  test('landing page visual snapshot (Desktop 1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    expect(await page.screenshot({ fullPage: true })).toMatchSnapshot('landing-page-desktop.png')
  })

  test('login page visual snapshot (Desktop 1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    expect(await page.screenshot({ fullPage: true })).toMatchSnapshot('login-page-desktop.png')
  })

  test('patient login page visual snapshot (Mobile 390x844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    expect(await page.screenshot({ fullPage: true })).toMatchSnapshot('login-page-mobile.png')
  })
})
