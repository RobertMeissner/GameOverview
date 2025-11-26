import {authApp} from './routes/auth'
import {gamesApp} from './routes/games'
import type {Env, HealthResponse} from './types'
import {Hono} from "hono";
import {cors} from "hono/cors";

export const app = new Hono<{ Bindings: Env }>
app.use("*", cors({
    origin: '*',
    allowMethods: ["GET", " POST", " PUT", " DELETE", " OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true
}))
app.route("api/auth", authApp)
app.route("api/games", gamesApp)

app.get("api/health", (ctx, next) => {
    const healthResponse: HealthResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    }
    return ctx.json(healthResponse, 200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    })
})

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url)
        if (url.pathname.startsWith('/api/')) {
            return app.fetch(request, env, ctx)
        }

        try {
            return await env.ASSETS.fetch(request)
        } catch (e) {
            // If asset not found, serve index.html for SPA routing
            try {
                const indexRequest = new Request(`${url.origin}/index.html`, request)
                return await env.ASSETS.fetch(indexRequest)
            } catch (indexError) {
                return new Response('Not Found', {status: 404})
            }
        }
    },
} satisfies ExportedHandler<Env>
