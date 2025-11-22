import type {GameStore} from "../types";

export type AddGameCommand = {
    name: string
    sourceId: number
    store: GameStore
}


export type PreviewGameCommand = {
    name?: string
    sourceId?: number
    store: GameStore
}
