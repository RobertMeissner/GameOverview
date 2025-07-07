import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthUtils, UserService } from './auth.js'
import type { UserWithPassword } from '../types/index.js'

describe('AuthUtils', () => {
  let authUtils: AuthUtils
  const testSecret = 'test-secret-key'

  beforeEach(() => {
    authUtils = new AuthUtils(testSecret)
  })

  describe('Password Hashing', () => {
    it('should hash passwords consistently', async () => {
      const password = 'testPassword123'
      const hash1 = await authUtils.hashPassword(password)
      const hash2 = await authUtils.hashPassword(password)
      
      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(64) // SHA-256 produces 64 character hex string
    })

    it('should produce different hashes for different passwords', async () => {
      const password1 = 'password1'
      const password2 = 'password2'
      
      const hash1 = await authUtils.hashPassword(password1)
      const hash2 = await authUtils.hashPassword(password2)
      
      expect(hash1).not.toBe(hash2)
    })

    it('should verify correct passwords', async () => {
      const password = 'testPassword123'
      const hash = await authUtils.hashPassword(password)
      
      const isValid = await authUtils.verifyPassword(password, hash)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect passwords', async () => {
      const password = 'testPassword123'
      const wrongPassword = 'wrongPassword'
      const hash = await authUtils.hashPassword(password)
      
      const isValid = await authUtils.verifyPassword(wrongPassword, hash)
      expect(isValid).toBe(false)
    })
  })

  describe('JWT Token Management', () => {
    it('should create valid JWT tokens', async () => {
      const payload = {
        userId: 1,
        email: 'test@example.com',
        username: 'testuser'
      }
      
      const token = await authUtils.createJWT(payload)
      expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)
    })

    it('should verify valid JWT tokens', async () => {
      const payload = {
        userId: 1,
        email: 'test@example.com',
        username: 'testuser'
      }
      
      const token = await authUtils.createJWT(payload)
      const decoded = await authUtils.verifyJWT(token)
      
      expect(decoded.userId).toBe(payload.userId)
      expect(decoded.email).toBe(payload.email)
      expect(decoded.username).toBe(payload.username)
      expect(decoded.iat).toBeDefined()
      expect(decoded.exp).toBeDefined()
    })

    it('should reject invalid JWT tokens', async () => {
      const invalidToken = 'invalid.token.here'
      
      await expect(authUtils.verifyJWT(invalidToken)).rejects.toThrow()
    })

    it('should reject expired JWT tokens', async () => {
      const payload = {
        userId: 1,
        email: 'test@example.com',
        username: 'testuser'
      }
      
      // Mock Date.now to control time
      const originalNow = Date.now
      const baseTime = 1000000000000 // Fixed timestamp
      
      // Create token at base time
      vi.spyOn(Date, 'now').mockReturnValue(baseTime)
      const token = await authUtils.createJWT(payload, '1s')
      
      // Move time forward past expiration (1 second + buffer)
      vi.spyOn(Date, 'now').mockReturnValue(baseTime + 2000)
      
      await expect(authUtils.verifyJWT(token)).rejects.toThrow()
      
      // Restore original Date.now
      Date.now = originalNow
    })

    it('should handle different expiration formats', async () => {
      const payload = {
        userId: 1,
        email: 'test@example.com',
        username: 'testuser'
      }
      
      // Test different expiration formats
      const token1h = await authUtils.createJWT(payload, '1h')
      const token60m = await authUtils.createJWT(payload, '60m')
      const token3600s = await authUtils.createJWT(payload, '3600s')
      
      const decoded1h = await authUtils.verifyJWT(token1h)
      const decoded60m = await authUtils.verifyJWT(token60m)
      const decoded3600s = await authUtils.verifyJWT(token3600s)
      
      // All should have similar expiration times (within 1 second)
      expect(Math.abs(decoded1h.exp - decoded60m.exp)).toBeLessThan(1)
      expect(Math.abs(decoded60m.exp - decoded3600s.exp)).toBeLessThan(1)
    })
  })

  describe('Token Extraction', () => {
    it('should extract token from Authorization header', () => {
      const token = 'test-token-123'
      const authHeader = `Bearer ${token}`
      
      const extracted = authUtils.extractTokenFromHeader(authHeader)
      expect(extracted).toBe(token)
    })

    it('should return null for invalid Authorization header', () => {
      expect(authUtils.extractTokenFromHeader(null)).toBeNull()
      expect(authUtils.extractTokenFromHeader('Invalid header')).toBeNull()
      expect(authUtils.extractTokenFromHeader('Basic token123')).toBeNull()
    })

    it('should extract token from cookie header', () => {
      const token = 'test-token-123'
      const cookieHeader = `auth_token=${token}; other_cookie=value`
      
      const extracted = authUtils.extractTokenFromCookie(cookieHeader)
      expect(extracted).toBe(token)
    })

    it('should extract token from cookie with custom name', () => {
      const token = 'test-token-123'
      const cookieHeader = `custom_token=${token}; other_cookie=value`
      
      const extracted = authUtils.extractTokenFromCookie(cookieHeader, 'custom_token')
      expect(extracted).toBe(token)
    })

    it('should return null for missing cookie', () => {
      const cookieHeader = 'other_cookie=value; another=test'
      
      const extracted = authUtils.extractTokenFromCookie(cookieHeader)
      expect(extracted).toBeNull()
    })

    it('should return null for null cookie header', () => {
      const extracted = authUtils.extractTokenFromCookie(null)
      expect(extracted).toBeNull()
    })
  })
})

