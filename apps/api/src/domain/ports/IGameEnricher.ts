import type {Game} from "../entities/Game";
import type {IExternalDataSource} from "./IExternalDataSource";

export interface IGameEnricher {

    configure(enricher: IExternalDataSource): void

    enrich(game: Game): Promise<Game>
}
