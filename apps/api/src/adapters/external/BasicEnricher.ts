import type {IGameEnricher} from "../../domain/ports/IGameEnricher";
import type {IExternalDataSource} from "../../domain/ports/IExternalDataSource";
import type {Game} from "../../domain/entities/Game";

export class BasicEnricher implements IGameEnricher {
    private externalDataSource?: IExternalDataSource;

    configure(externalDataSource: IExternalDataSource): void {
        this.externalDataSource = externalDataSource;
    }

    async enrich(game: Game): Promise<Game> {
        // Now you can call SteamAdapter methods via the interface
        if (this.externalDataSource && game.steam_app_id) {
            const enrichedData = await this.externalDataSource.gameById(game.steam_app_id.toString());
            if (enrichedData) {
                // Merge the enriched data into the game
                return enrichedData;
            }
        }
        return game;
    }
}
