import type {
    Env,
    CreateGameRequest,
} from '../types'
import {defaultGameApplicationService} from "../application/factories/defaultGameApplicationService";
import type {PreviewGameCommand} from "../application/commands";
import {Hono} from "hono";
import {jwt} from "hono/jwt"

export const gamesApp = new Hono<{ Bindings: Env }>()

// Apply JWT auth to all routes
gamesApp.use('*', async (c, next) => {
    console.log("auth received by Hono")
    return jwt({secret: c.env.JWT_SECRET})(c, next)
})

// POST /api/games - Add a new game to user's library
gamesApp.post('/api/games', async (c) => {
    const body = await c.req.json() as CreateGameRequest
    const gameService = defaultGameApplicationService(c.env)

    const command: PreviewGameCommand = {
        sourceId: Number(body.app_id),
        store: body.store,
        name: body.name
    }
    const game = await gameService.previewGame(command)
    return c.json({success: true, game}, 201)
})

gamesApp.get('/api/games', async (c) => {
    return c.json({})
})

// GET /api/games/legacy - Get user's game library in legacy format
gamesApp.get('/api/games/legacy', async (c) => {
    return c.json({})
})

// GET /api/games/:id - Get a specific game
gamesApp.get('/api/games/:id', async (c) => {
    return c.json({})
})

// PUT /api/games/:id - Update a game
gamesApp.put('/api/games/:id', async (c) => {
    return c.json({})
})

// DELETE /api/games/:id - Delete a game
gamesApp.delete('/api/games/:id', async (c) => {
    return c.json({})
})

export async function handleGamesRoutes(request: Request, env: Env, ctx: ExecutionContext): Promise<Response | null> {
    // Forward all /api/games routes to Hono
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api/games')) {
        return gamesApp.fetch(request, env, ctx)
    }
    return null
}
