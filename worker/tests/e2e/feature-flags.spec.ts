/**
 * End-to-End tests for Feature Flagging System
 *
 * These tests verify the feature flagging system works correctly
 * in a real browser environment with actual user interactions.
 *
 * Run with: npx playwright test
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.TEST_URL || 'http://localhost:8787'

test.describe('Feature Flags E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authentication if needed
    // await page.goto(`${BASE_URL}/login`)
    // await page.fill('[data-testid="email"]', 'test@example.com')
    // await page.fill('[data-testid="password"]', 'password')
    // await page.click('[data-testid="login-button"]')
  })

  test('should show/hide features based on flags', async ({ page }) => {
    // Test that authentication features are controlled by flags
    await page.goto(BASE_URL)

    // Check if authentication flag is enabled
    const response = await page.request.get(`${BASE_URL}/api/flags/authentication`)
    const flagData = await response.json()

    if (flagData.enabled) {
      // Authentication should be visible
      await expect(page.locator('[data-testid="login-button"]')).toBeVisible()
      await expect(page.locator('[data-testid="register-button"]')).toBeVisible()
    } else {
      // Authentication should be hidden or show disabled message
      await expect(page.locator('[data-testid="auth-disabled-message"]')).toBeVisible()
    }
  })

  test('should handle flag changes in real-time', async ({ page }) => {
    await page.goto(BASE_URL)

    // Enable a test flag via API
    await page.request.post(`${BASE_URL}/api/flags/test_feature`, {
      headers: { 'Authorization': 'Bearer test-token' },
      data: { enabled: true }
    })

    // Refresh page and check if feature is visible
    await page.reload()
    // Add assertions based on your feature implementation
  })

  test('should maintain consistent user experience', async ({ page, context }) => {
    // Test that the same user gets consistent flag values
    await page.goto(BASE_URL)

    // Get flag value for current user
    const response1 = await page.request.get(`${BASE_URL}/api/flags/test_flag?userId=e2e_user`)
    const result1 = await response1.json()

    // Open new tab with same user
    const newPage = await context.newPage()
    await newPage.goto(BASE_URL)

    const response2 = await newPage.request.get(`${BASE_URL}/api/flags/test_flag?userId=e2e_user`)
    const result2 = await response2.json()

    // Results should be identical
    expect(result1.enabled).toBe(result2.enabled)
    expect(result1.variant).toBe(result2.variant)
  })

  test('should handle A/B test variants correctly', async ({ page }) => {
    // Set up A/B test flag
    await page.request.post(`${BASE_URL}/api/flags/checkout_test`, {
      headers: { 'Authorization': 'Bearer test-token' },
      data: {
        enabled: true,
        variants: {
          control: 50,
          treatment: 50
        }
      }
    })

    // Test multiple users to verify variant distribution
    const variants = new Set()

    for (let i = 0; i < 20; i++) {
      const response = await page.request.get(`${BASE_URL}/api/flags/checkout_test?userId=e2e_user_${i}`)
      const result = await response.json()
      variants.add(result.variant)
    }

    // Should have both variants represented
    expect(variants.has('control')).toBe(true)
    expect(variants.has('treatment')).toBe(true)
  })

  test('should gracefully handle flag service errors', async ({ page }) => {
    // Test behavior when flag service is unavailable
    // This might involve mocking network failures or KV unavailability

    await page.route('**/api/flags/**', route => {
      route.abort('failed')
    })

    await page.goto(BASE_URL)

    // Application should still work with default flag values
    await expect(page.locator('body')).toBeVisible()
    // Add more specific assertions based on your fallback behavior
  })

  test('should respect environment-specific flags', async ({ page }) => {
    const environment = process.env.TEST_ENVIRONMENT || 'dev'

    // Set flag for specific environment
    await page.request.post(`${BASE_URL}/api/flags/env_specific_feature`, {
      headers: { 'Authorization': 'Bearer test-token' },
      data: {
        enabled: true,
        environments: [environment]
      }
    })

    await page.goto(BASE_URL)

    const response = await page.request.get(`${BASE_URL}/api/flags/env_specific_feature`)
    const result = await response.json()

    // Flag should be enabled in the current environment
    expect(result.enabled).toBe(true)
  })
})

test.describe('Flag Management UI Tests', () => {
  test('should allow admin users to manage flags', async ({ page }) => {
    // Login as admin user
    await page.goto(`${BASE_URL}/admin/flags`)

    // Test flag creation
    await page.click('[data-testid="create-flag-button"]')
    await page.fill('[data-testid="flag-name"]', 'ui_test_flag')
    await page.check('[data-testid="flag-enabled"]')
    await page.fill('[data-testid="rollout-percentage"]', '25')
    await page.click('[data-testid="save-flag"]')

    // Verify flag appears in list
    await expect(page.locator('[data-testid="flag-ui_test_flag"]')).toBeVisible()

    // Test flag editing
    await page.click('[data-testid="edit-flag-ui_test_flag"]')
    await page.fill('[data-testid="rollout-percentage"]', '50')
    await page.click('[data-testid="save-flag"]')

    // Test flag deletion
    await page.click('[data-testid="delete-flag-ui_test_flag"]')
    await page.click('[data-testid="confirm-delete"]')

    await expect(page.locator('[data-testid="flag-ui_test_flag"]')).not.toBeVisible()
  })
})

/**
 * Performance Tests
 */
test.describe('Flag Performance Tests', () => {
  test('should evaluate flags quickly', async ({ page }) => {
    await page.goto(BASE_URL)

    const startTime = Date.now()

    // Make multiple flag evaluation requests
    const promises = Array.from({ length: 50 }, (_, i) =>
      page.request.get(`${BASE_URL}/api/flags/performance_test?userId=perf_user_${i}`)
    )

    await Promise.all(promises)

    const endTime = Date.now()
    const totalTime = endTime - startTime
    const avgTime = totalTime / 50

    console.log(`50 flag evaluations took ${totalTime}ms (avg: ${avgTime}ms)`)

    // Should be fast (adjust threshold based on your requirements)
    expect(avgTime).toBeLessThan(100) // Less than 100ms average
  })

  test('should handle high concurrency', async ({ page, context }) => {
    // Create multiple browser contexts to simulate concurrent users
    const contexts = await Promise.all(
      Array.from({ length: 10 }, () => context.browser()?.newContext())
    )

    const pages = await Promise.all(
      contexts.map(ctx => ctx?.newPage()).filter(Boolean)
    )

    const startTime = Date.now()

    // All pages evaluate flags simultaneously
    await Promise.all(
      pages.map((page, i) =>
        page?.request.get(`${BASE_URL}/api/flags/concurrency_test?userId=concurrent_user_${i}`)
      )
    )

    const endTime = Date.now()
    const totalTime = endTime - startTime

    console.log(`Concurrent flag evaluations took ${totalTime}ms`)

    // Should handle concurrency well
    expect(totalTime).toBeLessThan(5000) // Less than 5 seconds

    // Cleanup
    await Promise.all(contexts.map(ctx => ctx?.close()))
  })
})
