import {Game} from "../entities/Game";

class GameAggregator {
    aggregate(current_game: Game, updated_game: Game): Game {
        return current_game;
    }
}
