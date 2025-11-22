import {beforeEach, describe, expect, it} from "vitest"
import {SteamAdapter} from "./SteamAdapter";
import {FetchHttpClient} from "../http/FetchHttpClient";
import {InMemoryCache} from "../cache/InMemoryCache";

describe("SteamAdapter", () => {
    let steam_adapter: SteamAdapter;
    beforeEach(()=>{
        const mockHttpClient = new FetchHttpClient()
        const mockCacheStrategy = new InMemoryCache()
        steam_adapter = new SteamAdapter(mockCacheStrategy, mockHttpClient)
    })
    it("Should return an empty object", async () => {
        const game = await steam_adapter.gameById("")
        expect(game).not.toBeDefined()
    })
    it("Should return a correct game", async () => {
        const game = await steam_adapter.gameById("413150")
        expect(game).toBeDefined()
        expect(game?.name).toEqual("Stardew Valley")
    })
})
