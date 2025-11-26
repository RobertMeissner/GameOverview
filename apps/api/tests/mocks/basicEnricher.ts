import type {IGameEnricher} from "../../src/domain/ports/IGameEnricher";
import type {IExternalDataSource} from "../../src/domain/ports/IExternalDataSource";
import {Game} from "../../src/domain/entities/Game";

export class MockGameEnricher implements IGameEnricher {
    private dataSource?: IExternalDataSource

    configure(enricher: IExternalDataSource): void {
        this.dataSource = enricher
    }

    async enrich(game: Game): Promise<Game> {
        if (game.steam_app_id && this.dataSource) {
            const enrichedData = await this.dataSource.gameById(game.steam_app_id.toString())
            if (enrichedData) {
                game.steam_thumbnail_url = enrichedData.steam_thumbnail_url
            }
        }
        return game
    }
}