describe('UserService', () => {
  let userService: UserService
  let authUtils: AuthUtils
  let mockDb: any

  beforeEach(() => {
    authUtils = new AuthUtils('test-secret')
    
    // Mock D1 database
    mockDb = {
      prepare: vi.fn().mockReturnThis(),
      bind: vi.fn().mockReturnThis(),
      run: vi.fn(),
      first: vi.fn(),
    }
    
    userService = new UserService(mockDb)
  })

  describe('User Creation', () => {
    it('should create a new user successfully', async () => {
      const email = 'test@example.com'
      const username = 'testuser'
      const password = 'password123'
      
      mockDb.run.mockResolvedValue({
        meta: { last_row_id: 1 }
      })
      
      const user = await userService.createUser(email, username, password, authUtils)
      
      expect(user).toEqual({
        id: 1,
        email,
        username,
        created_at: expect.any(String)
      })
      
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO users'))
      expect(mockDb.bind).toHaveBeenCalledWith(email, username, expect.any(String))
    })

    it('should throw error for duplicate email/username', async () => {
      const email = 'test@example.com'
      const username = 'testuser'
      const password = 'password123'
      
      mockDb.run.mockRejectedValue(new Error('UNIQUE constraint failed'))
      
      await expect(userService.createUser(email, username, password, authUtils))
        .rejects.toThrow('Email or username already exists')
    })
  })

  describe('User Lookup', () => {
    const mockUser: UserWithPassword = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      password_hash: 'hashed_password',
      created_at: '2023-01-01T00:00:00Z'
    }

    it('should find user by email', async () => {
      mockDb.first.mockResolvedValue(mockUser)
      
      const user = await userService.findUserByEmail('test@example.com')
      
      expect(user).toEqual(mockUser)
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE email = ?'))
    })

    it('should find user by username', async () => {
      mockDb.first.mockResolvedValue(mockUser)
      
      const user = await userService.findUserByUsername('testuser')
      
      expect(user).toEqual(mockUser)
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE username = ?'))
    })

    it('should find user by ID', async () => {
      const userWithoutPassword = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        created_at: '2023-01-01T00:00:00Z'
      }
      
      mockDb.first.mockResolvedValue(userWithoutPassword)
      
      const user = await userService.findUserById(1)
      
      expect(user).toEqual(userWithoutPassword)
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE id = ?'))
    })

    it('should return null for non-existent user', async () => {
      mockDb.first.mockResolvedValue(null)
      
      const user = await userService.findUserByEmail('nonexistent@example.com')
      
      expect(user).toBeNull()
    })
  })

  describe('User Authentication', () => {
    const mockUser: UserWithPassword = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      password_hash: '',
      created_at: '2023-01-01T00:00:00Z'
    }

    beforeEach(async () => {
      // Set up a real password hash for testing
      mockUser.password_hash = await authUtils.hashPassword('password123')
    })

    it('should authenticate user with email and correct password', async () => {
      mockDb.first.mockResolvedValueOnce(mockUser).mockResolvedValueOnce(null)
      
      const user = await userService.authenticateUser('test@example.com', 'password123', authUtils)
      
      expect(user).toEqual({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        created_at: '2023-01-01T00:00:00Z'
      })
    })

    it('should authenticate user with username and correct password', async () => {
      mockDb.first.mockResolvedValueOnce(null).mockResolvedValueOnce(mockUser)
      
      const user = await userService.authenticateUser('testuser', 'password123', authUtils)
      
      expect(user).toEqual({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        created_at: '2023-01-01T00:00:00Z'
      })
    })

    it('should throw error for non-existent user', async () => {
      mockDb.first.mockResolvedValue(null)
      
      await expect(userService.authenticateUser('nonexistent@example.com', 'password123', authUtils))
        .rejects.toThrow('User not found')
    })

    it('should throw error for incorrect password', async () => {
      mockDb.first.mockResolvedValueOnce(mockUser).mockResolvedValueOnce(null)
      
      await expect(userService.authenticateUser('test@example.com', 'wrongpassword', authUtils))
        .rejects.toThrow('Invalid password')
    })
  })
})
