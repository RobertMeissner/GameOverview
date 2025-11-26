import type {IGameRepository} from "../../src/domain/ports/IGameRepository";
import {Game} from "../../src/domain/entities/Game";
import type {GAME_ID} from "../../src/domain/ports/IExternalDataSource";

export class MockGameRepository implements IGameRepository {
    private games = new Map<string, Game>()

    async save(game: Game): Promise<void> {
        this.games.set(game.id, game)
    }

    async findById(id: GAME_ID): Promise<Game | null> {
        return this.games.get(id) || null
    }

    async update(game: Game): Promise<void> {
        this.games.set(game.id, game)
    }

    async delete(game: Game): Promise<void> {
        this.games.delete(game.id)
    }
}
