import { describe, it, expect, beforeEach, vi } from 'vitest'
import {authApp} from './auth.js'
import type { Env } from '../types'

// Mock environment for testing
const createMockEnv = (): Env => {
  const mockDB = {
    prepare: vi.fn().mockReturnThis(),
    bind: vi.fn().mockReturnThis(),
    run: vi.fn(),
    first: vi.fn(),
  }

  return {
    JWT_SECRET: 'test-secret-key-for-testing',
    DB: mockDB as unknown as D1Database,
    ASSETS: {} as Fetcher,
    ENVIRONMENT: 'test'
  }
}

const createMockExecutionContext = (): ExecutionContext => ({
  waitUntil: vi.fn(),
  passThroughOnException: vi.fn(),
  props: {},
})

describe('Authentication Routes', () => {
  let mockEnv: Env
  let mockCtx: ExecutionContext

  beforeEach(() => {
    mockEnv = createMockEnv()
    mockCtx = createMockExecutionContext()
    vi.clearAllMocks()
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const requestBody = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      }

      ;(mockEnv.DB as any).run.mockResolvedValue({
        meta: { last_row_id: 1 }
      })

      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const response = await authApp.fetch(request, mockEnv, mockCtx)

      if (response !== null) {
        expect(response.status).toBe(201)

        const responseData = await response.json() as any
        expect(responseData.success).toBe(true)
        expect(responseData.user.email).toBe(requestBody.email)
        expect(responseData.user.username).toBe(requestBody.username)
        expect(responseData.token).toBeDefined()

        // Check Set-Cookie header
        const setCookieHeader = response.headers.get('Set-Cookie')
        expect(setCookieHeader).toContain('auth_token=')
        expect(setCookieHeader).toContain('HttpOnly')
        expect(setCookieHeader).toContain('Secure')
      }
    })

    it('should reject registration with missing fields', async () => {
      const requestBody = {
        email: 'test@example.com',
        // missing username and password
      }

      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const response = await authApp.fetch(request, mockEnv, mockCtx)
      expect(response).not.toBeNull()

      if (response !== null) {
        expect(response.status).toBe(400)

        const responseData = await response.json() as any
        expect(responseData.error).toContain('Email, username, and password are required')
      }
    })

    it('should reject registration with invalid email', async () => {
      const requestBody = {
        email: 'invalid-email',
        username: 'testuser',
        password: 'password123'
      }

      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const response = await authApp.fetch(request, mockEnv, mockCtx)
      expect(response).not.toBeNull()

      if (response !== null) {
        expect(response.status).toBe(400)

        const responseData = await response.json() as any
        expect(responseData.error).toContain('Invalid email format')
      }
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully and clear cookie', async () => {
      const request = new Request('http://localhost/api/auth/logout', {
        method: 'POST'
      })

      const response = await authApp.fetch(request, mockEnv, mockCtx)
      expect(response).not.toBeNull()

      if (response !== null) {
        expect(response.status).toBe(200)

        const responseData = await response.json() as any
        expect(responseData.success).toBe(true)
        expect(responseData.message).toBe('Logged out successfully')

        const setCookieHeader = response.headers.get('Set-Cookie')
        expect(setCookieHeader).toContain('auth_token=;')
        expect(setCookieHeader).toContain('Max-Age=0')
      }
    })
  })

  describe('GET /api/auth/me', () => {
    it('should reject request without token', async () => {
      const request = new Request('http://localhost/api/auth/me', {
        method: 'GET'
      })

      const response = await authApp.fetch(request, mockEnv, mockCtx)
      expect(response).not.toBeNull()

      if (response !== null) {
        expect(response.status).toBe(401)

        const responseData = await response.json() as any
        expect(responseData.error).toBe('No authentication token provided')
      }
    })
  })


})
