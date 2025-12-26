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

export interface ScraperStatus {
  enabled: boolean;
  source: string;
  message: string;
}
