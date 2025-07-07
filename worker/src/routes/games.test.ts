import { describe, it, expect, beforeEach, vi } from 'vitest'
import { handleGamesRoutes } from './games.js'
import * as authMiddleware from '../middleware/auth.js'
import type { Env } from '../types/index.js'

// Mock environment for testing
const mockEnv: Env = {
  DB: {
    prepare: (query: string) => ({
      bind: (...args: any[]) => ({
        run: () => Promise.resolve({ 
          meta: { last_row_id: 1, changes: 1 },
          success: true 
        }),
        first: () => Promise.resolve({ 
          id: 1, 
          user_id: '550e8400-e29b-41d4-a716-446655440001', 
          name: 'Test Game',
          app_id: '123',
          store: 'steam',
          game_hash: 'test_hash_123'
        }),
        all: () => Promise.resolve({ 
          results: [{ 
            id: 1, 
            user_id: '550e8400-e29b-41d4-a716-446655440001', 
            name: 'Test Game',
            app_id: '123',
            store: 'steam',
            game_hash: 'test_hash_123',
            rating: 0,
            played: false,
            hide: false,
            later: false,
            review_score: 0,
            metacritic_score: 0,
            reviews_rating: 0,
            found_game_name: 'Test Game',
            store_link: '',
            corrected_app_id: '0'
          }],
          success: true 
        })
      })
    })
  } as any,
  ASSETS: {} as any,
  FEATURE_FLAGS: {} as any,
  JWT_SECRET: 'test-secret',
  ENVIRONMENT: 'test'
}

const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  email: 'test@example.com',
  username: 'testuser',
  created_at: new Date().toISOString()
}

describe('Games Routes', () => {
  beforeEach(() => {
    // Mock the requireAuth function to return our test user
    vi.spyOn(authMiddleware, 'requireAuth').mockResolvedValue(mockUser)
  })

  it('should create a new game', async () => {
    const request = new Request('http://localhost/api/games', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        name: 'Test Game',
        store: 'steam',
        app_id: '123'
      })
    })

    const response = await handleGamesRoutes(request, mockEnv, {} as any)
    expect(response).toBeTruthy()
    expect(response!.status).toBe(201)
    
    const data = await response!.json() as any
    expect(data.success).toBe(true)
    expect(data.game.name).toBe('Test Game')
  })

  it('should get user games', async () => {
    const request = new Request('http://localhost/api/games', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    })

    const response = await handleGamesRoutes(request, mockEnv, {} as any)
    expect(response).toBeTruthy()
    expect(response!.status).toBe(200)
    
    const data = await response!.json() as any
    expect(data.success).toBe(true)
    expect(Array.isArray(data.games)).toBe(true)
  })

  it('should get user games in legacy format', async () => {
    const request = new Request('http://localhost/api/games/legacy', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    })

    const response = await handleGamesRoutes(request, mockEnv, {} as any)
    expect(response).toBeTruthy()
    expect(response!.status).toBe(200)
    
    const data = await response!.json() as any[]
    expect(Array.isArray(data)).toBe(true)
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('game_hash')
      expect(data[0]).toHaveProperty('name')
      expect(data[0]).toHaveProperty('rating')
    }
  })

  it('should require authentication', async () => {
    // Mock auth failure
    vi.spyOn(authMiddleware, 'requireAuth').mockRejectedValue(new Error('Invalid token'))
    
    const request = new Request('http://localhost/api/games', {
      method: 'GET'
    })

    const response = await handleGamesRoutes(request, mockEnv, {} as any)
    expect(response).toBeTruthy()
    expect(response!.status).toBe(401)
  })

  it('should validate required fields', async () => {
    const request = new Request('http://localhost/api/games', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        // Missing required fields
      })
    })

    const response = await handleGamesRoutes(request, mockEnv, {} as any)
    expect(response).toBeTruthy()
    expect(response!.status).toBe(400)
    
    const data = await response!.json() as any
    expect(data.error).toContain('Name and store are required')
  })
})
