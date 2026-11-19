export interface ScrapeHealthReport {
  checkedAt: string;
  providers: ProviderStatus[];
  referenceGames: ReferenceGameCheck[];
  okCount: number;
  failedCount: number;
}

export interface ProviderStatus {
  name: string;
  enabled: boolean;
}

export interface ReferenceGameCheck {
  query: string;
  found: boolean;
  externalId: number | null;
  matchedName: string | null;
  rating: number | null;
  inCatalog: boolean;
  providerChecks: ProviderCheck[];
  thumbnail: ThumbnailCheck | null;
  ok: boolean;
}

export interface ProviderCheck {
  provider: string;
  ok: boolean;
  enriched: boolean;
  message: string;
}

export interface ThumbnailCheck {
  attempted: boolean;
  httpStatus: number;
  ok: boolean;
}
