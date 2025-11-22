import {describe, it, expect, beforeEach, vi} from "vitest";
import type {AddGameCommand, PreviewGameCommand} from "../commands";
import {GameApplicationService} from "./GameApplicationService";
import type {IGameRepository} from "../../domain/ports/IGameRepository";
import type {IGameEnricher} from "../../domain/ports/IGameEnricher";
import type {IExternalDataSource} from "../../domain/ports/IExternalDataSource";

describe("Game Application Service", () => {

    let service: GameApplicationService
    let mockEnricher: IGameEnricher
    let mockRepository: IGameRepository
    let mockExternalSource: IExternalDataSource
    beforeEach(() => {

        mockEnricher = {
            configure: vi.fn(),
            enrich: vi.fn((game) => game)
        }
        mockRepository = {
            save: vi.fn(),
            findById: vi.fn(),
            delete: vi.fn(),
            update: vi.fn(),
        }
        mockExternalSource = {
            gameById: vi.fn(),
            gameByName: vi.fn(), search: vi.fn(), forceById: vi.fn()
        }
        service = new GameApplicationService(mockExternalSource, mockEnricher, mockRepository);
    })
    describe("preview game", () => {

        it("returns empty game", async () => {
            const command: PreviewGameCommand = {
                name: "",
                store: "steam"
            }
            const result = await service.previewGame(command);
            expect(result).toBeNull()
            expect(mockRepository.save).not.toHaveBeenCalled()
        })
        it("returns game", async () => {
            const command: PreviewGameCommand = {
                name: "Stardew Valley",
                sourceId: 413150,
                store: "steam"
            }
            const result = await service.previewGame(command);
            expect(result).toBeDefined()
            expect(result).not.toBeNull()
            expect(mockRepository.save).not.toHaveBeenCalled()
            console.log(result)
            expect(result!.name).toEqual("Stardew Valley")
        })
    })

    describe("add game", () => {
        it("returns error if invalid name or app_id", async () => {
            const command: AddGameCommand = {
                name: "",
                sourceId: 0,
                store: "steam"
            }
            await expect(service.addGame(command)).rejects.toThrow("name is required")
        })
        it("returns new game", async () => {
            const command: AddGameCommand = {
                name: "Stardew Valley",
                store: "steam",
                sourceId: 413150
            }
            const result = await service.addGame(command);
            expect(result).toBeDefined()
            expect(mockRepository.save).toHaveBeenCalled()
            expect(result!.name).toEqual("Stardew Valley")
        })
    })
})
