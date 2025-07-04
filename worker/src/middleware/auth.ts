import { AuthUtils, UserService } from '../utils/auth.js'
import type { User, Env } from '../types/index.js'

export async function requireAuth(request: Request, env: Env): Promise<User> {
  const authUtils = new AuthUtils(env.JWT_SECRET || 'default-secret-change-in-production')
  const userService = new UserService(env.DB)

  const authHeader = request.headers.get('Authorization')
  const cookieHeader = request.headers.get('Cookie')
  
  let token = authUtils.extractTokenFromHeader(authHeader)
  if (!token) {
    token = authUtils.extractTokenFromCookie(cookieHeader)
  }

  if (!token) {
    throw new Error('No authentication token provided')
  }

  try {
    const payload = await authUtils.verifyJWT(token)
    const user = await userService.findUserById(payload.userId)
    
    if (!user) {
      throw new Error('User not found')
    }

    return user
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

export function createAuthErrorResponse(error: Error, corsHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ 
    error: error.message 
  }), {
    status: 401,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...corsHeaders 
    }
  })
}

export function createCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  }
}
