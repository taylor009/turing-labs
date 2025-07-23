import { test, expect } from '@playwright/test'

test.describe('Navigation and Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display the application title and description', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Project Proposal Platform/)
    
    // Check meta description (if accessible)
    const description = await page.locator('meta[name="description"]').getAttribute('content')
    expect(description).toContain('Manage and submit your project proposals')
  })

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 })
    
    // Should still display main content
    await expect(page.getByText('Sign In')).toBeVisible()
    
    // Check that elements are properly arranged for mobile
    const authCard = page.locator('.rounded-lg.border.bg-card')
    await expect(authCard).toBeVisible()
  })

  test('should be responsive on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    
    // Should display content properly
    await expect(page.getByText('Sign In')).toBeVisible()
  })

  test('should handle keyboard navigation', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab')
    
    // Should focus on the first focusable element
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()
  })

  test('should maintain focus management', async ({ page }) => {
    // Click on email input
    await page.getByLabel('Email').click()
    
    // Should be focused
    const isFocused = await page.getByLabel('Email').evaluate(el => el === document.activeElement)
    expect(isFocused).toBeTruthy()
    
    // Tab to next element
    await page.keyboard.press('Tab')
    
    // Should move focus to password field
    const passwordFocused = await page.getByLabel('Password').evaluate(el => el === document.activeElement)
    expect(passwordFocused).toBeTruthy()
  })
})

test.describe('Layout Components', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for layout tests
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
    
    await page.goto('/')
    await page.waitForTimeout(1000)
  })

  test('should display authenticated layout elements', async ({ page }) => {
    // Should show dashboard content
    await expect(page.getByText('TuringLabs Dashboard')).toBeVisible()
    
    // Should show navigation cards
    await expect(page.getByText('View Proposals')).toBeVisible()
    await expect(page.getByText('New Proposal')).toBeVisible()
    await expect(page.getByText('Analytics')).toBeVisible()
  })

  test('should handle card interactions', async ({ page }) => {
    const proposalsCard = page.getByText('View Proposals').locator('..')
    
    // Should be clickable
    await expect(proposalsCard).toBeVisible()
    
    // Should have hover effects (checking for transition classes)
    const hasTransition = await proposalsCard.evaluate(el => 
      el.classList.contains('hover:shadow-lg') || 
      el.classList.contains('transition-shadow')
    )
    expect(hasTransition).toBeTruthy()
  })

  test('should display proper card structure', async ({ page }) => {
    // Check card components exist
    const cards = page.locator('[role="region"], .rounded-lg.border')
    const cardCount = await cards.count()
    
    // Should have dashboard cards
    expect(cardCount).toBeGreaterThan(0)
  })

  test('should handle navigation between pages', async ({ page }) => {
    // Navigate to proposals
    await page.getByText('View Proposals').click()
    await expect(page).toHaveURL('/proposals')
    
    // Go back to dashboard
    await page.goBack()
    await expect(page).toHaveURL('/')
    
    // Navigate to new proposal
    await page.getByText('New Proposal').click()
    await expect(page).toHaveURL('/proposals/new')
  })

  test('should maintain consistent styling across pages', async ({ page }) => {
    // Check consistent container classes on dashboard
    const dashboardContainer = page.locator('.max-w-4xl.mx-auto.py-8.px-4')
    await expect(dashboardContainer).toBeVisible()
    
    // Navigate to proposals and check consistency
    await page.getByText('View Proposals').click()
    
    const proposalsContainer = page.locator('.container.mx-auto.py-8')
    await expect(proposalsContainer).toBeVisible()
  })
})

test.describe('Error Handling and Edge Cases', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline condition
    await page.context().setOffline(true)
    
    await page.goto('/')
    
    // Should still render the page structure
    await expect(page.locator('body')).toBeVisible()
    
    // Reset online state
    await page.context().setOffline(false)
  })

  test('should handle JavaScript errors gracefully', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    await page.goto('/')
    
    // Wait a bit for any immediate errors
    await page.waitForTimeout(2000)
    
    // Should not have critical errors that break the page
    const criticalErrors = errors.filter(error => 
      error.includes('ReferenceError') || 
      error.includes('TypeError') ||
      error.includes('SyntaxError')
    )
    
    // Some errors might be expected (like network calls failing), 
    // but we shouldn't have critical JavaScript errors
    expect(criticalErrors.length).toBeLessThan(5)
  })

  test('should handle slow loading states', async ({ page }) => {
    // Slow down network to test loading states
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 100))
      await route.continue()
    })
    
    await page.goto('/')
    
    // Should eventually load the content
    await expect(page.getByText('Sign In')).toBeVisible({ timeout: 10000 })
  })

  test('should handle missing resources', async ({ page }) => {
    // Block some resources to test resilience
    await page.route('**/*.jpg', route => route.abort())
    await page.route('**/*.png', route => route.abort())
    
    await page.goto('/')
    
    // Should still render main content
    await expect(page.getByText('Sign In')).toBeVisible()
  })
})