import type {SteamGameData} from "../../types";

export class D1CacheStrategy implements ICacheStrategy<SteamGameData> {

    get(key: string): Promise<SteamGameData | null> {
        return Promise.resolve(null)
    }

    set(key: string, value: SteamGameData, ttl?: number): Promise<void> {
        console.log("set", key, value)
        return Promise.resolve()
    }

    invalidate(key: string): Promise<void> {
        console.log("invalidate", key)
        return Promise.resolve()
    }
}
