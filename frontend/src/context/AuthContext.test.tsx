import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { AuthProvider, useAuth } from './AuthContext'
import AuthService from '../services/authService'

// Mock AuthService
jest.mock('../services/authService')
const mockedAuthService = AuthService as jest.Mocked<typeof AuthService>

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Test component to access auth context
const TestComponent = () => {
  const auth = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{auth.isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="authenticated">{auth.isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="user">{auth.user ? auth.user.email : 'no-user'}</div>
      <button onClick={() => auth.login('test@example.com', 'password')}>Login</button>
      <button onClick={() => auth.register('test@example.com', 'testuser', 'password')}>Register</button>
      <button onClick={() => auth.logout()}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockClear()
  })

  it('should provide auth context to children', () => {
    localStorageMock.getItem.mockReturnValue(null)
    mockedAuthService.getToken.mockReturnValue(null)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated')
    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
  })

  it('should check authentication on mount', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      created_at: '2023-01-01T00:00:00Z'
    }

    localStorageMock.getItem.mockReturnValue('mock-token')
    mockedAuthService.getToken.mockReturnValue('mock-token')
    mockedAuthService.getCurrentUser.mockResolvedValue(mockUser)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Initially loading
    expect(screen.getByTestId('loading')).toHaveTextContent('loading')

    // Wait for auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })

    expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated')
    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
  })

  it('should handle failed authentication check', async () => {
    localStorageMock.getItem.mockReturnValue('invalid-token')
    mockedAuthService.getToken.mockReturnValue('invalid-token')
    mockedAuthService.getCurrentUser.mockRejectedValue(new Error('Invalid token'))
    mockedAuthService.clearAuth.mockImplementation(() => {})

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })

    expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated')
    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    expect(mockedAuthService.clearAuth).toHaveBeenCalled()
  })

  it('should handle successful login', async () => {
    const mockAuthResponse = {
      success: true,
      user: {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        created_at: '2023-01-01T00:00:00Z'
      },
      token: 'new-token'
    }

    localStorageMock.getItem.mockReturnValue(null)
    mockedAuthService.getToken.mockReturnValue(null)
    mockedAuthService.login.mockResolvedValue(mockAuthResponse)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Wait for initial auth check
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })

    // Perform login
    await act(async () => {
      screen.getByText('Login').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated')
    })

    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
    expect(mockedAuthService.login).toHaveBeenCalledWith('test@example.com', 'password')
  })

  it('should handle failed login', async () => {
    localStorageMock.getItem.mockReturnValue(null)
    mockedAuthService.getToken.mockReturnValue(null)
    mockedAuthService.login.mockRejectedValue(new Error('Invalid credentials'))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Wait for initial auth check
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })

    // Perform login
    await act(async () => {
      try {
        screen.getByText('Login').click()
      } catch (error) {
        // Expected to throw
      }
    })

    expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated')
    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
  })

  it('should handle successful registration', async () => {
    const mockAuthResponse = {
      success: true,
      user: {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        created_at: '2023-01-01T00:00:00Z'
      },
      token: 'new-token'
    }

    localStorageMock.getItem.mockReturnValue(null)
    mockedAuthService.getToken.mockReturnValue(null)
    mockedAuthService.register.mockResolvedValue(mockAuthResponse)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Wait for initial auth check
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })

    // Perform registration
    await act(async () => {
      screen.getByText('Register').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated')
    })

    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
    expect(mockedAuthService.register).toHaveBeenCalledWith('test@example.com', 'testuser', 'password')
  })

  it('should handle logout', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      created_at: '2023-01-01T00:00:00Z'
    }

    // Start with authenticated user
    localStorageMock.getItem.mockReturnValue('mock-token')
    mockedAuthService.getToken.mockReturnValue('mock-token')
    mockedAuthService.getCurrentUser.mockResolvedValue(mockUser)
    mockedAuthService.logout.mockResolvedValue()

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Wait for auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated')
    })

    // Perform logout
    await act(async () => {
      screen.getByText('Logout').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated')
    })

    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    expect(mockedAuthService.logout).toHaveBeenCalled()
  })

  it('should throw error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')

    consoleSpy.mockRestore()
  })
})
