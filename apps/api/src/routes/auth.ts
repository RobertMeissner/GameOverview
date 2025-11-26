import {AuthUtils, UserService} from '../utils/auth.js'
import type {Env, CreateUserRequest, LoginRequest, AuthResponse, ApiError, UserResponse} from '../types'
import {Hono} from "hono";
import {createMiddleware} from 'hono/factory'
import {cors} from "hono/cors"

type Variables = {
    authUtils: AuthUtils
    userService: UserService
}

export const serviceMiddleware = createMiddleware<{ Bindings: Env; Variables: Variables }>(async (ctx, next) => {
    ctx.set("authUtils", new AuthUtils(ctx.env.JWT_SECRET))
    ctx.set("userService", new UserService(ctx.env.DB))
    await next()
})

export const authApp = new Hono<{ Bindings: Env; Variables: Variables }>()

authApp.use("*", serviceMiddleware)


authApp.post("/api/auth/register", async (ctx, next) => {
    const body = await ctx.req.json() as CreateUserRequest
    const {email, username, password} = body
    const authUtils = ctx.get("authUtils")
    const userService = ctx.get("userService")

    if (!email || !username || !password) {
        const errorResponse: ApiError = {
            error: 'Email, username, and password are required'
        }
        return ctx.json(errorResponse, 400)
    }

    if (password.length < 6) {
        const errorResponse: ApiError = {
            error: 'Password must be at least 6 characters long'
        }
        return ctx.json(errorResponse, 400, {'Content-Type': 'application/json'})
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        const errorResponse: ApiError = {
            error: 'Invalid email format'
        }
        return ctx.json(errorResponse, 400, {'Content-Type': 'application/json'})
    }

    try {
        const user = await userService.createUser(email, username, password, authUtils)

        const token = await authUtils.createJWT({
            userId: user.id,
            email: user.email,
            username: user.username
        })

        const response: AuthResponse = {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                created_at: user.created_at
            },
            token
        }
        return ctx.json(response, 201,  {
            'Content-Type': 'application/json',
            'Set-Cookie': `auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/`
        })
    } catch (error: any) {
        const errorResponse: ApiError = {
            error: error.message
        }
        return ctx.json(errorResponse, 400, {'Content-Type': 'application/json'})
    }
})

authApp.post("/api/auth/login", async (ctx, next) => {
    const body = await ctx.req.json() as LoginRequest
    const authUtils = ctx.get("authUtils")
    const userService = ctx.get("userService")
    const {emailOrUsername, password} = body

    if (!emailOrUsername || !password) {
        const errorResponse: ApiError = {
            error: 'Email/username and password are required'
        }
        return ctx.json(errorResponse, 400)
    }

    try {
        const user = await userService.authenticateUser(emailOrUsername, password, authUtils)

        const token = await authUtils.createJWT({
            userId: user.id,
            email: user.email,
            username: user.username
        })

        const response: AuthResponse = {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                created_at: user.created_at
            },
            token
        }

        return ctx.json(response, 200, {
            'Content-Type': 'application/json',
            'Set-Cookie': `auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/`
        })
    } catch (error: any) {
        const errorResponse: ApiError = {
            error: 'Invalid credentials'
        }
        return ctx.json(errorResponse, 401)
    }
})

authApp.post("/api/auth/logout", async (ctx, next) => {
    return ctx.json({
        success: true,
        message: 'Logged out successfully',
    }, 200, {
        'Content-Type': 'application/json',
        'Set-Cookie': `auth_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`
    })
})

authApp.get("/api/auth/me", async (ctx, next) => {

    const authHeader = ctx.req.header('Authorization')
    const cookieHeader = ctx.req.header('Cookie')

    const authUtils = ctx.get("authUtils")
    const userService = ctx.get("userService")
    let token: string | null = null
    if (authHeader) {
        token = authUtils.extractTokenFromHeader(authHeader)  // ✅ Type-safe!
    }
    if (!token && cookieHeader) {
        token = authUtils.extractTokenFromCookie(cookieHeader)  // ✅ Type-safe!
    }

    if (token === null) {
        const errorResponse: ApiError = {
            error: 'No authentication token provided'
        }
        return ctx.json(errorResponse, 401)
    }

    try {
        const payload = await authUtils.verifyJWT(token)
        const user = await userService.findUserById(payload.userId)

        if (!user) {
            const errorResponse: ApiError = {
                error: 'User not found'
            }
            return ctx.json(errorResponse, 404)
        }

        const userFoundResponse: UserResponse = {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                created_at: user.created_at
            }
        }
        return ctx.json(userFoundResponse, 200)
    } catch (error: any) {
        const errorResponse: ApiError = {
            error: 'Invalid or expired token'
        }
        return ctx.json(errorResponse, 401)
    }
})
