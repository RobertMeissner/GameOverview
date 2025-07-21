/**
 * UUID v4 generator using Web Crypto API
 * Generates cryptographically secure random UUIDs
 */
export function generateUUID(): string {
  // Use crypto.randomUUID if available (modern browsers/workers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // Fallback implementation using crypto.getRandomValues
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)

  // Set version (4) and variant bits
  array[6] = (array[6] & 0x0f) | 0x40 // Version 4
  array[8] = (array[8] & 0x3f) | 0x80 // Variant 10

  // Convert to hex string with hyphens
  const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32)
  ].join('-')
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Generate a deterministic UUID for migration purposes
 * This is used only for migrating existing integer IDs to UUIDs
 */
export function generateDeterministicUUID(seed: number): string {
  // Create a deterministic UUID based on a seed
  // This is NOT cryptographically secure and should only be used for migration
  const hex = seed.toString(16).padStart(8, '0')
  return `550e8400-e29b-41d4-a716-${hex.padStart(12, '4')}`
}
