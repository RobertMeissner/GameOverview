import axios, { AxiosResponse } from 'axios'

// Get API base URL from environment or detect local development
declare const process: { env: { [key: string]: string | undefined } }

// Force use backend port 8001 when running locally
const API_BASE_URL = 'http://localhost:8001/api'

console.log('GameService API URL:', API_BASE_URL)

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for authentication
})

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('auth_token')
      // Don't redirect here - let the AuthContext handle it
    }
    return Promise.reject(error)
  }
)

export interface GameData {
  id?: number
  name: string
  app_id?: string
  store: 'steam' | 'gog' | 'epic' | 'other'
  rating?: number
  notes?: string
  status?: 'backlog' | 'playing' | 'completed' | 'dropped' | 'wishlist'
  played?: boolean
  hide?: boolean
  later?: boolean
}

export interface GameResponse {
  success: boolean
  game: any
}

export interface GamesResponse {
  success: boolean
  games: any[]
}

export class GameService {
  // Add a new game to user's library
  static async addGame(gameData: GameData): Promise<GameResponse> {
    try {
      const response: AxiosResponse<GameResponse> = await api.post('/games', gameData)
      return response.data
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error)
      }
      throw new Error('Failed to add game. Please try again.')
    }
  }

  // Get user's game library
  static async getGames(): Promise<any[]> {
    try {
      const response: AxiosResponse<GamesResponse> = await api.get('/games')
      return response.data.games || []
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error)
      }
      throw new Error('Failed to fetch games. Please try again.')
    }
  }

  // Get user's game library in legacy format for compatibility
  static async getLegacyGames(): Promise<any[]> {
    try {
      const response: AxiosResponse<any[]> = await api.get('/games/legacy')
      return response.data || []
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error)
      }
      throw new Error('Failed to fetch games. Please try again.')
    }
  }

  // Update a game
  static async updateGame(gameId: number, updates: Partial<GameData>): Promise<GameResponse> {
    try {
      const response: AxiosResponse<GameResponse> = await api.put(`/games/${gameId}`, updates)
      return response.data
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error)
      }
      throw new Error('Failed to update game. Please try again.')
    }
  }

  // Delete a game
  static async deleteGame(gameId: number): Promise<void> {
    try {
      await api.delete(`/games/${gameId}`)
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error)
      }
      throw new Error('Failed to delete game. Please try again.')
    }
  }
}

export default GameService
