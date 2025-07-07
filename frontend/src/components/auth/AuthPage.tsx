import React, { useState } from 'react'
import { Box, Container, Fade } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'

type AuthMode = 'login' | 'register'

interface AuthPageProps {
  initialMode?: AuthMode
}

export default function AuthPage({ initialMode = 'login' }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const navigate = useNavigate()

  const handleAuthSuccess = () => {
    // Redirect to main app after successful authentication
    navigate('/')
  }

  const switchToLogin = () => setMode('login')
  const switchToRegister = () => setMode('register')

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Box sx={{ width: '100%' }}>
          <Fade in={mode === 'login'} timeout={300}>
            <Box sx={{ display: mode === 'login' ? 'block' : 'none' }}>
              <LoginForm
                onSwitchToRegister={switchToRegister}
                onLoginSuccess={handleAuthSuccess}
              />
            </Box>
          </Fade>
          
          <Fade in={mode === 'register'} timeout={300}>
            <Box sx={{ display: mode === 'register' ? 'block' : 'none' }}>
              <RegisterForm
                onSwitchToLogin={switchToLogin}
                onRegisterSuccess={handleAuthSuccess}
              />
            </Box>
          </Fade>
        </Box>
      </Box>
    </Container>
  )
}
