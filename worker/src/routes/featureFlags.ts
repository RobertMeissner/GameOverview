import { createFeatureFlagService, type FeatureFlag } from '../utils/featureFlags.js'
import { AuthUtils } from '../utils/auth.js'
import type { Env, ApiError } from '../types/index.js'

/**
 * Feature flag management routes
 * Protected endpoints for managing feature flags
 */
export async function handleFeatureFlagRoutes(request: Request, env: Env, ctx: ExecutionContext): Promise<Response | null> {
  const url = new URL(request.url)
  const flagService = createFeatureFlagService(env)
  const authUtils = new AuthUtils(env.JWT_SECRET || 'default-secret-change-in-production')

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  }

  try {
    // Authenticate request (admin only for flag management)
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      const errorResponse: ApiError = { error: 'Authentication required' }
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    const token = authHeader.substring(7)
    const payload = await authUtils.verifyJWT(token)
    if (!payload) {
      const errorResponse: ApiError = { error: 'Invalid token' }
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // GET /api/flags - List all flags
    if (request.method === 'GET' && url.pathname === '/api/flags') {
      const flags = await flagService.listFlags()
      return new Response(JSON.stringify({ flags }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // GET /api/flags/:flagName - Get specific flag
    if (request.method === 'GET' && url.pathname.startsWith('/api/flags/')) {
      const flagName = url.pathname.split('/')[3]
      if (!flagName) {
        const errorResponse: ApiError = { error: 'Flag name required' }
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

      const userId = url.searchParams.get('userId') || undefined
      const result = await flagService.evaluateFlag(flagName, userId)

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // POST /api/flags/:flagName - Create or update flag
    if (request.method === 'POST' && url.pathname.startsWith('/api/flags/')) {
      const flagName = url.pathname.split('/')[3]
      if (!flagName) {
        const errorResponse: ApiError = { error: 'Flag name required' }
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

      const body = await request.json() as FeatureFlag
      await flagService.setFlag(flagName, body)

      return new Response(JSON.stringify({ success: true, flagName }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // PUT /api/flags/:flagName/enable - Enable flag
    if (request.method === 'PUT' && url.pathname.includes('/enable')) {
      const flagName = url.pathname.split('/')[3]
      if (!flagName) {
        const errorResponse: ApiError = { error: 'Flag name required' }
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

      const body = await request.json() as { rolloutPercentage?: number }
      await flagService.enableFlag(flagName, body.rolloutPercentage)

      return new Response(JSON.stringify({ success: true, flagName, enabled: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // PUT /api/flags/:flagName/disable - Disable flag
    if (request.method === 'PUT' && url.pathname.includes('/disable')) {
      const flagName = url.pathname.split('/')[3]
      if (!flagName) {
        const errorResponse: ApiError = { error: 'Flag name required' }
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

      await flagService.disableFlag(flagName)

      return new Response(JSON.stringify({ success: true, flagName, enabled: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // POST /api/flags/:flagName/users/:userId - Set user override
    if (request.method === 'POST' && url.pathname.includes('/users/')) {
      const pathParts = url.pathname.split('/')
      const flagName = pathParts[3]
      const userId = pathParts[5]

      if (!flagName || !userId) {
        const errorResponse: ApiError = { error: 'Flag name and user ID required' }
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

      const body = await request.json() as { enabled: boolean }
      await flagService.setUserOverride(flagName, userId, body.enabled)

      return new Response(JSON.stringify({ success: true, flagName, userId, enabled: body.enabled }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // DELETE /api/flags/:flagName/users/:userId - Remove user override
    if (request.method === 'DELETE' && url.pathname.includes('/users/')) {
      const pathParts = url.pathname.split('/')
      const flagName = pathParts[3]
      const userId = pathParts[5]

      if (!flagName || !userId) {
        const errorResponse: ApiError = { error: 'Flag name and user ID required' }
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

      await flagService.removeUserOverride(flagName, userId)

      return new Response(JSON.stringify({ success: true, flagName, userId }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    return null

  } catch (error) {
    console.error('Feature flag route error:', error)
    const errorResponse: ApiError = {
      error: 'Internal server error'
    }
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
}
