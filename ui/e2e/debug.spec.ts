import { test, expect } from '@playwright/test'

test.describe('Debug Test', () => {
  test('simple debug test for browser visibility', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/')
    
    // Add a pause to see the browser
    await page.pause()
    
    // Check if the sign in form is visible
    await expect(page.getByText('Sign In')).toBeVisible()
    
    // Fill in some test data slowly
    await page.getByLabel('Email').fill('test@example.com')
    await page.waitForTimeout(1000)
    
    await page.getByLabel('Password').fill('password123')
    await page.waitForTimeout(1000)
    
    // Click the sign in button
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Wait to see what happens
    await page.waitForTimeout(2000)
  })

  test('test auth form toggle', async ({ page }) => {
    await page.goto('/')
    
    // Should show login form initially
    await expect(page.getByText('Sign In')).toBeVisible()
    
    // Add pause to inspect
    await page.pause()
    
    // Click to toggle to signup
    await page.getByRole('button', { name: 'Sign up' }).click()
    
    // Should now show signup form
    await expect(page.getByText('Sign Up')).toBeVisible()
    
    // Another pause to inspect signup form
    await page.pause()
  })
})