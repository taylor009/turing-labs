import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display login form when not authenticated', async ({ page }) => {
    // Should show auth forms
    await expect(page.getByText('Sign In')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByLabel('Remember me')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('should toggle between login and signup forms', async ({ page }) => {
    // Start with login form
    await expect(page.getByText('Sign In')).toBeVisible()
    
    // Click on "Sign up" link
    await page.getByRole('button', { name: 'Sign up' }).click()
    
    // Should now show signup form
    await expect(page.getByText('Sign Up')).toBeVisible()
    await expect(page.getByLabel('Full Name (Optional)')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByLabel('Confirm Password')).toBeVisible()
    
    // Click on "Sign in" link to go back
    await page.getByRole('button', { name: 'Sign in' }).click()
    
    // Should be back to login form
    await expect(page.getByText('Sign In')).toBeVisible()
    await expect(page.getByLabel('Remember me')).toBeVisible()
  })

  test('should show validation errors for invalid login', async ({ page }) => {
    // Try to submit empty form
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Should show validation errors
    await expect(page.getByText('Please enter a valid email address')).toBeVisible()
    await expect(page.getByText('Password must be at least 6 characters')).toBeVisible()
  })

  test('should show validation errors for invalid signup', async ({ page }) => {
    // Switch to signup form
    await page.getByRole('button', { name: 'Sign up' }).click()
    
    // Try to submit empty form
    await page.getByRole('button', { name: 'Sign Up' }).click()
    
    // Should show validation errors
    await expect(page.getByText('Please enter a valid email address')).toBeVisible()
    await expect(page.getByText('Password must be at least 6 characters')).toBeVisible()
  })

  test('should show password mismatch error in signup', async ({ page }) => {
    // Switch to signup form
    await page.getByRole('button', { name: 'Sign up' }).click()
    
    // Fill form with mismatched passwords
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByLabel('Confirm Password').fill('password456')
    
    await page.getByRole('button', { name: 'Sign Up' }).click()
    
    // Should show password mismatch error
    await expect(page.getByText("Passwords don't match")).toBeVisible()
  })

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByLabel('Password')
    const toggleButton = page.locator('button[type="button"]').first()
    
    // Password should be hidden initially
    await expect(passwordInput).toHaveAttribute('type', 'password')
    
    // Click toggle button
    await toggleButton.click()
    
    // Password should now be visible
    await expect(passwordInput).toHaveAttribute('type', 'text')
    
    // Click toggle button again
    await toggleButton.click()
    
    // Password should be hidden again
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('should handle remember me checkbox', async ({ page }) => {
    const rememberMeCheckbox = page.getByLabel('Remember me')
    
    // Checkbox should be unchecked initially
    await expect(rememberMeCheckbox).not.toBeChecked()
    
    // Click checkbox
    await rememberMeCheckbox.click()
    
    // Checkbox should now be checked
    await expect(rememberMeCheckbox).toBeChecked()
  })

  test('should display loading state when submitting', async ({ page }) => {
    // Fill valid form data
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('password123')
    
    // Submit form (this will likely fail due to no backend, but should show loading)
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Should show loading state (briefly)
    await expect(page.getByText('Signing in...')).toBeVisible({ timeout: 1000 })
  })
})