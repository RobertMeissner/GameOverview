import {D1GameRepository} from "../../adapters/repositories/D1GameRepository";
import type {Env} from "../../types";
import {GameApplicationService} from "../services/GameApplicationService";
import {FetchHttpClient} from "../../adapters/http/FetchHttpClient";
import {SteamAdapter} from "../../adapters/external/SteamAdapter";
import {D1CacheStrategy} from "../../adapters/cache/D1CacheStrategy";
import {BasicEnricher} from "../../adapters/external/BasicEnricher";


export function defaultGameApplicationService (env: Env): GameApplicationService {
    const steamCacheStrategy = new D1CacheStrategy()
    const httpClient = new FetchHttpClient()
    const externalSources = new SteamAdapter(steamCacheStrategy, httpClient)
    const enricher = new BasicEnricher()
    const gameRepository = new D1GameRepository(env.DB)
    return new GameApplicationService(externalSources, enricher, gameRepository)
}
