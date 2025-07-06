import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FeatureFlagService, type FeatureFlag } from './featureFlags.js'

// Mock KV namespace
const createMockKV = () => {
  const store = new Map<string, string>()
  
  return {
    get: vi.fn(async (key: string) => store.get(key) || null),
    put: vi.fn(async (key: string, value: string) => {
      store.set(key, value)
    }),
    delete: vi.fn(async (key: string) => {
      store.delete(key)
    }),
    list: vi.fn(async (options?: { prefix?: string }) => {
      const keys = Array.from(store.keys())
        .filter(key => !options?.prefix || key.startsWith(options.prefix))
        .map(name => ({ name }))
      return { keys }
    }),
    clear: () => store.clear(),
    getStore: () => store
  }
}

describe('FeatureFlagService', () => {
  let mockKV: ReturnType<typeof createMockKV>
  let flagService: FeatureFlagService

  beforeEach(() => {
    mockKV = createMockKV()
    flagService = new FeatureFlagService(mockKV as any, 'test')
  })

  describe('Basic flag operations', () => {
    it('should return default value for non-existent flag', async () => {
      const result = await flagService.isEnabled('non_existent', undefined, false)
      expect(result).toBe(false)
    })

    it('should return default value when flag is not found', async () => {
      const result = await flagService.isEnabled('missing_flag', undefined, true)
      expect(result).toBe(true)
    })

    it('should enable and disable flags', async () => {
      await flagService.enableFlag('test_flag')
      expect(await flagService.isEnabled('test_flag')).toBe(true)

      await flagService.disableFlag('test_flag')
      expect(await flagService.isEnabled('test_flag')).toBe(false)
    })

    it('should set flag configuration', async () => {
      const config: FeatureFlag = {
        enabled: true,
        rolloutPercentage: 50,
        userWhitelist: ['user1', 'user2']
      }

      await flagService.setFlag('complex_flag', config)
      
      // Verify the flag was stored correctly
      const storedValue = mockKV.getStore().get('feature:test:complex_flag')
      expect(storedValue).toBeDefined()
      expect(JSON.parse(storedValue!)).toEqual(config)
    })
  })

  describe('User targeting', () => {
    beforeEach(async () => {
      const config: FeatureFlag = {
        enabled: true,
        rolloutPercentage: 50,
        userWhitelist: ['whitelisted_user'],
        userBlacklist: ['blacklisted_user']
      }
      await flagService.setFlag('targeting_flag', config)
    })

    it('should enable flag for whitelisted users', async () => {
      const result = await flagService.isEnabled('targeting_flag', 'whitelisted_user')
      expect(result).toBe(true)
    })

    it('should disable flag for blacklisted users', async () => {
      const result = await flagService.isEnabled('targeting_flag', 'blacklisted_user')
      expect(result).toBe(false)
    })

    it('should respect user overrides', async () => {
      await flagService.setUserOverride('targeting_flag', 'test_user', true)
      const result = await flagService.isEnabled('targeting_flag', 'test_user')
      expect(result).toBe(true)

      await flagService.setUserOverride('targeting_flag', 'test_user', false)
      const result2 = await flagService.isEnabled('targeting_flag', 'test_user')
      expect(result2).toBe(false)
    })

    it('should remove user overrides', async () => {
      await flagService.setUserOverride('targeting_flag', 'test_user', true)
      expect(await flagService.isEnabled('targeting_flag', 'test_user')).toBe(true)

      await flagService.removeUserOverride('targeting_flag', 'test_user')
      // Should now fall back to normal flag evaluation
      const result = await flagService.isEnabled('targeting_flag', 'test_user')
      expect(typeof result).toBe('boolean')
    })
  })

  describe('Rollout percentage', () => {
    it('should handle rollout percentage consistently', async () => {
      const config: FeatureFlag = {
        enabled: true,
        rolloutPercentage: 50
      }
      await flagService.setFlag('rollout_flag', config)

      // Test the same user multiple times - should be consistent
      const userId = 'consistent_user'
      const result1 = await flagService.isEnabled('rollout_flag', userId)
      const result2 = await flagService.isEnabled('rollout_flag', userId)
      const result3 = await flagService.isEnabled('rollout_flag', userId)

      expect(result1).toBe(result2)
      expect(result2).toBe(result3)
    })

    it('should handle 0% rollout', async () => {
      const config: FeatureFlag = {
        enabled: true,
        rolloutPercentage: 0
      }
      await flagService.setFlag('zero_rollout', config)

      const result = await flagService.isEnabled('zero_rollout', 'any_user')
      expect(result).toBe(false)
    })

    it('should handle 100% rollout', async () => {
      const config: FeatureFlag = {
        enabled: true,
        rolloutPercentage: 100
      }
      await flagService.setFlag('full_rollout', config)

      const result = await flagService.isEnabled('full_rollout', 'any_user')
      expect(result).toBe(true)
    })
  })

  describe('Environment restrictions', () => {
    it('should respect environment restrictions', async () => {
      const config: FeatureFlag = {
        enabled: true,
        environments: ['prod', 'staging']
      }
      await flagService.setFlag('env_restricted', config)

      // Should be disabled in 'test' environment
      const result = await flagService.isEnabled('env_restricted')
      expect(result).toBe(false)
    })

    it('should enable flag in allowed environments', async () => {
      const prodFlagService = new FeatureFlagService(mockKV as any, 'prod')
      
      const config: FeatureFlag = {
        enabled: true,
        environments: ['prod', 'staging']
      }
      await prodFlagService.setFlag('env_allowed', config)

      const result = await prodFlagService.isEnabled('env_allowed')
      expect(result).toBe(true)
    })
  })

  describe('Variants', () => {
    it('should return default variant when no variants configured', async () => {
      const config: FeatureFlag = {
        enabled: true,
        variant: 'custom_default'
      }
      await flagService.setFlag('simple_variant', config)

      const variant = await flagService.getVariant('simple_variant')
      expect(variant).toBe('custom_default')
    })

    it('should select variants based on configuration', async () => {
      const config: FeatureFlag = {
        enabled: true,
        variants: {
          'control': 50,
          'treatment': 50
        }
      }
      await flagService.setFlag('ab_test', config)

      const variant = await flagService.getVariant('ab_test', 'test_user')
      expect(['control', 'treatment']).toContain(variant)
    })

    it('should return consistent variants for same user', async () => {
      const config: FeatureFlag = {
        enabled: true,
        variants: {
          'control': 50,
          'treatment': 50
        }
      }
      await flagService.setFlag('consistent_variant', config)

      const userId = 'consistent_user'
      const variant1 = await flagService.getVariant('consistent_variant', userId)
      const variant2 = await flagService.getVariant('consistent_variant', userId)
      const variant3 = await flagService.getVariant('consistent_variant', userId)

      expect(variant1).toBe(variant2)
      expect(variant2).toBe(variant3)
    })
  })

  describe('Flag evaluation details', () => {
    it('should provide detailed evaluation results', async () => {
      const config: FeatureFlag = {
        enabled: true,
        rolloutPercentage: 50
      }
      await flagService.setFlag('detailed_flag', config)

      const result = await flagService.evaluateFlag('detailed_flag', 'test_user')
      
      expect(result).toHaveProperty('enabled')
      expect(result).toHaveProperty('variant')
      expect(result).toHaveProperty('reason')
      expect(typeof result.enabled).toBe('boolean')
      expect(typeof result.variant).toBe('string')
      expect(typeof result.reason).toBe('string')
    })

    it('should provide correct reasons for different scenarios', async () => {
      // Flag not found
      const notFound = await flagService.evaluateFlag('missing_flag')
      expect(notFound.reason).toBe('flag_not_found')

      // Flag disabled
      await flagService.setFlag('disabled_flag', { enabled: false })
      const disabled = await flagService.evaluateFlag('disabled_flag')
      expect(disabled.reason).toBe('flag_disabled')

      // User override
      await flagService.setFlag('override_flag', { enabled: true })
      await flagService.setUserOverride('override_flag', 'test_user', false)
      const override = await flagService.evaluateFlag('override_flag', 'test_user')
      expect(override.reason).toBe('user_override')
    })
  })

  describe('Flag listing', () => {
    it('should list all flags for environment', async () => {
      await flagService.setFlag('flag1', { enabled: true })
      await flagService.setFlag('flag2', { enabled: false })
      await flagService.setFlag('flag3', { enabled: true, rolloutPercentage: 25 })

      const flags = await flagService.listFlags()
      
      expect(Object.keys(flags)).toHaveLength(3)
      expect(flags).toHaveProperty('flag1')
      expect(flags).toHaveProperty('flag2')
      expect(flags).toHaveProperty('flag3')
      expect(flags.flag1.enabled).toBe(true)
      expect(flags.flag2.enabled).toBe(false)
      expect(flags.flag3.rolloutPercentage).toBe(25)
    })

    it('should not include user override keys in flag listing', async () => {
      await flagService.setFlag('main_flag', { enabled: true })
      await flagService.setUserOverride('main_flag', 'user1', false)
      
      const flags = await flagService.listFlags()
      
      expect(Object.keys(flags)).toHaveLength(1)
      expect(flags).toHaveProperty('main_flag')
    })
  })

  describe('Error handling', () => {
    it('should handle KV errors gracefully', async () => {
      // Mock KV to throw error
      mockKV.get.mockRejectedValueOnce(new Error('KV error'))
      
      const result = await flagService.isEnabled('error_flag', undefined, true)
      expect(result).toBe(true) // Should return default value
    })

    it('should handle invalid JSON in KV gracefully', async () => {
      // Put invalid JSON directly in store
      mockKV.getStore().set('feature:test:invalid_flag', 'invalid json')
      
      const result = await flagService.isEnabled('invalid_flag', undefined, false)
      expect(result).toBe(false) // Should return default value
    })
  })
})
