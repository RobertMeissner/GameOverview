import { AuthUtils, UserService } from '../utils/auth.js'
import { createCorsHeaders } from '../middleware/auth.js'
import type { Env, CreateUserRequest, LoginRequest, AuthResponse, ApiError } from '../types/index.js'

export async function handleAuthRoutes(request: Request, env: Env, ctx: ExecutionContext): Promise<Response | null> {
  const url = new URL(request.url)
  const authUtils = new AuthUtils(env.JWT_SECRET || 'default-secret-change-in-production')
  const userService = new UserService(env.DB)
  const corsHeaders = createCorsHeaders()

  try {
    // POST /api/auth/register
    if (request.method === 'POST' && url.pathname === '/api/auth/register') {
      const body = await request.json() as CreateUserRequest
      const { email, username, password } = body

      // Basic validation
      if (!email || !username || !password) {
        const errorResponse: ApiError = {
          error: 'Email, username, and password are required'
        }
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

      if (password.length < 6) {
        const errorResponse: ApiError = {
          error: 'Password must be at least 6 characters long'
        }
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        const errorResponse: ApiError = {
          error: 'Invalid email format'
        }
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

      try {
        const user = await userService.createUser(email, username, password, authUtils)

        // Create JWT token
        const token = await authUtils.createJWT({
          userId: user.id,
          email: user.email,
          username: user.username
        })

        const response: AuthResponse = {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            created_at: user.created_at
          },
          token
        }

        return new Response(JSON.stringify(response), {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': `auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/`,
            ...corsHeaders
          }
        })
      } catch (error: any) {
        const errorResponse: ApiError = {
          error: error.message
        }
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }
    }

    // POST /api/auth/login
    if (request.method === 'POST' && url.pathname === '/api/auth/login') {
      const body = await request.json() as LoginRequest
      const { emailOrUsername, password } = body

      if (!emailOrUsername || !password) {
        const errorResponse: ApiError = {
          error: 'Email/username and password are required'
        }
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

      try {
        const user = await userService.authenticateUser(emailOrUsername, password, authUtils)

        // Create JWT token
        const token = await authUtils.createJWT({
          userId: user.id,
          email: user.email,
          username: user.username
        })

        const response: AuthResponse = {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            created_at: user.created_at
          },
          token
        }

        return new Response(JSON.stringify(response), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': `auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/`,
            ...corsHeaders
          }
        })
      } catch (error: any) {
        const errorResponse: ApiError = {
          error: 'Invalid credentials'
        }
        return new Response(JSON.stringify(errorResponse), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }
    }

    // POST /api/auth/logout
    if (request.method === 'POST' && url.pathname === '/api/auth/logout') {
      return new Response(JSON.stringify({
        success: true,
        message: 'Logged out successfully'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `auth_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`,
          ...corsHeaders
        }
      })
    }

    // GET /api/auth/me - Get current user info
    if (request.method === 'GET' && url.pathname === '/api/auth/me') {
      const authHeader = request.headers.get('Authorization')
      const cookieHeader = request.headers.get('Cookie')

      let token = authUtils.extractTokenFromHeader(authHeader)
      if (!token) {
        token = authUtils.extractTokenFromCookie(cookieHeader)
      }

      if (!token) {
        const errorResponse: ApiError = {
          error: 'No authentication token provided'
        }
        return new Response(JSON.stringify(errorResponse), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

      try {
        const payload = await authUtils.verifyJWT(token)
        const user = await userService.findUserById(payload.userId)

        if (!user) {
          const errorResponse: ApiError = {
            error: 'User not found'
          }
          return new Response(JSON.stringify(errorResponse), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          })
        }

        return new Response(JSON.stringify({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            created_at: user.created_at
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      } catch (error: any) {
        const errorResponse: ApiError = {
          error: 'Invalid or expired token'
        }
        return new Response(JSON.stringify(errorResponse), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }
    }

    return null // Route not handled
  } catch (error: any) {
    console.error('Auth route error:', error)
    const errorResponse: ApiError = {
      error: 'Internal server error'
    }
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
}
