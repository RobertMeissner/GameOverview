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
  id: string // UUID
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
  user_id: string // UUID
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

export interface JWTPayload {
  userId: string // UUID
  email: string
  username: string
  iat: number
  exp: number
}

export interface SteamGameData {
  app_id: number
  game_name: string
  thumbnail_url: string
}

export interface EnrichedSteamGameData {
  game_name: string
  thumbnail_url: string
  short_description: string
  detailed_description: string
  developers: string[]
  publishers: string[]
  metacritic_score: number | null
  release_date: string
  is_free: boolean
  price: {
    currency: string
    amount: number
    formatted: string
  } | null
  genres: string[]
  categories: string[]
  screenshots: Array<{
    thumbnail: string
    full: string
  }>
  platforms: {
    windows: boolean
    mac: boolean
    linux: boolean
  }
  website: string | null
  store_link: string
}

export interface SteamPriceOverview {
  currency: string
  initial: number
  final: number
  discount_percent: number
  initial_formatted: string
  final_formatted: string
}

export interface SteamPlatforms {
  windows: boolean
  mac: boolean
  linux: boolean
}

export interface SteamMetacritic {
  score: number
  url: string
}

export interface SteamCategory {
  id: number
  description: string
}

export interface SteamGenre {
  id: string
  description: string
}

export interface SteamScreenshot {
  id: number
  path_thumbnail: string
  path_full: string
}

export interface SteamMovie {
  id: number
  name: string
  thumbnail: string
  webm: {
    480: string
    max: string
  }
  mp4: {
    480: string
    max: string
  }
  highlight: boolean
}

export interface SteamRequirements {
  minimum?: string
  recommended?: string
}

export interface SteamAchievement {
  name: string
  path: string
}

export interface SteamAchievements {
  total: number
  highlighted: SteamAchievement[]
}

export interface SteamReleaseDate {
  coming_soon: boolean
  date: string
}

export interface SteamSupportInfo {
  url: string
  email: string
}

export interface SteamPackageGroup {
  name: string
  title: string
  description: string
  selection_text: string
  save_text: string
  display_type: number
  is_recurring_subscription: string
}

export interface SteamGameDetails {
  type: string
  name: string
  steam_appid: number
  required_age: number
  is_free: boolean
  controller_support?: string
  dlc?: number[]
  detailed_description: string
  about_the_game: string
  short_description: string
  supported_languages: string
  header_image: string
  capsule_image: string
  capsule_imagev5: string
  website?: string
  pc_requirements: SteamRequirements
  mac_requirements: SteamRequirements
  linux_requirements: SteamRequirements
  legal_notice?: string
  developers: string[]
  publishers: string[]
  price_overview?: SteamPriceOverview
  packages?: number[]
  package_groups?: SteamPackageGroup[]
  platforms: SteamPlatforms
  metacritic?: SteamMetacritic
  categories?: SteamCategory[]
  genres?: SteamGenre[]
  screenshots?: SteamScreenshot[]
  movies?: SteamMovie[]
  recommendations?: {
    total: number
  }
  achievements?: SteamAchievements
  release_date: SteamReleaseDate
  support_info: SteamSupportInfo
  background?: string
  background_raw?: string
  content_descriptors?: {
    ids: number[]
    notes: string | null
  }
  ratings?: Record<string, any>
}

export interface SteamApiResponse {
  [appId: string]: {
    success: boolean
    data?: SteamGameDetails
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
