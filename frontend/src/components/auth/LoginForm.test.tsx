import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
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
  const mockOnLoginSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthContext.isLoading = false
  })

  it('should render login form', () => {
    renderWithTheme(<LoginForm onLoginSuccess={mockOnLoginSuccess} />)

    expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should handle form submission with valid data', async () => {
    mockLogin.mockResolvedValue(undefined)

    renderWithTheme(<LoginForm onLoginSuccess={mockOnLoginSuccess} />)

    const emailInput = screen.getByLabelText(/email or username/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await act(async () => {
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'password123')
      await userEvent.click(submitButton)
    })

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
    })

    expect(mockOnLoginSuccess).toHaveBeenCalled()
  })

  it('should display error message on login failure', async () => {
    const errorMessage = 'Invalid credentials'
    mockLogin.mockRejectedValue(new Error(errorMessage))

    renderWithTheme(<LoginForm onLoginSuccess={mockOnLoginSuccess} />)

    const emailInput = screen.getByLabelText(/email or username/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await act(async () => {
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'wrongpassword')
      await userEvent.click(submitButton)
    })

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    expect(mockOnLoginSuccess).not.toHaveBeenCalled()
  })

  it('should require email/username field', async () => {
    renderWithTheme(<LoginForm onLoginSuccess={mockOnLoginSuccess} />)

    const passwordInput = screen.getByLabelText(/^password$/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await act(async () => {
      await userEvent.type(passwordInput, 'password123')
      await userEvent.click(submitButton)
    })

    // Form should not submit without email/username
    expect(mockLogin).not.toHaveBeenCalled()
    expect(mockOnLoginSuccess).not.toHaveBeenCalled()
  })

  it('should require password field', async () => {
    renderWithTheme(<LoginForm onLoginSuccess={mockOnLoginSuccess} />)

    const emailInput = screen.getByLabelText(/email or username/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await act(async () => {
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.click(submitButton)
    })

    // Form should not submit without password
    expect(mockLogin).not.toHaveBeenCalled()
    expect(mockOnLoginSuccess).not.toHaveBeenCalled()
  })

  it('should handle keyboard navigation', async () => {
    renderWithTheme(<LoginForm onLoginSuccess={mockOnLoginSuccess} />)

    const emailInput = screen.getByLabelText(/email or username/i)
    const passwordInput = screen.getByLabelText(/^password$/i)

    // Tab navigation
    await act(async () => {
      emailInput.focus()
      await userEvent.tab()
    })
    expect(passwordInput).toHaveFocus()

    // Tab again - should focus on password visibility toggle button, then submit button
    await act(async () => {
      await userEvent.tab()
    })
    // The password field has a visibility toggle button, so that gets focus first
    expect(screen.getByLabelText(/toggle password visibility/i)).toHaveFocus()
    
    await act(async () => {
      await userEvent.tab()
    })
    expect(screen.getByRole('button', { name: /sign in/i })).toHaveFocus()
  })

  it('should submit form on Enter key press', async () => {
    mockLogin.mockResolvedValue(undefined)

    renderWithTheme(<LoginForm onLoginSuccess={mockOnLoginSuccess} />)

    const emailInput = screen.getByLabelText(/email or username/i)
    const passwordInput = screen.getByLabelText(/^password$/i)

    await act(async () => {
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'password123')
      await userEvent.keyboard('{Enter}')
    })

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
    })

    expect(mockOnLoginSuccess).toHaveBeenCalled()
  })
})
