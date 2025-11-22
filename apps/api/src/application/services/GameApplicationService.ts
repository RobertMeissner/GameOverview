import type {IGameRepository} from "../../domain/ports/IGameRepository";
import type {AddGameCommand, PreviewGameCommand} from "../commands";
import {Game} from "../../domain/entities/Game";
import type {IExternalDataSource} from "../../domain/ports/IExternalDataSource";
import type {IGameEnricher} from "../../domain/ports/IGameEnricher";

export class GameApplicationService {
    constructor(private externalSources: IExternalDataSource,
                private enricher: IGameEnricher, private gameRepository: IGameRepository
    ) {

        this.enricher.configure(this.externalSources);
    }

    public async addGame(command: AddGameCommand): Promise<Game> {
        const game: Game = Game.create(command.name);
        const enriched: Game = await this.enricher.enrich(game);
        await this.gameRepository.save(enriched);
        return enriched;
    }


    async previewGame(cmd: PreviewGameCommand): Promise<Game| null> {
        if (cmd.sourceId && cmd.name) {
            let game = Game.create(cmd.name)
            game.steam_app_id = cmd.sourceId
            game = await this.enricher.enrich(game);
            return game
        }
        return null;
    }
}
