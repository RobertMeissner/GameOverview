import {describe, it, expect, beforeEach, vi} from "vitest"
import {app} from "./index";
import type {Env} from "./types";

const createMockEnv = (): Env => {
    const mockDB = {
        prepare: vi.fn().mockReturnThis(),
        bind: vi.fn().mockReturnThis(),
        run: vi.fn(),
        first: vi.fn(),
    }

    return {
        JWT_SECRET: 'test-secret-key-for-testing',
        DB: mockDB as unknown as D1Database,
        ASSETS: {} as Fetcher,
        ENVIRONMENT: 'test'
    }
}

const createMockExecutionContext = (): ExecutionContext => ({
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
    props: {},
})

describe("API", () => {
    let mockEnv: Env
    let mockCtx: ExecutionContext

    beforeEach(() => {
        mockEnv = createMockEnv()
        mockCtx = createMockExecutionContext()
        vi.clearAllMocks()
    })

    describe('CORS Headers', () => {
        it('should include CORS headers in all responses', async () => {
            const preflightRequest = new Request('http://localhost/api/auth/logout', {
                method: 'OPTIONS'
            })
            const preflightResponse = await app.fetch(preflightRequest, mockEnv, mockCtx)

            expect(preflightResponse).not.toBeNull()
            if (preflightResponse !== null) {
                expect(preflightResponse.headers.get('Access-Control-Allow-Methods')).toContain('POST')
                expect(preflightResponse.headers.get('Access-Control-Allow-Headers')).toContain('Authorization')
            }
            const request = new Request('http://localhost/api/auth/logout', {
                method: 'POST'
            })

            const response = await app.fetch(request, mockEnv, mockCtx)
            expect(response).not.toBeNull()

            if (response !== null) {
                expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
                expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true')
            }
        })
    })
})
