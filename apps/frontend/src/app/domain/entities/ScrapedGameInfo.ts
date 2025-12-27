export interface ScrapedGameInfo {
  externalId: number;
  name: string;
  summary: string | null;
  coverUrl: string | null;
  rating: number | null;
  releaseYear: number | null;
  genres: string[];
  platforms: string[];
  storeLinks: StoreLink[];
  playtime: PlaytimeInfo | null;
  source: string;
}

export interface StoreLink {
  storeName: string;
  url: string;
  storeId: string | null;
}

export interface PlaytimeInfo {
  mainStoryHours: number | null;
  mainPlusExtrasHours: number | null;
  completionistHours: number | null;
}

export interface GameSearchResult {
  query: string;
  results: ScrapedGameInfo[];
  source: string;
}

export interface EnrichedGameInfo {
  gameInfo: ScrapedGameInfo;
  inLibrary: boolean;
  catalogGameId: string | null;
  matchReason: string | null;
}

export interface EnrichedSearchResult {
  query: string;
  results: EnrichedGameInfo[];
  source: string;
}

export interface AddGameResult {
  success: boolean;
  canonicalGameId: string;
  created: boolean;
  message: string;
}

export interface ScraperStatus {
  enabled: boolean;
  source: string;
  message: string;
}

export interface RescrapeRequest {
  igdbId?: number;
}

export interface RescrapeResult {
  success: boolean;
  gameId: string;
  gameName: string;
  message: string | null;
  updatedFields: RescrapeUpdatedFields | null;
}

export interface RescrapeUpdatedFields {
  thumbnailUrl: string | null;
  steamAppId: number | null;
  steamLink: string | null;
  gogLink: string | null;
  epicLink: string | null;
  rating: number | null;
  genres: string[];
}
