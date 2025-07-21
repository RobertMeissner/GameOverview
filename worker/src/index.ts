import { handleAuthRoutes } from './routes/auth.js'
import { handleGamesRoutes } from './routes/games.js'
import { handleFeatureFlagRoutes } from './routes/featureFlags.js'
import { createFeatureFlagService } from './utils/featureFlags.js'
import type { Env, HealthResponse, ApiError } from './types/index.js'

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true'
        },
      })
    }

    // API Routes
    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, env, ctx)
    }

    // Serve static assets using the new assets feature
    try {
      return await env.ASSETS.fetch(request)
    } catch (e) {
      // If asset not found, serve index.html for SPA routing
      try {
        const indexRequest = new Request(`${url.origin}/index.html`, request)
        return await env.ASSETS.fetch(indexRequest)
      } catch (indexError) {
        return new Response('Not Found', { status: 404 })
      }
    }
  },
} satisfies ExportedHandler<Env>

async function handleAPI(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url)
  const flagService = createFeatureFlagService(env)

  // Authentication routes - protected by feature flag
  if (url.pathname.startsWith('/api/auth/')) {
    const authEnabled = await flagService.isEnabled('authentication', undefined, true)
    if (!authEnabled) {
      const errorResponse: ApiError = {
        error: 'Authentication feature is currently disabled'
      }
      return new Response(JSON.stringify(errorResponse), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    const response = await handleAuthRoutes(request, env, ctx)
    if (response) return response
  }

  // Games routes
  if (url.pathname.startsWith('/api/games')) {
    const response = await handleGamesRoutes(request, env, ctx)
    if (response) return response
  }

  // Feature flag management routes
  if (url.pathname.startsWith('/api/flags')) {
    const response = await handleFeatureFlagRoutes(request, env, ctx)
    if (response) return response
  }

  // Health check endpoint
  if (url.pathname === '/api/health') {
    const healthResponse: HealthResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }

    return new Response(JSON.stringify(healthResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }

  const errorResponse: ApiError = {
    error: 'API endpoint not found'
  }

  return new Response(JSON.stringify(errorResponse), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
}
