import { test, expect } from '@playwright/test'

test('smoke test: load home page and take screenshot', async ({ page }) => {
  await page.goto('http://localhost:3000')
  const title = await page.title()
  expect(title).toBeTruthy()
  await page.screenshot({ path: 'tests/e2e/smoke-screenshot.png', fullPage: true })
})
