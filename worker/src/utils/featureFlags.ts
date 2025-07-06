import type { Env } from '../types/index.js'

/**
 * Feature flag configuration interface
 */
export interface FeatureFlag {
  enabled: boolean
  rolloutPercentage?: number
  userWhitelist?: string[]
  userBlacklist?: string[]
  environments?: string[]
  variant?: string
  variants?: Record<string, number> // variant name -> percentage
}

/**
 * Feature flag evaluation result
 */
export interface FlagResult {
  enabled: boolean
  variant: string
  reason: string
}

/**
 * Enhanced Cloudflare KV-based feature flagging system
 * Supports multi-environment deployment, gradual rollouts, and user targeting
 */
export class FeatureFlagService {
  private environment: string
  private rolloutSalt: string | null = null

  constructor(
    private kv: KVNamespace,
    environment: string = 'prod'
  ) {
    this.environment = environment
  }

  /**
   * Check if a feature flag is enabled for a user
   */
  async isEnabled(
    flagName: string,
    userId?: string,
    defaultValue: boolean = false
  ): Promise<boolean> {
    const result = await this.evaluateFlag(flagName, userId, defaultValue)
    return result.enabled
  }

  /**
   * Get the variant for a feature flag
   */
  async getVariant(
    flagName: string,
    userId?: string,
    defaultVariant: string = 'default'
  ): Promise<string> {
    const result = await this.evaluateFlag(flagName, userId, false, defaultVariant)
    return result.variant
  }

  /**
   * Get detailed flag evaluation result
   */
  async evaluateFlag(
    flagName: string,
    userId?: string,
    defaultValue: boolean = false,
    defaultVariant: string = 'default'
  ): Promise<FlagResult> {
    try {
      // Check for user-specific override first
      if (userId) {
        const userOverride = await this.getUserOverride(flagName, userId)
        if (userOverride !== null) {
          return {
            enabled: userOverride,
            variant: userOverride ? 'enabled' : 'disabled',
            reason: 'user_override'
          }
        }
      }

      // Get flag configuration
      const flag = await this.getFlag(flagName)
      if (!flag) {
        return {
          enabled: defaultValue,
          variant: defaultVariant,
          reason: 'flag_not_found'
        }
      }

      // Check environment restrictions
      if (flag.environments && !flag.environments.includes(this.environment)) {
        return {
          enabled: false,
          variant: 'disabled',
          reason: 'environment_restricted'
        }
      }

      // Check if flag is globally disabled
      if (!flag.enabled) {
        return {
          enabled: false,
          variant: 'disabled',
          reason: 'flag_disabled'
        }
      }

      // Check user blacklist
      if (userId && flag.userBlacklist?.includes(userId)) {
        return {
          enabled: false,
          variant: 'disabled',
          reason: 'user_blacklisted'
        }
      }

      // Check user whitelist
      if (userId && flag.userWhitelist?.includes(userId)) {
        const variant = await this.selectVariant(flag, userId)
        return {
          enabled: true,
          variant,
          reason: 'user_whitelisted'
        }
      }

      // Check rollout percentage
      if (userId && flag.rolloutPercentage !== undefined) {
        const userHash = await this.getUserHash(userId, flagName)
        const isInRollout = userHash < flag.rolloutPercentage
        
        if (isInRollout) {
          const variant = await this.selectVariant(flag, userId)
          return {
            enabled: true,
            variant,
            reason: 'rollout_percentage'
          }
        } else {
          return {
            enabled: false,
            variant: 'disabled',
            reason: 'rollout_excluded'
          }
        }
      }

      // Default to flag enabled state
      const variant = await this.selectVariant(flag, userId)
      return {
        enabled: flag.enabled,
        variant,
        reason: 'default'
      }

    } catch (error) {
      console.error(`Feature flag evaluation error for ${flagName}:`, error)
      return {
        enabled: defaultValue,
        variant: defaultVariant,
        reason: 'evaluation_error'
      }
    }
  }

  /**
   * Set a feature flag configuration
   */
  async setFlag(flagName: string, config: FeatureFlag): Promise<void> {
    const key = this.getFlagKey(flagName)
    await this.kv.put(key, JSON.stringify(config))
  }

  /**
   * Enable a feature flag
   */
  async enableFlag(flagName: string, rolloutPercentage?: number): Promise<void> {
    const existing = await this.getFlag(flagName) || { enabled: false }
    const updated: FeatureFlag = {
      ...existing,
      enabled: true,
      ...(rolloutPercentage !== undefined && { rolloutPercentage })
    }
    await this.setFlag(flagName, updated)
  }

