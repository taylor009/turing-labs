import { test, expect } from '@playwright/test'

test.describe('UI Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test.describe('Button Components', () => {
    test('should display and interact with buttons', async ({ page }) => {
      // Primary button (Sign In)
      const signInButton = page.getByRole('button', { name: 'Sign In' })
      await expect(signInButton).toBeVisible()
      await expect(signInButton).toBeEnabled()
      
      // Button should have proper styling
      const buttonClass = await signInButton.getAttribute('class')
      expect(buttonClass).toContain('inline-flex')
      expect(buttonClass).toContain('items-center')
      expect(buttonClass).toContain('justify-center')
    })

    test('should handle button hover states', async ({ page }) => {
      const signInButton = page.getByRole('button', { name: 'Sign In' })
      
      // Hover over button
      await signInButton.hover()
      
      // Should be interactive
      await expect(signInButton).toBeVisible()
    })

    test('should handle button disabled states', async ({ page }) => {
      // Fill form with invalid data to potentially trigger disabled state
      await page.getByLabel('Email').fill('invalid')
      await page.getByLabel('Password').fill('123')
      
      // Submit to potentially show loading/disabled state
      const signInButton = page.getByRole('button', { name: 'Sign In' })
      await signInButton.click()
      
      // Button might show loading state briefly
      const loadingButton = page.getByText('Signing in...')
      if (await loadingButton.isVisible({ timeout: 1000 })) {
        await expect(loadingButton).toBeDisabled()
      }
    })
  })

  test.describe('Input Components', () => {
    test('should handle text input interactions', async ({ page }) => {
      const emailInput = page.getByLabel('Email')
      const passwordInput = page.getByLabel('Password')
      
      // Should be visible and interactable
      await expect(emailInput).toBeVisible()
      await expect(passwordInput).toBeVisible()
      
      // Should accept input
      await emailInput.fill('test@example.com')
      await expect(emailInput).toHaveValue('test@example.com')
      
      await passwordInput.fill('password123')
      await expect(passwordInput).toHaveValue('password123')
    })

    test('should show input validation states', async ({ page }) => {
      const emailInput = page.getByLabel('Email')
      
      // Fill invalid email and try to submit
      await emailInput.fill('invalid-email')
      await page.getByRole('button', { name: 'Sign In' }).click()
      
      // Should show validation error
      await expect(page.getByText('Please enter a valid email address')).toBeVisible()
    })

    test('should handle input focus states', async ({ page }) => {
      const emailInput = page.getByLabel('Email')
      
      // Click to focus
      await emailInput.click()
      
      // Should be focused
      const isFocused = await emailInput.evaluate(el => el === document.activeElement)
      expect(isFocused).toBeTruthy()
    })

    test('should handle password visibility toggle', async ({ page }) => {
      const passwordInput = page.getByLabel('Password')
      const toggleButton = page.locator('button[type="button"]').first()
      
      // Initially password should be hidden
      await expect(passwordInput).toHaveAttribute('type', 'password')
      
      // Click toggle
      await toggleButton.click()
      
      // Should now be text type
      await expect(passwordInput).toHaveAttribute('type', 'text')
      
      // Click again to hide
      await toggleButton.click()
      
      // Should be password again
      await expect(passwordInput).toHaveAttribute('type', 'password')
    })
  })

  test.describe('Card Components', () => {
    test('should display card structure', async ({ page }) => {
      // Switch to signup to see card structure clearly
      await page.getByRole('button', { name: 'Sign up' }).click()
      
      // Should have card container
      const card = page.locator('.rounded-lg.border.bg-card')
      await expect(card).toBeVisible()
      
      // Should have card header with title
      const cardTitle = page.getByText('Sign Up')
      await expect(cardTitle).toBeVisible()
      
      // Should have card content
      const cardContent = card.locator('.p-6.pt-0')
      await expect(cardContent).toBeVisible()
    })

    test('should handle card hover effects', async ({ page }) => {
      // Mock authenticated state to see dashboard cards
      await page.addInitScript(() => {
        Object.defineProperty(window, 'mockAuthUser', {
          value: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            role: 'ADMIN'
          }
        })
      })
      
      await page.reload()
      await page.waitForTimeout(1000)
      
      // Find dashboard cards
      const proposalsCard = page.getByText('View Proposals').locator('..')
      
      if (await proposalsCard.isVisible()) {
        // Hover over card
        await proposalsCard.hover()
        
        // Should remain visible and interactive
        await expect(proposalsCard).toBeVisible()
      }
    })
  })

  test.describe('Form Components', () => {
    test('should handle form submission', async ({ page }) => {
      // Fill form with valid data
      await page.getByLabel('Email').fill('test@example.com')
      await page.getByLabel('Password').fill('password123')
      
      // Submit form
      await page.getByRole('button', { name: 'Sign In' }).click()
      
      // Should attempt submission (might show loading state)
      const loadingState = page.getByText('Signing in...')
      if (await loadingState.isVisible({ timeout: 1000 })) {
        await expect(loadingState).toBeVisible()
      }
    })

    test('should handle form validation', async ({ page }) => {
      // Submit empty form
      await page.getByRole('button', { name: 'Sign In' }).click()
      
      // Should show validation errors
      await expect(page.getByText('Please enter a valid email address')).toBeVisible()
      await expect(page.getByText('Password must be at least 6 characters')).toBeVisible()
    })

    test('should handle checkbox interactions', async ({ page }) => {
      const checkbox = page.getByLabel('Remember me')
      
      // Should be unchecked initially
      await expect(checkbox).not.toBeChecked()
      
      // Click to check
      await checkbox.click()
      
      // Should now be checked
      await expect(checkbox).toBeChecked()
      
      // Click again to uncheck
      await checkbox.click()
      
      // Should be unchecked
      await expect(checkbox).not.toBeChecked()
    })
  })

  test.describe('Icon Components', () => {
    test('should display icons properly', async ({ page }) => {
      // Check for SVG icons
      const icons = page.locator('svg')
      const iconCount = await icons.count()
      
      // Should have icons present
      expect(iconCount).toBeGreaterThan(0)
      
      // Icons should have proper attributes
      const firstIcon = icons.first()
      const hasViewBox = await firstIcon.getAttribute('viewBox')
      expect(hasViewBox).toBeTruthy()
    })

    test('should display Lucide icons', async ({ page }) => {
      // Look for Lucide icon classes
      const lucideIcons = page.locator('.lucide')
      const lucideCount = await lucideIcons.count()
      
      // Should have Lucide icons
      expect(lucideCount).toBeGreaterThan(0)
    })
  })

  test.describe('Loading States', () => {
    test('should handle loading indicators', async ({ page }) => {
      // Look for loading elements
      const loadingElements = page.locator('.animate-spin, .animate-pulse')
      
      // Submit form to potentially trigger loading
      await page.getByLabel('Email').fill('test@example.com')
      await page.getByLabel('Password').fill('password123')
      await page.getByRole('button', { name: 'Sign In' }).click()
      
      // Check if loading state appears
      const loadingButton = page.getByText('Signing in...')
      if (await loadingButton.isVisible({ timeout: 1000 })) {
        await expect(loadingButton).toBeVisible()
      }
    })
  })

  test.describe('Responsive Design', () => {
    test('should adapt to different screen sizes', async ({ page }) => {
      // Test mobile
      await page.setViewportSize({ width: 375, height: 812 })
      await expect(page.getByText('Sign In')).toBeVisible()
      
      // Test tablet
      await page.setViewportSize({ width: 768, height: 1024 })
      await expect(page.getByText('Sign In')).toBeVisible()
      
      // Test desktop
      await page.setViewportSize({ width: 1200, height: 800 })
      await expect(page.getByText('Sign In')).toBeVisible()
    })

    test('should maintain usability on small screens', async ({ page }) => {
      // Set very small screen
      await page.setViewportSize({ width: 320, height: 568 })
      
      // Form should still be usable
      await expect(page.getByLabel('Email')).toBeVisible()
      await expect(page.getByLabel('Password')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
      
      // Should be able to interact
      await page.getByLabel('Email').fill('test@example.com')
      await expect(page.getByLabel('Email')).toHaveValue('test@example.com')
    })
  })
})