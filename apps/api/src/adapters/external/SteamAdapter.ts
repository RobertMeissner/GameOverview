import type {GAME_ID, GAME_NAME, IExternalDataSource} from "../../domain/ports/IExternalDataSource";
import type {IHttpClient} from "../../domain/ports/IHttpClient";
import type {SteamApiResponse, SteamGameData} from "../../types";
import {Game} from "../../domain/entities/Game";

export class SteamAdapter implements IExternalDataSource {
    readonly sourceName = "steam"
    readonly url = 'https://store.steampowered.com/api/appdetails'
    // Cache TTL: 7 days in milliseconds
    private readonly STEAM_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

    constructor(cache: ICacheStrategy<SteamGameData>, httpClient: IHttpClient) {
    }

    private isValidId(id: string): boolean {
        return (id.trim().length > 0 && id.length > 0);
    }

    public gameById(id: GAME_ID): Promise<Game | undefined> {
        console.log(id)
        if (this.isValidId(id)) return Promise.resolve(this.fetchSteamData(id))
        return Promise.resolve(undefined)
    }
    public gameByName(name: GAME_NAME): Promise<number | undefined> {
        console.log(name)
        return Promise.resolve(undefined)
    }

    public search(query: string): Promise<number[] | undefined> {
        return Promise.resolve(undefined)
    }

    public forceById(id: GAME_ID): Promise<Game | undefined> {
        return this.gameById(id)
    }

    private async fetchSteamData(appId: string): Promise<Game | undefined > {

        try {
            const response = await fetch(`${this.url}?appids=${appId}`)
            const data = await response.json() as SteamApiResponse
            console.log(data)
            return this.transformSteamApiResponse(data, appId)

        } catch (error: any) {
            console.error('Steam API error:', error)
            return Promise.reject(undefined)
        }
    }

    private transformSteamApiResponse(data: SteamApiResponse, appId: string): Game | undefined {
        if (data[appId]?.success && data[appId].data) {
            const gameData = data[appId].data!
            const game = new Game(appId)
            game.steam_app_id = Number(appId)
            game.steam_thumbnail_url = gameData.header_image
            game.name = gameData.name
            return game
        } else {
            console.error('Steam API error:', data[appId])
            return undefined
        }
    }

}