  /**
   * Disable a feature flag
   */
  async disableFlag(flagName: string): Promise<void> {
    const existing = await this.getFlag(flagName) || { enabled: false }
    const updated: FeatureFlag = {
      ...existing,
      enabled: false
    }
    await this.setFlag(flagName, updated)
  }

  /**
   * Set user-specific override
   */
  async setUserOverride(flagName: string, userId: string, enabled: boolean): Promise<void> {
    const key = this.getUserOverrideKey(flagName, userId)
    await this.kv.put(key, enabled.toString())
  }

  /**
   * Remove user-specific override
   */
  async removeUserOverride(flagName: string, userId: string): Promise<void> {
    const key = this.getUserOverrideKey(flagName, userId)
    await this.kv.delete(key)
  }

  /**
   * List all flags for current environment
   */
  async listFlags(): Promise<Record<string, FeatureFlag>> {
    const prefix = `feature:${this.environment}:`
    const list = await this.kv.list({ prefix })
    const flags: Record<string, FeatureFlag> = {}

    for (const key of list.keys) {
      const flagName = key.name.replace(prefix, '')
      // Skip user override keys
      if (!flagName.includes(':users:')) {
        const flag = await this.getFlag(flagName)
        if (flag) {
          flags[flagName] = flag
        }
      }
    }

    return flags
  }

  /**
   * Get flag configuration from KV
   */
  private async getFlag(flagName: string): Promise<FeatureFlag | null> {
    try {
      const key = this.getFlagKey(flagName)
      const value = await this.kv.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error(`Error getting flag ${flagName}:`, error)
      return null
    }
  }

  /**
   * Get user-specific override
   */
  private async getUserOverride(flagName: string, userId: string): Promise<boolean | null> {
    try {
      const key = this.getUserOverrideKey(flagName, userId)
      const value = await this.kv.get(key)
      return value ? value === 'true' : null
    } catch (error) {
      console.error(`Error getting user override for ${flagName}:`, error)
      return null
    }
  }

  /**
   * Select variant based on flag configuration and user
   */
  private async selectVariant(flag: FeatureFlag, userId?: string): Promise<string> {
    // If no variants defined, return simple enabled/disabled
    if (!flag.variants || Object.keys(flag.variants).length === 0) {
      return flag.variant || (flag.enabled ? 'enabled' : 'disabled')
    }

    // If no user ID, return first variant or default
    if (!userId) {
      const firstVariant = Object.keys(flag.variants)[0]
      return firstVariant || 'default'
    }

    // Use consistent hashing to select variant
    const userHash = await this.getUserHash(userId, 'variant_selection')
    let cumulativePercentage = 0

    for (const [variant, percentage] of Object.entries(flag.variants)) {
      cumulativePercentage += percentage
      if (userHash < cumulativePercentage) {
        return variant
      }
    }

    // Fallback to first variant
    return Object.keys(flag.variants)[0] || 'default'
  }

  /**
   * Get consistent hash for user (0-99)
   */
  private async getUserHash(userId: string, context: string): Promise<number> {
    const salt = await this.getRolloutSalt()
    const input = `${userId}:${context}:${salt}`
    
    // Use Web Crypto API for consistent hashing
    const encoder = new TextEncoder()
    const data = encoder.encode(input)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = new Uint8Array(hashBuffer)
    
    // Convert first 4 bytes to number and mod 100
    const hash = (hashArray[0] << 24) | (hashArray[1] << 16) | (hashArray[2] << 8) | hashArray[3]
    return Math.abs(hash) % 100
  }

  /**
   * Get or create rollout salt for consistent hashing
   */
  private async getRolloutSalt(): Promise<string> {
    if (this.rolloutSalt) {
      return this.rolloutSalt
    }

    const key = `feature:${this.environment}:global:rollout_salt`
    let salt = await this.kv.get(key)
    
    if (!salt) {
      // Generate new salt
      salt = crypto.randomUUID()
      await this.kv.put(key, salt)
    }

    this.rolloutSalt = salt
    return salt
  }

  /**
   * Generate KV key for flag
   */
  private getFlagKey(flagName: string): string {
    return `feature:${this.environment}:${flagName}`
  }

  /**
   * Generate KV key for user override
   */
  private getUserOverrideKey(flagName: string, userId: string): string {
    return `feature:${this.environment}:${flagName}:users:${userId}`
  }
}

/**
 * Utility function to create feature flag service from environment
 */
export function createFeatureFlagService(env: Env): FeatureFlagService {
  const environment = env.ENVIRONMENT || 'prod'
  return new FeatureFlagService(env.FEATURE_FLAGS, environment)
}

/**
 * Feature flag middleware for protecting routes
 */
export async function requireFeatureFlag(
  flagName: string,
  flagService: FeatureFlagService,
  userId?: string
): Promise<boolean> {
  return await flagService.isEnabled(flagName, userId, false)
}
