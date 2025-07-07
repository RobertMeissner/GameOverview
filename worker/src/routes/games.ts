import { requireAuth, createAuthErrorResponse, createCorsHeaders } from '../middleware/auth.js'
import { GameService, GameDataMapper } from '../services/gameService.js'
import type { 
  Env, 
  Game, 
  CreateGameRequest, 
  UpdateGameRequest, 
  GameResponse, 
  GamesResponse, 
  ApiError,
  GameStore
} from '../types/index.js'

export async function handleGamesRoutes(request: Request, env: Env, ctx: ExecutionContext): Promise<Response | null> {
  const url = new URL(request.url)
  const corsHeaders = createCorsHeaders()

  try {
    // All games routes require authentication
    const user = await requireAuth(request, env)
    const gameService = new GameService(env)

    // POST /api/games - Add a new game to user's library
    if (request.method === 'POST' && url.pathname === '/api/games') {
      const body = await request.json() as CreateGameRequest
      const { name, store } = body

      // Validate required fields
      if (!name || !store) {
        const errorResponse: ApiError = { 
          error: 'Name and store are required' 
        }
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

      // Validate store
      const validStores: GameStore[] = ['steam', 'gog', 'epic', 'other']
      if (!validStores.includes(store)) {
        const errorResponse: ApiError = { 
          error: 'Invalid store. Must be one of: ' + validStores.join(', ') 
        }
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

      try {
        const newGame = await gameService.createGame(user, body)

        const response: GameResponse = {
          success: true,
          game: newGame
        }

        return new Response(JSON.stringify(response), {
          status: 201,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      } catch (error: any) {
        console.error('Service error:', error)
        const errorResponse: ApiError = { 
          error: 'Failed to add game to library' 
        }
        return new Response(JSON.stringify(errorResponse), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }
    }

    // GET /api/games - Get user's game library
    if (request.method === 'GET' && url.pathname === '/api/games') {
      try {
        const games = await gameService.getUserGames(user.id)

        const response: GamesResponse = {
          success: true,
          games: games
        }

        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      } catch (error: any) {
        console.error('Service error:', error)
        const errorResponse: ApiError = { 
          error: 'Failed to fetch games' 
        }
        return new Response(JSON.stringify(errorResponse), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }
    }

    // GET /api/games/legacy - Get user's game library in legacy frontend format
    if (request.method === 'GET' && url.pathname === '/api/games/legacy') {
      try {
        const games = await gameService.getUserGames(user.id)
        const legacyGames = games.map(game => GameDataMapper.toFrontendFormat(game))

        return new Response(JSON.stringify(legacyGames), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      } catch (error: any) {
        console.error('Service error:', error)
        const errorResponse: ApiError = { 
          error: 'Failed to fetch games' 
        }
        return new Response(JSON.stringify(errorResponse), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }
    }

    // PUT /api/games/:id - Update a game
    const updateMatch = url.pathname.match(/^\/api\/games\/(\d+)$/)
    if (request.method === 'PUT' && updateMatch) {
      const gameId = parseInt(updateMatch[1])
      const body = await request.json() as UpdateGameRequest

      try {
        const updatedGame = await gameService.updateGame(user.id, gameId, body)

        if (!updatedGame) {
          const errorResponse: ApiError = { 
            error: 'Game not found or access denied' 
          }
          return new Response(JSON.stringify(errorResponse), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          })
        }

        const response: GameResponse = {
          success: true,
          game: updatedGame
        }

        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      } catch (error: any) {
        console.error('Service error:', error)
        const errorResponse: ApiError = { 
          error: error.message || 'Failed to update game' 
        }
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }
    }

    // DELETE /api/games/:id - Delete a game
    const deleteMatch = url.pathname.match(/^\/api\/games\/(\d+)$/)
    if (request.method === 'DELETE' && deleteMatch) {
      const gameId = parseInt(deleteMatch[1])

      try {
        const deleted = await gameService.deleteGame(user.id, gameId)

        if (!deleted) {
          const errorResponse: ApiError = { 
            error: 'Game not found or access denied' 
          }
          return new Response(JSON.stringify(errorResponse), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          })
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'Game deleted successfully'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      } catch (error: any) {
        console.error('Service error:', error)
        const errorResponse: ApiError = { 
          error: 'Failed to delete game' 
        }
        return new Response(JSON.stringify(errorResponse), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }
    }

    return null // Route not handled
  } catch (error: any) {
    return createAuthErrorResponse(error, corsHeaders)
  }
}
