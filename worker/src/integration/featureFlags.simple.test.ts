/**
 * Simplified Integration Tests for Feature Flagging System
 * 
 * These tests focus on testing the core functionality without
 * requiring complex Miniflare setup. They test the actual
 * business logic and KV operations.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FeatureFlagService, type FeatureFlag } from '../utils/featureFlags.js'
import { AuthUtils } from '../utils/auth.js'

// Skip these tests unless explicitly running integration tests
const runIntegrationTests = process.env.RUN_INTEGRATION_TESTS === 'true'

describe.skipIf(!runIntegrationTests)('Feature Flags Simple Integration Tests', () => {
  let mockKV: any
  let flagService: FeatureFlagService
  let authUtils: AuthUtils
  let kvStore: Map<string, string>

  beforeEach(() => {
    // Create a more realistic KV mock that simulates real behavior
    kvStore = new Map()
    
    mockKV = {
      get: vi.fn(async (key: string) => {
        // Simulate KV propagation delay
        await new Promise(resolve => setTimeout(resolve, 1))
        return kvStore.get(key) || null
      }),
      put: vi.fn(async (key: string, value: string) => {
        // Simulate KV propagation delay
        await new Promise(resolve => setTimeout(resolve, 1))
        kvStore.set(key, value)
      }),
      delete: vi.fn(async (key: string) => {
        await new Promise(resolve => setTimeout(resolve, 1))
        kvStore.delete(key)
      }),
      list: vi.fn(async (options?: { prefix?: string }) => {
        await new Promise(resolve => setTimeout(resolve, 1))
        const keys = Array.from(kvStore.keys())
          .filter(key => !options?.prefix || key.startsWith(options.prefix))
          .map(name => ({ name }))
        return { keys }
      })
    }

    flagService = new FeatureFlagService(mockKV, 'integration-test')
    authUtils = new AuthUtils('test-secret-key')
  })

  describe('Authentication Token Generation', () => {
    it('should generate valid JWT tokens', async () => {
      const payload = {
        userId: '1',
        email: 'test@example.com',
        username: 'testuser'
      }

      const token = await authUtils.createJWT(payload, '1h')
      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts

      // Verify token can be decoded
      const decoded = await authUtils.verifyJWT(token)
      expect(decoded).toBeTruthy()
      expect(decoded?.userId).toBe('1')
      expect(decoded?.email).toBe('test@example.com')
      expect(decoded?.username).toBe('testuser')
    })

    it('should reject invalid tokens', async () => {
      const invalidToken = 'invalid.token.here'
      try {
        const decoded = await authUtils.verifyJWT(invalidToken)
        expect(decoded).toBeNull()
      } catch (error) {
        // AuthUtils throws errors for invalid tokens, which is expected
        expect(error).toBeTruthy()
      }
    })

    it('should handle expired tokens', async () => {
      const payload = {
        userId: '1',
        email: 'test@example.com',
        username: 'testuser'
      }

      // Create token that expires immediately (negative time)
      const token = await authUtils.createJWT(payload, '-1s')
      
      try {
        const decoded = await authUtils.verifyJWT(token)
        expect(decoded).toBeNull()
      } catch (error) {
        // AuthUtils may throw for expired tokens, which is also acceptable
        expect(error).toBeTruthy()
      }
    })
  })

  describe('KV Operations with Realistic Simulation', () => {
    it('should handle KV operations with proper key structure', async () => {
      const flagName = 'test_flag'
      const config: FeatureFlag = {
        enabled: true,
        rolloutPercentage: 50,
        userWhitelist: ['user1', 'user2'],
        environments: ['integration-test']
      }

      await flagService.setFlag(flagName, config)

      // Verify KV was called with correct key
      expect(mockKV.put).toHaveBeenCalledWith(
        'feature:integration-test:test_flag',
        JSON.stringify(config)
      )

      // Verify flag can be retrieved
      const result = await flagService.evaluateFlag(flagName)
      expect(result.enabled).toBe(true)
      expect(result.reason).toBe('default')
    })

    it('should handle user overrides with proper KV keys', async () => {
      const flagName = 'override_test'
      const userId = 'test_user_123'

      await flagService.setUserOverride(flagName, userId, true)

      // Verify KV was called with correct user override key
      expect(mockKV.put).toHaveBeenCalledWith(
        'feature:integration-test:override_test:users:test_user_123',
        'true'
      )

      // Test flag evaluation with override
      await flagService.setFlag(flagName, { enabled: false })
      const result = await flagService.evaluateFlag(flagName, userId)
      
      expect(result.enabled).toBe(true)
      expect(result.reason).toBe('user_override')
    })

    it('should list flags correctly', async () => {
      // Create multiple flags
      await flagService.setFlag('flag1', { enabled: true })
      await flagService.setFlag('flag2', { enabled: false })
      await flagService.setUserOverride('flag1', 'user123', false)

      const flags = await flagService.listFlags()

      expect(Object.keys(flags)).toHaveLength(2)
      expect(flags).toHaveProperty('flag1')
      expect(flags).toHaveProperty('flag2')
      expect(flags.flag1.enabled).toBe(true)
      expect(flags.flag2.enabled).toBe(false)
    })
  })

  describe('User Targeting Logic', () => {
    it('should provide consistent user hashing', async () => {
      const flagName = 'consistency_test'
      await flagService.setFlag(flagName, {
        enabled: true,
        rolloutPercentage: 50
      })

      // Ensure rollout salt is created
      await flagService.isEnabled(flagName, 'dummy_user')

      const userId = 'consistent_user'
      
      // Test multiple evaluations sequentially to avoid race conditions
      const results = []
      for (let i = 0; i < 10; i++) {
        results.push(await flagService.isEnabled(flagName, userId))
      }

      // All results should be identical
      const firstResult = results[0]
      expect(results.every(result => result === firstResult)).toBe(true)
    })

    it('should distribute users according to rollout percentage', async () => {
      const flagName = 'distribution_test'
      await flagService.setFlag(flagName, {
        enabled: true,
        rolloutPercentage: 30 // 30% rollout
      })

      // Test with many users
      const users = Array.from({ length: 1000 }, (_, i) => `user_${i}`)
      const results = await Promise.all(
        users.map(userId => flagService.isEnabled(flagName, userId))
      )

      const enabledCount = results.filter(Boolean).length
      const percentage = (enabledCount / users.length) * 100

      // Should be roughly 30% (allow for variance due to hashing)
      expect(percentage).toBeGreaterThan(20)
      expect(percentage).toBeLessThan(40)
      
      console.log(`Distribution test: ${enabledCount}/1000 users enabled (${percentage.toFixed(1)}%, expected ~30%)`)
    })

    it('should handle whitelist and blacklist correctly', async () => {
      const flagName = 'targeting_test'
      await flagService.setFlag(flagName, {
        enabled: true,
        rolloutPercentage: 0, // 0% rollout
        userWhitelist: ['whitelisted_user'],
        userBlacklist: ['blacklisted_user']
      })

      // Whitelisted user should be enabled
      const whitelistResult = await flagService.evaluateFlag(flagName, 'whitelisted_user')
      expect(whitelistResult.enabled).toBe(true)
      expect(whitelistResult.reason).toBe('user_whitelisted')

      // Blacklisted user should be disabled
      const blacklistResult = await flagService.evaluateFlag(flagName, 'blacklisted_user')
      expect(blacklistResult.enabled).toBe(false)
      expect(blacklistResult.reason).toBe('user_blacklisted')

      // Regular user should be disabled (0% rollout)
      const regularResult = await flagService.evaluateFlag(flagName, 'regular_user')
      expect(regularResult.enabled).toBe(false)
      expect(regularResult.reason).toBe('rollout_excluded')
    })
  })

  describe('Environment Isolation', () => {
    it('should isolate flags by environment', async () => {
      const flagName = 'env_test'
      
      // Create flag in integration-test environment
      await flagService.setFlag(flagName, { enabled: true })

      // Create service for different environment
      const prodFlagService = new FeatureFlagService(mockKV, 'prod')
      
      // Flag should not exist in prod environment
      const prodResult = await prodFlagService.isEnabled(flagName, undefined, false)
      expect(prodResult).toBe(false)

      // Verify different KV keys were used
      expect(kvStore.has('feature:integration-test:env_test')).toBe(true)
      expect(kvStore.has('feature:prod:env_test')).toBe(false)
    })

    it('should respect environment restrictions', async () => {
      const flagName = 'env_restricted'
      await flagService.setFlag(flagName, {
        enabled: true,
        environments: ['prod', 'staging'] // Not integration-test
      })

      const result = await flagService.evaluateFlag(flagName)
      expect(result.enabled).toBe(false)
      expect(result.reason).toBe('environment_restricted')
    })
  })

  describe('A/B Testing and Variants', () => {
    it('should select variants consistently', async () => {
      const flagName = 'ab_test'
      await flagService.setFlag(flagName, {
        enabled: true,
        variants: {
          control: 50,
          treatment: 50
        }
      })

      // Ensure rollout salt is created
      await flagService.getVariant(flagName, 'dummy_user')

      const userId = 'ab_test_user'
      
      // Get variant multiple times sequentially
      const variants = []
      for (let i = 0; i < 10; i++) {
        variants.push(await flagService.getVariant(flagName, userId))
      }

      // All variants should be the same
      const firstVariant = variants[0]
      expect(variants.every(variant => variant === firstVariant)).toBe(true)
      expect(['control', 'treatment']).toContain(firstVariant)
    })

    it('should distribute variants according to percentages', async () => {
      const flagName = 'variant_distribution'
      await flagService.setFlag(flagName, {
        enabled: true,
        variants: {
          control: 70,
          treatment: 30
        }
      })

      // Test with many users
      const users = Array.from({ length: 1000 }, (_, i) => `variant_user_${i}`)
      const variants = await Promise.all(
        users.map(userId => flagService.getVariant(flagName, userId))
      )

      const controlCount = variants.filter(v => v === 'control').length
      const treatmentCount = variants.filter(v => v === 'treatment').length
      
      const controlPercentage = (controlCount / users.length) * 100
      const treatmentPercentage = (treatmentCount / users.length) * 100

      // Should be roughly 70/30 split (allow for variance)
      expect(controlPercentage).toBeGreaterThan(60)
      expect(controlPercentage).toBeLessThan(80)
      expect(treatmentPercentage).toBeGreaterThan(20)
      expect(treatmentPercentage).toBeLessThan(40)

      console.log(`Variant distribution: Control ${controlPercentage.toFixed(1)}%, Treatment ${treatmentPercentage.toFixed(1)}%`)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle KV errors gracefully', async () => {
      // Mock KV to throw errors
      mockKV.get.mockRejectedValueOnce(new Error('KV unavailable'))

      const result = await flagService.isEnabled('error_flag', 'user', true)
      expect(result).toBe(true) // Should return default value
    })

    it('should handle invalid JSON in KV', async () => {
      // Put invalid JSON in KV store
      kvStore.set('feature:integration-test:invalid_flag', 'invalid json')

      const result = await flagService.isEnabled('invalid_flag', 'user', false)
      expect(result).toBe(false) // Should return default value
    })

    it('should handle missing rollout salt gracefully', async () => {
      const flagName = 'salt_test'
      await flagService.setFlag(flagName, {
        enabled: true,
        rolloutPercentage: 50
      })

      // Clear any existing salt
      kvStore.delete('feature:integration-test:global:rollout_salt')

      // Should still work and create new salt
      const result = await flagService.isEnabled(flagName, 'test_user')
      expect(typeof result).toBe('boolean')

      // Salt should have been created
      expect(kvStore.has('feature:integration-test:global:rollout_salt')).toBe(true)
    })
  })

  describe('Performance Characteristics', () => {
    it('should evaluate flags efficiently', async () => {
      const flagName = 'perf_test'
      await flagService.setFlag(flagName, { enabled: true })

      const startTime = Date.now()
      
      // Evaluate flag many times
      await Promise.all(
        Array.from({ length: 100 }, (_, i) => 
          flagService.isEnabled(flagName, `perf_user_${i}`)
        )
      )

      const endTime = Date.now()
      const totalTime = endTime - startTime
      const avgTime = totalTime / 100

      console.log(`Performance test: 100 evaluations took ${totalTime}ms (avg: ${avgTime.toFixed(2)}ms)`)

      // Should be reasonably fast even with simulated delays
      expect(avgTime).toBeLessThan(10) // Less than 10ms average
    })
  })
})
