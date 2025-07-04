import { requireAuth, createAuthErrorResponse, createCorsHeaders } from '../middleware/auth.js'
import type { 
  Env, 
  Game, 
  CreateGameRequest, 
  UpdateGameRequest, 
  GameResponse, 
  GamesResponse, 
  SteamGameData, 
  SteamApiResponse,
  ApiError,
  GameStore
} from '../types/index.js'

export async function handleGamesRoutes(request: Request, env: Env, ctx: ExecutionContext): Promise<Response | null> {
  const url = new URL(request.url)
  const corsHeaders = createCorsHeaders()

  try {
    // All games routes require authentication
    const user = await requireAuth(request, env)

    // POST /api/games - Add a new game to user's library
    if (request.method === 'POST' && url.pathname === '/api/games') {
      const body = await request.json() as CreateGameRequest
      const { name, app_id, store, rating, notes, status } = body

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

      let gameData = {
        name,
        app_id: app_id || null,
        store,
        thumbnail_url: '',
        rating: rating || null,
        notes: notes || null,
        status: status || 'backlog' as const
      }

      // Fetch additional data for Steam games
      if (app_id && store === 'steam') {
        const steamData = await getGameByAppId(app_id)
        if ('game_name' in steamData) {
          gameData.name = steamData.game_name || gameData.name
          gameData.thumbnail_url = steamData.thumbnail_url || ''
        }
      }

      try {
        const result = await env.DB.prepare(`
          INSERT INTO games (user_id, name, app_id, store, thumbnail_url, rating, notes, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          user.id,
          gameData.name,
          gameData.app_id,
          gameData.store,
          gameData.thumbnail_url,
          gameData.rating,
          gameData.notes,
          gameData.status
        ).run()

        const newGame: Game = {
          id: result.meta.last_row_id!,
          user_id: user.id,
          name: gameData.name,
          app_id: gameData.app_id,
          store: gameData.store,
          thumbnail_url: gameData.thumbnail_url,
          rating: gameData.rating,
          notes: gameData.notes,
          status: gameData.status,
          date_added: new Date().toISOString(),
          last_played: null,
          playtime_hours: 0
        }

        const response: GameResponse = {
          success: true,
          game: newGame
        }

        return new Response(JSON.stringify(response), {
          status: 201,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      } catch (error: any) {
        console.error('Database error:', error)
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
        const result = await env.DB.prepare(`
          SELECT id, name, app_id, store, thumbnail_url, rating, notes, status, 
                 date_added, last_played, playtime_hours
          FROM games 
          WHERE user_id = ?
          ORDER BY date_added DESC
        `).bind(user.id).all<Game>()

        const response: GamesResponse = {
          success: true,
          games: result.results || []
        }

        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      } catch (error: any) {
        console.error('Database error:', error)
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
      const { name, rating, notes, status, playtime_hours } = body

      try {
        // First check if the game belongs to the user
        const existingGame = await env.DB.prepare(`
          SELECT id FROM games WHERE id = ? AND user_id = ?
        `).bind(gameId, user.id).first()

        if (!existingGame) {
          const errorResponse: ApiError = { 
            error: 'Game not found or access denied' 
          }
          return new Response(JSON.stringify(errorResponse), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          })
        }

        // Build update query dynamically
        const updates: string[] = []
        const values: any[] = []
        
        if (name !== undefined) {
          updates.push('name = ?')
          values.push(name)
        }
        if (rating !== undefined) {
          updates.push('rating = ?')
          values.push(rating)
        }
        if (notes !== undefined) {
          updates.push('notes = ?')
          values.push(notes)
        }
        if (status !== undefined) {
          updates.push('status = ?')
          values.push(status)
        }
        if (playtime_hours !== undefined) {
          updates.push('playtime_hours = ?')
          values.push(playtime_hours)
        }

        if (updates.length === 0) {
          const errorResponse: ApiError = { 
            error: 'No fields to update' 
          }
          return new Response(JSON.stringify(errorResponse), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          })
        }

        updates.push('updated_at = CURRENT_TIMESTAMP')
        values.push(gameId, user.id)

        await env.DB.prepare(`
          UPDATE games 
          SET ${updates.join(', ')}
          WHERE id = ? AND user_id = ?
        `).bind(...values).run()

        // Fetch updated game
        const updatedGame = await env.DB.prepare(`
          SELECT id, name, app_id, store, thumbnail_url, rating, notes, status, 
                 date_added, last_played, playtime_hours
          FROM games 
          WHERE id = ? AND user_id = ?
        `).bind(gameId, user.id).first<Game>()

        const response: GameResponse = {
          success: true,
          game: updatedGame!
        }

        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      } catch (error: any) {
        console.error('Database error:', error)
        const errorResponse: ApiError = { 
          error: 'Failed to update game' 
        }
        return new Response(JSON.stringify(errorResponse), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }
    }

    // DELETE /api/games/:id - Delete a game
    const deleteMatch = url.pathname.match(/^\/api\/games\/(\d+)$/)
    if (request.method === 'DELETE' && deleteMatch) {
      const gameId = parseInt(deleteMatch[1])

      try {
        const result = await env.DB.prepare(`
          DELETE FROM games WHERE id = ? AND user_id = ?
        `).bind(gameId, user.id).run()

        if (result.meta.changes === 0) {
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
        console.error('Database error:', error)
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

// Steam API integration
async function getGameByAppId(appId: string): Promise<SteamGameData | { error: string }> {
  const url = 'https://store.steampowered.com/api/appdetails'
  
  try {
    const response = await fetch(`${url}?appids=${appId}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json() as SteamApiResponse
    
    // Check if the game details are available
    if (data[appId]?.success && data[appId].data) {
      const gameData = data[appId].data!
      const name = gameData.name || ''
      const thumbnailUrl = gameData.header_image || ''

      return {
        game_name: name,
        thumbnail_url: thumbnailUrl
      }
    } else {
      return { error: 'Game not found' }
    }

  } catch (error: any) {
    console.error('Steam API error:', error)
    return { error: error.message }
  }
}
