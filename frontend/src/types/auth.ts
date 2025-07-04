// User types
export interface User {
  id: number
  email: string
  username: string
  created_at: string
}

// Authentication request types
export interface LoginRequest {
  emailOrUsername: string
  password: string
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
}

// Authentication response types
export interface AuthResponse {
  success: boolean
  user: User
  token: string
}

export interface ApiError {
  error: string
}

// Authentication context types
export interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (emailOrUsername: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

// Form validation types
export interface FormErrors {
  email?: string
  username?: string
  password?: string
  confirmPassword?: string
  emailOrUsername?: string
  general?: string
}

export interface LoginFormData {
  emailOrUsername: string
  password: string
}

export interface RegisterFormData {
  email: string
  username: string
  password: string
  confirmPassword: string
}
