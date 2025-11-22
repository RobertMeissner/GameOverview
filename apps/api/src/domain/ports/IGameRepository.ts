import type {Game} from "../entities/Game";
import type {GAME_ID} from "./IExternalDataSource";

export interface IGameRepository {
    save(game: Game): Promise<void>;

    findById(id: GAME_ID): Promise<Game | null>;

    update(game: Game): Promise<void>;

    delete(game: Game): Promise<void>;
}
