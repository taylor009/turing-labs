import { defineConfig, devices } from '@playwright/test'

/**
 * Simple Playwright config without webServer for direct testing
 * Use this when you already have your dev server running
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run tests sequentially for debugging
  forbidOnly: !!process.env.CI,
  retries: 0, // No retries for debugging
  workers: 1, // Single worker for debugging
  reporter: 'line',
  
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Slow down for debugging
    launchOptions: {
      slowMo: 500,
    },
  },

  projects: [
    {
      name: 'chromium-debug',
      use: { 
        ...devices['Desktop Chrome'],
        // Additional debug settings
        headless: false,
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  // No webServer - assumes you have dev server running
})