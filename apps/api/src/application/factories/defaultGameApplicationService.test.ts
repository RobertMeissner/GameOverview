import type {Env} from "../../types";
import {describe, it, expect, vi, beforeEach} from "vitest"
import {defaultGameApplicationService} from "./defaultGameApplicationService";

describe("defaultGameApplicationService Factory", () => {
    let mockKV: KVNamespace
    let mockAssets: Fetcher
    beforeEach(() => {
        mockKV = {
            get: vi.fn().mockResolvedValue(null),
            put: vi.fn().mockResolvedValue(undefined),
            delete: vi.fn().mockResolvedValue(undefined),
            list: vi.fn().mockResolvedValue({keys: []}),
            getWithMetadata: vi.fn().mockResolvedValue(null)
        }
        mockAssets = {fetch: vi.fn(), connect: vi.fn()} as Fetcher
    })
    it("should create GameApplicationService without throwing", () => {
        const mockEnv: Env = {
            DB: {} as any, // Mock D1Database
            ASSETS: mockAssets, FEATURE_FLAGS: mockKV, JWT_SECRET: "",
        };

        expect(() => defaultGameApplicationService(mockEnv)).not.toThrow();
    });

    it("should return a GameApplicationService instance with required methods", () => {
        const mockEnv: Env = {
            ASSETS: mockAssets, FEATURE_FLAGS: mockKV, JWT_SECRET: "",
            DB: {} as any
        };

        const service = defaultGameApplicationService(mockEnv);

        expect(service).toBeDefined();
        expect(service.addGame).toBeDefined();
        expect(service.previewGame).toBeDefined();
    });
});
