import { test, expect } from '@playwright/test'

test.describe('Simple Visual Test', () => {
  test('should open and show the login page', async ({ page }) => {
    // Navigate directly to localhost:3001 
    await page.goto('/')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Add a pause to see the browser
    await page.pause()
    
    // Basic checks - use more specific selector
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'test-results/login-page.png' })
    
    console.log('✅ Login page loaded successfully!')
  })

  test('should interact with login form', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Pause to see the initial state
    await page.pause()
    
    // Fill form
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('password123')
    
    // Another pause to see filled form
    await page.pause()
    
    // Click submit
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Final pause to see result
    await page.pause()
  })
})