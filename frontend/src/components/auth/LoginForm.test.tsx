import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import LoginForm from './LoginForm'

// Mock the auth context
const mockLogin = jest.fn()
const mockAuthContext = {
  login: mockLogin,
  isLoading: false,
  isAuthenticated: false,
  user: null,
  token: null,
  register: jest.fn(),
  logout: jest.fn(),
  checkAuth: jest.fn(),
}

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}))

// Create a theme for Material-UI components
const theme = createTheme()

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  )
}

describe('LoginForm', () => {
  const mockOnSuccess = jest.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthContext.isLoading = false
  })

  it('should render login form', () => {
    renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />)

    expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should handle form submission with valid data', async () => {
    mockLogin.mockResolvedValue(undefined)

    renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />)

    const emailInput = screen.getByLabelText(/email or username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
    })

    expect(mockOnSuccess).toHaveBeenCalled()
  })

  it('should display error message on login failure', async () => {
    const errorMessage = 'Invalid credentials'
    mockLogin.mockRejectedValue(new Error(errorMessage))

    renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />)

    const emailInput = screen.getByLabelText(/email or username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('should require email/username field', async () => {
    renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />)

    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // Form should not submit without email/username
    expect(mockLogin).not.toHaveBeenCalled()
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('should require password field', async () => {
    renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />)

    const emailInput = screen.getByLabelText(/email or username/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    // Form should not submit without password
    expect(mockLogin).not.toHaveBeenCalled()
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('should disable submit button when loading', () => {
    mockAuthContext.isLoading = true

    renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />)

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    expect(submitButton).toBeDisabled()
  })

  it('should show loading state', () => {
    mockAuthContext.isLoading = true

    renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />)

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should clear error message when user starts typing', async () => {
    const errorMessage = 'Invalid credentials'
    mockLogin.mockRejectedValue(new Error(errorMessage))

    renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />)

    const emailInput = screen.getByLabelText(/email or username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // Trigger error
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    // Clear error by typing
    await user.clear(emailInput)
    await user.type(emailInput, 'new@example.com')

    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument()
  })

  it('should handle keyboard navigation', async () => {
    renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />)

    const emailInput = screen.getByLabelText(/email or username/i)
    const passwordInput = screen.getByLabelText(/password/i)

    // Tab navigation
    emailInput.focus()
    await user.tab()
    expect(passwordInput).toHaveFocus()

    await user.tab()
    expect(screen.getByRole('button', { name: /sign in/i })).toHaveFocus()
  })

  it('should submit form on Enter key press', async () => {
    mockLogin.mockResolvedValue(undefined)

    renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />)

    const emailInput = screen.getByLabelText(/email or username/i)
    const passwordInput = screen.getByLabelText(/password/i)

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
    })

    expect(mockOnSuccess).toHaveBeenCalled()
  })
})
