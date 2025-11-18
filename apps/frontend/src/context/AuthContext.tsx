import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import AuthService from '../services/authService'
import type { User, AuthContextType } from '../types/auth'

// Auth state type
interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

// Auth actions
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
}

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
      }
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      }
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      }
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      }
    default:
      return state
  }
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth provider component
interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Check authentication status on mount
  useEffect(() => {
    checkAuth()
  }, [])

  // Check if user is authenticated
  const checkAuth = async () => {
    dispatch({ type: 'SET_LOADING', payload: true })

    try {
      const token = AuthService.getToken()
      if (!token) {
        dispatch({ type: 'AUTH_FAILURE' })
        return
      }

      const user = await AuthService.getCurrentUser()
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token }
      })
    } catch (error) {
      console.error('Auth check failed:', error)
      AuthService.clearAuth()
      dispatch({ type: 'AUTH_FAILURE' })
    }
  }

  // Login function
  const login = async (emailOrUsername: string, password: string) => {
    dispatch({ type: 'AUTH_START' })

    try {
      const response = await AuthService.login(emailOrUsername, password)
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          token: response.token
        }
      })
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE' })
      throw error // Re-throw to handle in component
    }
  }

  // Register function
  const register = async (email: string, username: string, password: string) => {
    dispatch({ type: 'AUTH_START' })

    try {
      const response = await AuthService.register(email, username, password)
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          token: response.token
        }
      })
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE' })
      throw error // Re-throw to handle in component
    }
  }

  // Logout function
  const logout = async () => {
    dispatch({ type: 'SET_LOADING', payload: true })

    try {
      await AuthService.logout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      dispatch({ type: 'LOGOUT' })
    }
  }

  const value: AuthContextType = {
    user: state.user,
    token: state.token,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
