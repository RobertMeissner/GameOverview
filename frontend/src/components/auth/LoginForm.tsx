import React, { useState } from 'react'
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Link,
  InputAdornment,
  IconButton,
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
} from '@mui/icons-material'
import { useAuth } from '../../context/AuthContext'
import type { LoginFormData, FormErrors } from '../../types/auth'

interface LoginFormProps {
  onSwitchToRegister?: () => void
  onLoginSuccess?: () => void
}

export default function LoginForm({ onSwitchToRegister, onLoginSuccess }: LoginFormProps) {
  const { login, isLoading } = useAuth()
  const [formData, setFormData] = useState<LoginFormData>({
    emailOrUsername: '',
    password: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [showPassword, setShowPassword] = useState(false)

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.emailOrUsername.trim()) {
      newErrors.emailOrUsername = 'Email or username is required'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await login(formData.emailOrUsername, formData.password)
      onLoginSuccess?.()
    } catch (error: any) {
      setErrors({ general: error.message })
    }
  }

  // Handle input changes
  const handleChange = (field: keyof LoginFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }))

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }))
    }
  }

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto' }}>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Sign In
        </Typography>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Welcome back! Please sign in to your account.
        </Typography>

        {errors.general && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.general}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Email or Username"
          value={formData.emailOrUsername}
          onChange={handleChange('emailOrUsername')}
          error={!!errors.emailOrUsername}
          helperText={errors.emailOrUsername}
          margin="normal"
          autoComplete="username"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Email color="action" />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          fullWidth
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleChange('password')}
          error={!!errors.password}
          helperText={errors.password}
          margin="normal"
          autoComplete="current-password"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  aria-label="toggle password visibility"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={isLoading}
          sx={{ mt: 3, mb: 2 }}
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Sign In'
          )}
        </Button>

        {onSwitchToRegister && (
          <Box textAlign="center">
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link
                component="button"
                type="button"
                onClick={onSwitchToRegister}
                sx={{ textDecoration: 'none' }}
              >
                Sign up here
              </Link>
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  )
}
