import type { 
  Env, 
  Game, 
  CreateGameRequest, 
  UpdateGameRequest,
  SteamGameData,
  SteamApiResponse,
  GameStore,
  User
} from '../types/index.js'

export class GameService {
  constructor(private env: Env) {}

  async createGame(user: User, request: CreateGameRequest): Promise<Game> {
    // Generate unique game hash
    const gameHash = `game_${Date.now()}_${user.id}_${Math.random().toString(36).substr(2, 9)}`
    
    let gameData = {
      name: request.name,
      app_id: request.app_id || null,
      store: request.store,
      thumbnail_url: '',
      rating: request.rating || null,
      notes: request.notes || null,
      status: request.status || 'backlog' as const,
      played: request.played || false,
      hide: request.hide || false,
      later: request.later || false,
      game_hash: gameHash,
      found_game_name: null as string | null,
      review_score: 0,
      metacritic_score: 0,
      reviews_rating: 0,
      store_link: null as string | null,
      corrected_app_id: null as string | null
    }

    // Fetch additional data for Steam games
    if (request.app_id && request.store === 'steam') {
      const steamData = await this.fetchSteamGameData(request.app_id)
      if ('game_name' in steamData) {
        gameData.name = steamData.game_name || gameData.name
        gameData.found_game_name = steamData.game_name
        gameData.thumbnail_url = steamData.thumbnail_url || ''
      }
    }

    // Map status to boolean fields for compatibility
    if (gameData.status === 'completed') {
      gameData.played = true
    } else if (gameData.status === 'wishlist') {
      gameData.later = true
    }

    const result = await this.env.DB.prepare(`
      INSERT INTO games (
        user_id, name, app_id, store, thumbnail_url, rating, notes, status,
        game_hash, found_game_name, review_score, metacritic_score, 
        reviews_rating, store_link, corrected_app_id, played, hide, later
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      gameData.name,
      gameData.app_id,
      gameData.store,
      gameData.thumbnail_url,
      gameData.rating,
      gameData.notes,
      gameData.status,
      gameData.game_hash,
      gameData.found_game_name,
      gameData.review_score,
      gameData.metacritic_score,
      gameData.reviews_rating,
      gameData.store_link,
      gameData.corrected_app_id,
      gameData.played,
      gameData.hide,
      gameData.later
    ).run()

    return {
      id: result.meta.last_row_id!,
      user_id: user.id,
      date_added: new Date().toISOString(),
      last_played: null,
      playtime_hours: 0,
      ...gameData
    }
  }

  async getUserGames(userId: string): Promise<Game[]> {
    const result = await this.env.DB.prepare(`
      SELECT 
        id, user_id, name, app_id, store, thumbnail_url, rating, notes, status,
        date_added, last_played, playtime_hours, game_hash, found_game_name,
        review_score, metacritic_score, reviews_rating, store_link, 
        corrected_app_id, played, hide, later
      FROM games 
      WHERE user_id = ?
      ORDER BY date_added DESC
    `).bind(userId).all<Game>()

    return result.results || []
  }

  async updateGame(userId: string, gameId: number, request: UpdateGameRequest): Promise<Game | null> {
    // First check if the game belongs to the user
    const existingGame = await this.env.DB.prepare(`
      SELECT id FROM games WHERE id = ? AND user_id = ?
    `).bind(gameId, userId).first()

    if (!existingGame) {
      return null
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []
    
    if (request.name !== undefined) {
      updates.push('name = ?')
      values.push(request.name)
    }
    if (request.rating !== undefined) {
      updates.push('rating = ?')
      values.push(request.rating)
    }
    if (request.notes !== undefined) {
      updates.push('notes = ?')
      values.push(request.notes)
    }
    if (request.status !== undefined) {
      updates.push('status = ?')
      values.push(request.status)
    }
    if (request.playtime_hours !== undefined) {
      updates.push('playtime_hours = ?')
      values.push(request.playtime_hours)
    }
    if (request.played !== undefined) {
      updates.push('played = ?')
      values.push(request.played)
    }
    if (request.hide !== undefined) {
      updates.push('hide = ?')
      values.push(request.hide)
    }
    if (request.later !== undefined) {
      updates.push('later = ?')
      values.push(request.later)
    }
    if (request.review_score !== undefined) {
      updates.push('review_score = ?')
      values.push(request.review_score)
    }
    if (request.metacritic_score !== undefined) {
      updates.push('metacritic_score = ?')
      values.push(request.metacritic_score)
    }
    if (request.corrected_app_id !== undefined) {
      updates.push('corrected_app_id = ?')
      values.push(request.corrected_app_id)
    }

    if (updates.length === 0) {
      throw new Error('No fields to update')
    }

    values.push(gameId, userId)

    await this.env.DB.prepare(`
      UPDATE games 
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `).bind(...values).run()

    // Fetch updated game
    const updatedGame = await this.env.DB.prepare(`
      SELECT 
        id, user_id, name, app_id, store, thumbnail_url, rating, notes, status,
        date_added, last_played, playtime_hours, game_hash, found_game_name,
        review_score, metacritic_score, reviews_rating, store_link, 
        corrected_app_id, played, hide, later
      FROM games 
      WHERE id = ? AND user_id = ?
    `).bind(gameId, userId).first<Game>()

    return updatedGame || null
  }

  async deleteGame(userId: string, gameId: number): Promise<boolean> {
    const result = await this.env.DB.prepare(`
      DELETE FROM games WHERE id = ? AND user_id = ?
    `).bind(gameId, userId).run()

    return result.meta.changes! > 0
  }

  private async fetchSteamGameData(appId: string): Promise<SteamGameData | { error: string }> {
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
}

// Data mapper to convert between API and frontend formats
export class GameDataMapper {
  static toFrontendFormat(game: Game): any {
    return {
      id: game.id, // Include ID for API operations
      game_hash: game.game_hash,
      name: game.name,
      rating: game.rating || 0,
      played: game.played,
      hide: game.hide,
      review_score: game.review_score,
      found_game_name: game.found_game_name || game.name,
      corrected_app_id: parseInt(game.corrected_app_id || '0'),
      app_id: parseInt(game.app_id || '0'),
      store: game.store,
      reviewsRating: game.reviews_rating,
      storeLink: game.store_link || '',
      later: game.later,
      metacritic_score: game.metacritic_score
    }
  }

  static fromFrontendFormat(data: any): Partial<CreateGameRequest> {
    return {
      name: data.name,
      app_id: data.app_id?.toString(),
      store: data.store,
      rating: data.rating,
      notes: data.notes,
      status: data.played ? 'completed' : (data.later ? 'wishlist' : 'backlog'),
      played: data.played,
      hide: data.hide,
      later: data.later
    }
  }
}
