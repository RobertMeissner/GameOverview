import type {GAME_ID, GAME_NAME, IExternalDataSource} from "../../src/domain/ports/IExternalDataSource";
import {Game} from "../../src/domain/entities/Game";

export class MockExternalDataSource implements IExternalDataSource {
    async gameById(id: GAME_ID): Promise<Game | undefined> {
        const game = new Game(id)
        game.name = 'Test Game'
        game.steam_app_id = parseInt(id)
        game.steam_thumbnail_url = `https://example.com/thumbnail/${id}.jpg`
        return game
    }

    async gameByName(_name: GAME_NAME): Promise<number | undefined> {
        return 123 // Mock app ID
    }

    async search(_query: string): Promise<number[] | undefined> {
        return [123, 456, 789]
    }

    async forceById(id: GAME_ID): Promise<Game | undefined> {
        return this.gameById(id)
    }
}
