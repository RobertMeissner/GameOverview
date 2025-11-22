import type {IGameRepository} from "../../domain/ports/IGameRepository";
import {Game} from "../../domain/entities/Game";
import type {GAME_ID, GAME_NAME} from "../../domain/ports/IExternalDataSource";

export class D1GameRepository implements IGameRepository {
    constructor(private db: D1Database){}

    async save(game: Game): Promise<void> {
        console.log("save")
        return Promise.resolve()
    }
    async findById(id: GAME_ID): Promise<Game | null> {
        return Promise.resolve(null)
    }
    async findByName(name: GAME_NAME): Promise<Game | null> {
        return null
    }

    private toDomain(row: any): Game {
        return new Game("")
    }


    async update(game: Game): Promise<void> {
        return Promise.resolve()
    }

    async delete(game: Game): Promise<void>{
        return Promise.resolve()
    }
}
