import type {
    Env,
    CreateGameRequest,
} from '../types'
import {defaultGameApplicationService} from "../application/factories/defaultGameApplicationService";
import type {PreviewGameCommand} from "../application/commands";
import {Hono} from "hono";
import {jwt} from "hono/jwt"

export const gamesApp = new Hono<{ Bindings: Env }>()

gamesApp.use('*', async (c, next) => {
    return jwt({secret: c.env.JWT_SECRET})(c, next)
})

gamesApp.post('/api/games', async (c) => {
    const body = await c.req.json() as CreateGameRequest

    // Validate required fields
    if (!body.name || !body.store) {
        return c.json({ error: 'Name and store are required' }, 400)
    }

    const gameService = defaultGameApplicationService(c.env)

    const command: PreviewGameCommand = {
        sourceId: Number(body.app_id),
        store: body.store,
        name: body.name
    }
    const game = await gameService.previewGame(command)
    console.log(game)
    return c.json({success: true, game}, 201)
})

gamesApp.get('/api/games', async (c) => {
    return c.json({ success: true, games: [] })
})

// GET /api/games/legacy - Get user's game library in legacy format
gamesApp.get('/api/games/legacy', async (c) => {
    return c.json([])
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
