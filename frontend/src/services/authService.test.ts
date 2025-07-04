import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import axios from 'axios'
import AuthService from './authService'

// Mock axios
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
  },
  writable: true,
})

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('register', () => {
    it('should register user successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          user: {
            id: 1,
            email: 'test@example.com',
            username: 'testuser',
            created_at: '2023-01-01T00:00:00Z'
          },
          token: 'mock-jwt-token'
        }
      }

      mockedAxios.post.mockResolvedValue(mockResponse)

      const result = await AuthService.register('test@example.com', 'testuser', 'password123')

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/register', {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'mock-jwt-token')
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle registration errors', async () => {
      const mockError = {
        response: {
          data: {
            error: 'Email already exists'
          }
        }
      }

      mockedAxios.post.mockRejectedValue(mockError)

      await expect(AuthService.register('test@example.com', 'testuser', 'password123'))
        .rejects.toThrow('Email already exists')
    })

    it('should handle network errors', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network error'))

      await expect(AuthService.register('test@example.com', 'testuser', 'password123'))
        .rejects.toThrow('Registration failed. Please try again.')
    })
  })

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          user: {
            id: 1,
            email: 'test@example.com',
            username: 'testuser',
            created_at: '2023-01-01T00:00:00Z'
          },
          token: 'mock-jwt-token'
        }
      }

      mockedAxios.post.mockResolvedValue(mockResponse)

      const result = await AuthService.login('test@example.com', 'password123')

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/login', {
        emailOrUsername: 'test@example.com',
        password: 'password123'
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'mock-jwt-token')
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle login errors', async () => {
      const mockError = {
        response: {
          data: {
            error: 'Invalid credentials'
          }
        }
      }

      mockedAxios.post.mockRejectedValue(mockError)

      await expect(AuthService.login('test@example.com', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials')
    })
  })

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockedAxios.post.mockResolvedValue({ data: { success: true } })

      await AuthService.logout()

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/logout')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token')
    })

    it('should clear localStorage even if API call fails', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network error'))

      await AuthService.logout()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token')
    })
  })

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          user: {
            id: 1,
            email: 'test@example.com',
            username: 'testuser',
            created_at: '2023-01-01T00:00:00Z'
          }
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await AuthService.getCurrentUser()

      expect(mockedAxios.get).toHaveBeenCalledWith('/auth/me')
      expect(result).toEqual(mockResponse.data.user)
    })

    it('should handle getCurrentUser errors', async () => {
      const mockError = {
        response: {
          data: {
            error: 'Invalid token'
          }
        }
      }

      mockedAxios.get.mockRejectedValue(mockError)

      await expect(AuthService.getCurrentUser())
        .rejects.toThrow('Invalid token')
    })
  })

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorageMock.getItem.mockReturnValue('mock-token')

      const result = AuthService.isAuthenticated()

      expect(localStorageMock.getItem).toHaveBeenCalledWith('auth_token')
      expect(result).toBe(true)
    })

    it('should return false when token does not exist', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const result = AuthService.isAuthenticated()

      expect(result).toBe(false)
    })
  })

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('mock-token')

      const result = AuthService.getToken()

      expect(localStorageMock.getItem).toHaveBeenCalledWith('auth_token')
      expect(result).toBe('mock-token')
    })

    it('should return null when no token exists', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const result = AuthService.getToken()

      expect(result).toBeNull()
    })
  })

  describe('clearAuth', () => {
    it('should clear auth token from localStorage', () => {
      AuthService.clearAuth()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token')
    })
  })
})
