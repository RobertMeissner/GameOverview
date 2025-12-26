export interface StoreStats {
  totalGames: number;
  steam: StoreCount;
  gog: StoreCount;
  epic: StoreCount;
  metacritic: StoreCount;
  gamesWithoutStore: number;
}

export interface StoreCount {
  name: string;
  count: number;
  storeUrl: string;
}

export interface GameImportRequest {
  name: string;
  store: 'steam' | 'gog' | 'epic';
  storeId?: string;
  storeLink?: string;
  thumbnailUrl?: string;
}

export interface ImportResult {
  name: string;
  gameId: string | null;
  created: boolean;
  message: string;
}

export interface BulkImportResponse {
  created: number;
  updated: number;
  failed: number;
  results: ImportResult[];
}
