// Environment bindings
export interface Env {
  DB: D1Database
  ASSETS: Fetcher
  FEATURE_FLAGS: KVNamespace
  JWT_SECRET: string
  ENVIRONMENT?: string
}

// User types
export interface User {
  id: number
  email: string
  username: string
  created_at: string
}

export interface UserWithPassword extends User {
  password_hash: string
}

export interface CreateUserRequest {
  email: string
  username: string
  password: string
}

export interface LoginRequest {
  emailOrUsername: string
  password: string
}

export interface AuthResponse {
  success: boolean
  user: User
  token: string
}

// Game types
export interface Game {
  id: number
  user_id: number
  name: string
  app_id: string | null
  store: GameStore
  thumbnail_url: string | null
  rating: number | null
  notes: string | null
  date_added: string
  last_played: string | null
  playtime_hours: number
  status: GameStatus
  // Enhanced fields for frontend compatibility
  game_hash: string
  found_game_name: string | null
  review_score: number
  metacritic_score: number
  reviews_rating: number
  store_link: string | null
  corrected_app_id: string | null
  played: boolean
  hide: boolean
  later: boolean
}

export type GameStore = 'steam' | 'gog' | 'epic' | 'other'
export type GameStatus = 'backlog' | 'playing' | 'completed' | 'dropped' | 'wishlist'

export interface CreateGameRequest {
  name: string
  app_id?: string
  store: GameStore
  rating?: number
  notes?: string
  status?: GameStatus
  // Enhanced fields
  played?: boolean
  hide?: boolean
  later?: boolean
}

export interface UpdateGameRequest {
  name?: string
  rating?: number
  notes?: string
  status?: GameStatus
  playtime_hours?: number
  // Enhanced fields
  played?: boolean
  hide?: boolean
  later?: boolean
  review_score?: number
  metacritic_score?: number
  corrected_app_id?: string
}

export interface GameResponse {
  success: boolean
  game: Game
}

export interface GamesResponse {
  success: boolean
  games: Game[]
}

// JWT types
export interface JWTPayload {
  userId: number
  email: string
  username: string
  iat: number
  exp: number
}

// Steam API types
export interface SteamGameData {
  game_name: string
  thumbnail_url: string
}

export interface SteamApiResponse {
  [appId: string]: {
    success: boolean
    data?: {
      name: string
      header_image: string
    }
  }
}

// API Response types
export interface ApiError {
  error: string
}

export interface ApiSuccess<T = any> {
  success: true
  data?: T
  message?: string
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError

// Health check
export interface HealthResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  version: string
}

// Database result types
export interface D1Result<T = any> {
  results?: T[]
  success: boolean
  meta: {
    duration: number
    last_row_id?: number
    changes?: number
    served_by?: string
    internal_stats?: any
  }
}

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement
  first<T = any>(): Promise<T | null>
  run(): Promise<D1Result>
  all<T = any>(): Promise<D1Result<T>>
}
