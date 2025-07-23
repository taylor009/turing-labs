import { test, expect } from '@playwright/test'

test.describe('Project Proposals', () => {
  // Mock authentication state by injecting scripts
  test.beforeEach(async ({ page }) => {
    // Mock localStorage for authentication state
    await page.addInitScript(() => {
      // Mock a logged-in user
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
    
    // Wait for potential auth loading
    await page.waitForTimeout(1000)
  })

  test('should display dashboard when authenticated', async ({ page }) => {
    // Should show the dashboard
    await expect(page.getByText('TuringLabs Dashboard')).toBeVisible()
    await expect(page.getByText('Manage your product reformulation proposals')).toBeVisible()
    
    // Should show navigation cards
    await expect(page.getByText('View Proposals')).toBeVisible()
    await expect(page.getByText('New Proposal')).toBeVisible()
    await expect(page.getByText('Analytics')).toBeVisible()
  })

  test('should navigate to proposals list', async ({ page }) => {
    // Click on "View Proposals" card
    await page.getByText('View Proposals').click()
    
    // Should navigate to proposals page
    await expect(page).toHaveURL('/proposals')
    await expect(page.getByText('Project Proposals')).toBeVisible()
    await expect(page.getByText('Manage and review product reformulation proposals')).toBeVisible()
  })

  test('should navigate to new proposal form', async ({ page }) => {
    // Click on "New Proposal" card
    await page.getByText('New Proposal').click()
    
    // Should navigate to new proposal page
    await expect(page).toHaveURL('/proposals/new')
    await expect(page.getByText('Create New Proposal')).toBeVisible()
    await expect(page.getByText('Submit a new product reformulation proposal for review')).toBeVisible()
  })

  test('should display proposal list page elements', async ({ page }) => {
    await page.goto('/proposals')
    
    // Should show main heading and description
    await expect(page.getByRole('heading', { name: 'Project Proposals' })).toBeVisible()
    await expect(page.getByText('Manage and review product reformulation proposals')).toBeVisible()
    
    // Should show "New Proposal" button
    await expect(page.getByRole('button', { name: 'New Proposal' })).toBeVisible()
    
    // Should show search and filter controls
    await expect(page.getByPlaceholder('Search proposals by name, category, or creator...')).toBeVisible()
    await expect(page.getByText('Filter by status')).toBeVisible()
    await expect(page.getByText('Filter by creator')).toBeVisible()
  })

  test('should interact with search functionality', async ({ page }) => {
    await page.goto('/proposals')
    
    const searchInput = page.getByPlaceholder('Search proposals by name, category, or creator...')
    
    // Type in search box
    await searchInput.fill('test search')
    await expect(searchInput).toHaveValue('test search')
    
    // Clear search
    await searchInput.clear()
    await expect(searchInput).toHaveValue('')
  })

  test('should interact with status filter', async ({ page }) => {
    await page.goto('/proposals')
    
    // Click on status filter dropdown
    await page.getByText('Filter by status').click()
    
    // Should show filter options
    await expect(page.getByText('All Statuses')).toBeVisible()
    await expect(page.getByText('Draft')).toBeVisible()
    await expect(page.getByText('Pending Approval')).toBeVisible()
    await expect(page.getByText('Approved')).toBeVisible()
    await expect(page.getByText('Rejected')).toBeVisible()
    await expect(page.getByText('Changes Requested')).toBeVisible()
    
    // Select a filter option
    await page.getByText('Draft').click()
  })

  test('should interact with creator filter', async ({ page }) => {
    await page.goto('/proposals')
    
    // Click on creator filter dropdown
    await page.getByText('Filter by creator').click()
    
    // Should show filter options
    await expect(page.getByText('All Proposals')).toBeVisible()
    await expect(page.getByText('My Proposals')).toBeVisible()
    await expect(page.getByText("Others' Proposals")).toBeVisible()
    
    // Select a filter option
    await page.getByText('My Proposals').click()
  })

  test('should display empty state when no proposals', async ({ page }) => {
    await page.goto('/proposals')
    
    // Wait for loading to complete and check for empty state
    // This assumes no proposals are loaded (which is likely in test environment)
    await page.waitForTimeout(2000)
    
    // Should show empty state
    const noProposalsText = page.getByText('No proposals found')
    const createFirstText = page.getByText('Create your first proposal')
    
    // Check if either empty state is visible
    const hasEmptyState = await noProposalsText.isVisible() || await createFirstText.isVisible()
    expect(hasEmptyState).toBeTruthy()
  })
})

test.describe('New Proposal Form', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
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

    await page.goto('/proposals/new')
    await page.waitForTimeout(1000)
  })

  test('should display new proposal form elements', async ({ page }) => {
    // Should show page heading
    await expect(page.getByText('Create New Proposal')).toBeVisible()
    await expect(page.getByText('Submit a new product reformulation proposal for review')).toBeVisible()
    
    // Should show form elements (these depend on the ProjectProposalForm component)
    // We'll test for common form elements that are likely to be present
    await expect(page.locator('form')).toBeVisible()
  })

  test('should handle form interaction', async ({ page }) => {
    // Look for common form elements
    const form = page.locator('form')
    await expect(form).toBeVisible()
    
    // Look for input fields (exact selectors depend on the form implementation)
    const inputs = page.locator('input[type="text"], input[type="email"], textarea')
    const inputCount = await inputs.count()
    
    // Should have some form inputs
    expect(inputCount).toBeGreaterThan(0)
  })

  test('should navigate back from new proposal', async ({ page }) => {
    // Look for navigation elements like back button or breadcrumbs
    // This depends on the navigation implementation
    
    // Navigate back using browser back button
    await page.goBack()
    
    // Should be back on the main page or proposals list
    const currentUrl = page.url()
    expect(currentUrl).toMatch(/\/(proposals)?$/)
  })
})