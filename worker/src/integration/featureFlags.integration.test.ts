/**
 * Integration tests for Feature Flagging System
 * 
 * These tests use Miniflare to create a real Cloudflare Workers environment
 * with actual KV namespace and D1 database for comprehensive testing.
 * 
 * To run these tests:
 * npm run test:integration
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { FeatureFlagService } from '../utils/featureFlags.js'
import { 
  createTestEnvironment, 
  makeAuthenticatedRequest, 
  waitForKVPropagation,
  assertResponse,
  createTestFlag,
  type TestEnvironment 
} from './test-setup.js'

// Skip these tests unless explicitly running integration tests
const runIntegrationTests = process.env.RUN_INTEGRATION_TESTS === 'true'

describe.skipIf(!runIntegrationTests)('Feature Flags Integration Tests', () => {
  let testEnv: TestEnvironment
  let flagService: FeatureFlagService
  let testFlags: string[] = []

  beforeAll(async () => {
    console.log('🔧 Setting up integration test environment...')
    testEnv = await createTestEnvironment()
    flagService = new FeatureFlagService(testEnv.env.FEATURE_FLAGS, 'integration-test')
    console.log('✅ Test environment ready')
  }, 30000) // 30 second timeout for setup

  afterAll(async () => {
    console.log('🧹 Cleaning up test environment...')
    await testEnv.cleanup()
    console.log('✅ Cleanup complete')
  })

  beforeEach(() => {
    testFlags = []
  })

  afterEach(async () => {
    // Clean up test flags
    for (const flagName of testFlags) {
      try {
        await flagService.setFlag(flagName, { enabled: false })
        await testEnv.env.FEATURE_FLAGS.delete(`feature:integration-test:${flagName}`)
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  })

  describe('Real KV Operations', () => {
    it('should persist and retrieve flag configurations', async () => {
      const flagName = 'integration_test_flag'
      testFlags.push(flagName)

      const config = createTestFlag({
        rolloutPercentage: 75,
        userWhitelist: ['test_user_1', 'test_user_2']
      })

      await flagService.setFlag(flagName, config)
      
      // Wait for KV propagation
      await waitForKVPropagation(100)

      const result = await flagService.evaluateFlag(flagName)
      expect(result.enabled).toBe(true)
      expect(result.reason).toBe('default')

      // Verify flag was actually stored in KV
      const storedConfig = await testEnv.env.FEATURE_FLAGS.get(`feature:integration-test:${flagName}`)
      expect(storedConfig).toBeTruthy()
      const parsedConfig = JSON.parse(storedConfig!)
      expect(parsedConfig.rolloutPercentage).toBe(75)
      expect(parsedConfig.userWhitelist).toEqual(['test_user_1', 'test_user_2'])
    })

    it('should handle user targeting with real hashing', async () => {
      const flagName = 'user_targeting_test'
      testFlags.push(flagName)

      await flagService.setFlag(flagName, createTestFlag({
        rolloutPercentage: 50
      }))

      await waitForKVPropagation()

      // Test multiple users to verify distribution
      const users = Array.from({ length: 100 }, (_, i) => `integration_user_${i}`)
      const results = await Promise.all(
        users.map(userId => flagService.isEnabled(flagName, userId))
      )

      const enabledCount = results.filter(Boolean).length
      
      // Should be roughly 50% (allow for variance due to hashing)
      expect(enabledCount).toBeGreaterThan(30)
      expect(enabledCount).toBeLessThan(70)
      
      console.log(`User targeting test: ${enabledCount}/100 users enabled (expected ~50)`)
    })

    it('should maintain consistency across multiple evaluations', async () => {
      const flagName = 'consistency_test'
      testFlags.push(flagName)

      await flagService.setFlag(flagName, createTestFlag({
        rolloutPercentage: 50
      }))

      await waitForKVPropagation()

      const userId = 'consistent_user_123'
      
      // Evaluate the same flag multiple times
      const results = await Promise.all(
        Array.from({ length: 10 }, () => flagService.isEnabled(flagName, userId))
      )

      // All results should be identical
      const firstResult = results[0]
      expect(results.every(result => result === firstResult)).toBe(true)
      
      console.log(`Consistency test: User ${userId} consistently got ${firstResult}`)
    })
  })

  describe('API Integration Tests', () => {
    it('should manage flags via REST API', async () => {
      const flagName = 'api_test_flag'
      testFlags.push(flagName)

      // Create flag via API
      const createResponse = await makeAuthenticatedRequest(
        testEnv.mf,
        'POST',
        `/api/flags/${flagName}`,
        testEnv.adminToken,
        createTestFlag({ rolloutPercentage: 25 })
      )

      const createResult = await assertResponse(createResponse, 200)
      expect(createResult.success).toBe(true)
      expect(createResult.flagName).toBe(flagName)

      await waitForKVPropagation()

      // Get flag via API
      const getResponse = await makeAuthenticatedRequest(
        testEnv.mf,
        'GET',
        `/api/flags/${flagName}?userId=api_test_user`,
        testEnv.authToken
      )

      const getResult = await assertResponse(getResponse, 200)
      expect(getResult).toHaveProperty('enabled')
      expect(getResult).toHaveProperty('variant')
      expect(getResult).toHaveProperty('reason')

      // List all flags
      const listResponse = await makeAuthenticatedRequest(
        testEnv.mf,
        'GET',
        '/api/flags',
        testEnv.adminToken
      )

      const listResult = await assertResponse(listResponse, 200)
      expect(listResult.flags).toHaveProperty(flagName)
    })

    it('should handle user overrides via API', async () => {
      const flagName = 'user_override_test'
      const userId = 'override_test_user'
      testFlags.push(flagName)

      // Create flag
      await flagService.setFlag(flagName, createTestFlag({ rolloutPercentage: 0 }))
      await waitForKVPropagation()

      // Verify user is not in rollout
      let evalResponse = await makeAuthenticatedRequest(
        testEnv.mf,
        'GET',
        `/api/flags/${flagName}?userId=${userId}`,
        testEnv.authToken
      )
      let evalResult = await assertResponse(evalResponse, 200)
      expect(evalResult.enabled).toBe(false)

      // Set user override via API
      const overrideResponse = await makeAuthenticatedRequest(
        testEnv.mf,
        'POST',
        `/api/flags/${flagName}/users/${userId}`,
        testEnv.adminToken,
        { enabled: true }
      )

      await assertResponse(overrideResponse, 200)
      await waitForKVPropagation()

      // Verify user override works
      evalResponse = await makeAuthenticatedRequest(
        testEnv.mf,
        'GET',
        `/api/flags/${flagName}?userId=${userId}`,
        testEnv.authToken
      )
      evalResult = await assertResponse(evalResponse, 200)
      expect(evalResult.enabled).toBe(true)
      expect(evalResult.reason).toBe('user_override')

      // Remove user override
      const removeResponse = await makeAuthenticatedRequest(
        testEnv.mf,
        'DELETE',
        `/api/flags/${flagName}/users/${userId}`,
        testEnv.adminToken
      )

      await assertResponse(removeResponse, 200)
      await waitForKVPropagation()

      // Verify override is removed
      evalResponse = await makeAuthenticatedRequest(
        testEnv.mf,
        'GET',
        `/api/flags/${flagName}?userId=${userId}`,
        testEnv.authToken
      )
      evalResult = await assertResponse(evalResponse, 200)
      expect(evalResult.enabled).toBe(false)
      expect(evalResult.reason).not.toBe('user_override')
    })

    it('should protect routes with feature flags', async () => {
      // Disable authentication flag
      await flagService.setFlag('authentication', createTestFlag({ enabled: false }))
      await waitForKVPropagation()

      // Auth routes should return 503
      const authResponse = await makeAuthenticatedRequest(
        testEnv.mf,
        'GET',
        '/api/auth/me',
        testEnv.authToken
      )

      expect(authResponse.status).toBe(503)
      const errorResult = await authResponse.json() as any
      expect(errorResult.error).toContain('disabled')

      // Re-enable authentication flag
      await flagService.setFlag('authentication', createTestFlag({ enabled: true }))
      await waitForKVPropagation()

      // Auth routes should work again
      const authResponse2 = await makeAuthenticatedRequest(
        testEnv.mf,
        'GET',
        '/api/auth/me',
        testEnv.authToken
      )

      // Should return 200 (or 401 if token validation fails, but not 503)
      expect([200, 401]).toContain(authResponse2.status)
    })
  })

  describe('Performance Testing', () => {
    it('should evaluate flags quickly', async () => {
      const flagName = 'performance_test'
      testFlags.push(flagName)

      await flagService.setFlag(flagName, createTestFlag())
      await waitForKVPropagation()

      const startTime = Date.now()
      
      // Evaluate flag 50 times (reduced for integration test)
      await Promise.all(
        Array.from({ length: 50 }, (_, i) => 
          flagService.isEnabled(flagName, `perf_user_${i}`)
        )
      )

      const endTime = Date.now()
      const avgTime = (endTime - startTime) / 50

      console.log(`Performance test: 50 evaluations took ${endTime - startTime}ms (avg: ${avgTime.toFixed(2)}ms)`)

      // Should be reasonably fast (more lenient for integration tests)
      expect(avgTime).toBeLessThan(50) // Less than 50ms average
    })
  })

  describe('Error Scenarios', () => {
    it('should handle non-existent flags gracefully', async () => {
      const result = await flagService.isEnabled('non_existent_flag', 'test_user', true)
      expect(result).toBe(true) // Should return default value
    })

    it('should handle invalid flag configurations', async () => {
      const flagName = 'invalid_config_test'
      testFlags.push(flagName)

      // Put invalid JSON directly in KV
      await testEnv.env.FEATURE_FLAGS.put(
        `feature:integration-test:${flagName}`,
        'invalid json'
      )

      await waitForKVPropagation()

      // Should handle gracefully and return default
      const result = await flagService.isEnabled(flagName, 'test_user', false)
      expect(result).toBe(false)
    })

    it('should handle authentication errors in API', async () => {
      // Test without authentication token
      const response = await testEnv.mf.dispatchFetch('http://localhost/api/flags', {
        method: 'GET'
      })

      expect(response.status).toBe(401)
      const errorResult = await response.json() as any
      expect(errorResult.error).toContain('Authentication required')
    })

    it('should handle invalid API requests', async () => {
      // Test invalid flag configuration
      const response = await makeAuthenticatedRequest(
        testEnv.mf,
        'POST',
        '/api/flags/invalid_test',
        testEnv.adminToken,
        { invalid: 'configuration' }
      )

      // Should accept any configuration (our system is flexible)
      // But let's test with completely invalid JSON
      const invalidResponse = await testEnv.mf.dispatchFetch('http://localhost/api/flags/invalid_test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testEnv.adminToken}`,
          'Content-Type': 'application/json'
        },
        body: 'invalid json'
      })

      expect(invalidResponse.status).toBe(500)
    })
  })

  describe('Environment Isolation', () => {
    it('should isolate flags by environment', async () => {
      const flagName = 'env_isolation_test'
      testFlags.push(flagName)

      // Create flag in integration-test environment
      await flagService.setFlag(flagName, createTestFlag())
      await waitForKVPropagation()

      // Verify flag exists in integration-test environment
      const integrationResult = await flagService.isEnabled(flagName)
      expect(integrationResult).toBe(true)

      // Create a different flag service for 'dev' environment
      const devFlagService = new FeatureFlagService(testEnv.env.FEATURE_FLAGS, 'dev')
      
      // Flag should not exist in dev environment
      const devResult = await devFlagService.isEnabled(flagName, undefined, false)
      expect(devResult).toBe(false)

      // Verify KV keys are properly namespaced
      const integrationKey = `feature:integration-test:${flagName}`
      const devKey = `feature:dev:${flagName}`
      
      const integrationValue = await testEnv.env.FEATURE_FLAGS.get(integrationKey)
      const devValue = await testEnv.env.FEATURE_FLAGS.get(devKey)
      
      expect(integrationValue).toBeTruthy()
      expect(devValue).toBeNull()
    })
  })
})
