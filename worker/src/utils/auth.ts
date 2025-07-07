import type { User, UserWithPassword, JWTPayload, Env } from '../types/index.js'

/**
 * Authentication utilities for JWT handling and password hashing
 */
export class AuthUtils {
  private jwtSecret: string

  constructor(jwtSecret: string) {
    this.jwtSecret = jwtSecret
  }

  // Hash password using Web Crypto API
  async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // Verify password against hash
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const hashedPassword = await this.hashPassword(password)
    return hashedPassword === hash
  }

  // Create JWT token
  async createJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresIn: string = '24h'): Promise<string> {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    }

    const now = Math.floor(Date.now() / 1000)
    const exp = now + this.parseExpiration(expiresIn)

    const jwtPayload: JWTPayload = {
      ...payload,
      iat: now,
      exp: exp
    }

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header))
    const encodedPayload = this.base64UrlEncode(JSON.stringify(jwtPayload))
    
    const signature = await this.sign(`${encodedHeader}.${encodedPayload}`)
    
    return `${encodedHeader}.${encodedPayload}.${signature}`
  }

  // Verify JWT token
  async verifyJWT(token: string): Promise<JWTPayload> {
    const [encodedHeader, encodedPayload, signature] = token.split('.')
    
    if (!encodedHeader || !encodedPayload || !signature) {
      throw new Error('Invalid token format')
    }

    // Verify signature
    const expectedSignature = await this.sign(`${encodedHeader}.${encodedPayload}`)
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature')
    }

    // Decode payload
    const payload = JSON.parse(this.base64UrlDecode(encodedPayload)) as JWTPayload
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      throw new Error('Token expired')
    }

    return payload
  }

  // Sign data using HMAC-SHA256
  private async sign(data: string): Promise<string> {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.jwtSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
    const signatureArray = Array.from(new Uint8Array(signature))
    return this.base64UrlEncode(String.fromCharCode(...signatureArray))
  }

  // Base64 URL encode
  private base64UrlEncode(str: string): string {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  // Base64 URL decode
  private base64UrlDecode(str: string): string {
    str += '='.repeat((4 - str.length % 4) % 4)
    return atob(str.replace(/-/g, '+').replace(/_/g, '/'))
  }

  // Parse expiration string to seconds
  private parseExpiration(expiresIn: string | number): number {
    if (typeof expiresIn === 'number') return expiresIn
    
    const match = expiresIn.match(/^(-?\d+)([smhd])$/)
    if (!match) throw new Error('Invalid expiration format')
    
    const value = parseInt(match[1])
    const unit = match[2]
    
    switch (unit) {
      case 's': return value
      case 'm': return value * 60
      case 'h': return value * 60 * 60
      case 'd': return value * 60 * 60 * 24
      default: throw new Error('Invalid expiration unit')
    }
  }

  // Extract token from Authorization header
  extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    return authHeader.substring(7)
  }

  // Extract token from cookie
  extractTokenFromCookie(cookieHeader: string | null, cookieName: string = 'auth_token'): string | null {
    if (!cookieHeader) return null
    
    const cookies = cookieHeader.split(';').map(c => c.trim())
    const authCookie = cookies.find(c => c.startsWith(`${cookieName}=`))
    
    return authCookie ? authCookie.substring(cookieName.length + 1) : null
  }
}

// Database utilities for user management
export class UserService {
  private db: D1Database

  constructor(db: D1Database) {
    this.db = db
  }

  // Create new user
  async createUser(email: string, username: string, password: string, authUtils: AuthUtils): Promise<User> {
    const passwordHash = await authUtils.hashPassword(password)
    
    try {
      const result = await this.db.prepare(`
        INSERT INTO users (email, username, password_hash)
        VALUES (?, ?, ?)
      `).bind(email, username, passwordHash).run()
      
      return {
        id: result.meta.last_row_id!,
        email,
        username,
        created_at: new Date().toISOString()
      }
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Email or username already exists')
      }
      throw error
    }
  }

  // Find user by email
  async findUserByEmail(email: string): Promise<UserWithPassword | null> {
    const result = await this.db.prepare(`
      SELECT id, email, username, password_hash, created_at
      FROM users
      WHERE email = ?
    `).bind(email).first<UserWithPassword>()
    
    return result
  }

  // Find user by username
  async findUserByUsername(username: string): Promise<UserWithPassword | null> {
    const result = await this.db.prepare(`
      SELECT id, email, username, password_hash, created_at
      FROM users
      WHERE username = ?
    `).bind(username).first<UserWithPassword>()
    
    return result
  }

  // Find user by ID
  async findUserById(id: number): Promise<User | null> {
    const result = await this.db.prepare(`
      SELECT id, email, username, created_at
      FROM users
      WHERE id = ?
    `).bind(id).first<User>()
    
    return result
  }

  // Authenticate user
  async authenticateUser(emailOrUsername: string, password: string, authUtils: AuthUtils): Promise<User> {
    // Try to find user by email first, then username
    let user = await this.findUserByEmail(emailOrUsername)
    if (!user) {
      user = await this.findUserByUsername(emailOrUsername)
    }
    
    if (!user) {
      throw new Error('User not found')
    }

    const isValidPassword = await authUtils.verifyPassword(password, user.password_hash)
    if (!isValidPassword) {
      throw new Error('Invalid password')
    }

    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user
    return userWithoutPassword
  }
}
