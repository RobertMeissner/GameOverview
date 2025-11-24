/**
 * Integration Test Setup
 *
 * Provides utilities for setting up integration tests with real
 * Cloudflare Workers environment, authentication, and KV namespace.
 */

import { webcrypto } from 'node:crypto'
import { Miniflare } from 'miniflare'
import { AuthUtils } from '../utils/auth.js'
import type { Env } from '../types/index.js'

// Polyfill crypto global for Node.js test environment
if (!(globalThis as any).crypto) {
  (globalThis as any).crypto = webcrypto
}

export interface TestEnvironment {
  mf: Miniflare
  env: Env
  authToken: string
  adminToken: string
  cleanup: () => Promise<void>
}

/**
 * Create a test environment with Miniflare
 */
export async function createTestEnvironment(): Promise<TestEnvironment> {
  // Create Miniflare instance with test configuration
  const mf = new Miniflare({
    modules: true,
    scriptPath: 'test-worker.js',
    bindings: {
      JWT_SECRET: 'test-secret-key-for-integration-testing',
      ENVIRONMENT: 'integration-test'
    },
    d1Databases: {
      DB: 'test-database'
    },
    compatibilityDate: '2024-07-01',
    compatibilityFlags: ['nodejs_compat']
  })

  // Get environment bindings
  const env = await mf.getBindings<Env>()

  // Set up test database schema
  await setupTestDatabase(env.DB)

  // Create test users and get auth tokens
  const { authToken, adminToken } = await setupTestAuth(env)

  return {
    mf,
    env,
    authToken,
    adminToken,
    cleanup: async () => {
      await cleanupTestEnvironment(env)
      await mf.dispose()
    }
  }
}

/**
 * Set up test database with schema and test data
 */
async function setupTestDatabase(db: D1Database): Promise<void> {
  // Create users table
  await db.exec(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, username TEXT UNIQUE NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`)

  // Create games table
  await db.exec(`CREATE TABLE IF NOT EXISTS games (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, title TEXT NOT NULL, platform TEXT, status TEXT DEFAULT 'backlog', rating INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users (id))`)

  // Create indexes
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`)
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`)
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id)`)
}

/**
 * Set up test authentication and return tokens
 */
async function setupTestAuth(env: Env): Promise<{ authToken: string; adminToken: string }> {
  const authUtils = new AuthUtils(env.JWT_SECRET)

  // Create test user
  const testUserPassword = await authUtils.hashPassword('testpassword123')
  await env.DB.prepare(`
    INSERT OR REPLACE INTO users (id, email, username, password_hash)
    VALUES (1, 'test@example.com', 'testuser', ?)
  `).bind(testUserPassword).run()

  // Create admin user
  const adminPassword = await authUtils.hashPassword('adminpassword123')
  await env.DB.prepare(`
    INSERT OR REPLACE INTO users (id, email, username, password_hash)
    VALUES (2, 'admin@example.com', 'adminuser', ?)
  `).bind(adminPassword).run()

  // Generate JWT tokens
  const authToken = await authUtils.createJWT({
    userId: '1',
    email: 'test@example.com',
    username: 'testuser'
  }, '24h')

  const adminToken = await authUtils.createJWT({
    userId: '2',
    email: 'admin@example.com',
    username: 'adminuser'
  }, '24h')

  return { authToken, adminToken }
}

/**
 * Clean up test environment
 */
async function cleanupTestEnvironment(env: Env): Promise<void> {
  try {
    // Clear test data from database
    await env.DB.exec('DELETE FROM games WHERE user_id IN (1, 2)')
    await env.DB.exec('DELETE FROM users WHERE id IN (1, 2)')
  } catch (error) {
    console.warn('Cleanup warning:', error)
  }
}

/**
 * Make authenticated request to worker
 */
export async function makeAuthenticatedRequest(
  mf: Miniflare,
  method: string,
  path: string,
  token: string,
  body?: any
) {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }

  return await mf.dispatchFetch(`http://localhost${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })
}

/**
 * Assert response status and return JSON body
 */
export async function assertResponse(
  response: any,
  expectedStatus: number = 200
): Promise<any> {
  if (response.status !== expectedStatus) {
    const text = await response.text()
    throw new Error(`Expected status ${expectedStatus}, got ${response.status}: ${text}`)
  }

  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    return await response.json()
  }

  return await response.text()
}
