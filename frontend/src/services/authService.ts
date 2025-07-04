import axios, { AxiosResponse } from 'axios'
import type { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse
} from '../types/auth'

// Get API base URL from environment or default to relative path
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for authentication
})

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('auth_token')
      // Optionally redirect to login
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export class AuthService {
  // Register new user
  static async register(email: string, username: string, password: string): Promise<AuthResponse> {
    try {
      const request: RegisterRequest = { email, username, password }
      const response: AxiosResponse<AuthResponse> = await api.post('/auth/register', request)
      
      // Store token in localStorage
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token)
      }
      
      return response.data
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error)
      }
      throw new Error('Registration failed. Please try again.')
    }
  }

  // Login user
  static async login(emailOrUsername: string, password: string): Promise<AuthResponse> {
    try {
      const request: LoginRequest = { emailOrUsername, password }
      const response: AxiosResponse<AuthResponse> = await api.post('/auth/login', request)
      
      // Store token in localStorage
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token)
      }
      
      return response.data
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error)
      }
      throw new Error('Login failed. Please check your credentials.')
    }
  }

  // Logout user
  static async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error)
    } finally {
      // Always clear local storage
      localStorage.removeItem('auth_token')
    }
  }

  // Get current user info
  static async getCurrentUser(): Promise<User> {
    try {
      const response: AxiosResponse<{ success: boolean; user: User }> = await api.get('/auth/me')
      return response.data.user
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error)
      }
      throw new Error('Failed to get user information')
    }
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token')
  }

  // Get stored token
  static getToken(): string | null {
    return localStorage.getItem('auth_token')
  }

  // Clear authentication data
  static clearAuth(): void {
    localStorage.removeItem('auth_token')
  }
}

export default AuthService
