import type {Game} from "../entities/Game";

export type GAME_ID = string
export type GAME_NAME = string

export interface IExternalDataSource {
    /*
    Interface class for data sources, e.g.
    - Stores: Steam, GoG, ...
    - Metapages: Metacritic, SteamDB, ...
    - Additional content: ProtonDB, HowLongToBeat, ...

    Behaviour
    - get game by store specific id
    - get game by exact name
    - search by text, e.g., through fuzzy matching
    - caches games internally
    - TODO: Clarify if needed: force get game by id to bypass cache

    Data (?)
    cache_strategy

     */



    gameById(id: GAME_ID): Promise<Game | undefined>

    gameByName(name: GAME_NAME): Promise<number | undefined>

    search(query: string): Promise<number[] | undefined>
    forceById(id: GAME_ID): Promise<Game | undefined>
}
