export interface StoreLinks {
  steamLink: string | null;
  steamRating: number | null;
  gogLink: string | null;
  metacriticLink: string | null;
  metacriticScore: number | null;
}

export interface StoreOwnership {
  ownedOnSteam: boolean;
  ownedOnGog: boolean;
  ownedOnEpic: boolean;
  ownedOnXbox: boolean;
  ownedOnPlayStation: boolean;
  otherStores: string | null;
}

export interface CollectionEntry {
  id: string;
  name: string;
  rating: number;
  thumbnailUrl: string;
  markedAsPlayed: boolean;
  markedAsHidden: boolean;
  markedForLater: boolean;
  storeLinks: StoreLinks;
  steamPlaytimeMinutes?: number | null; // Steam playtime in minutes
  storeOwnership?: StoreOwnership; // Which stores the user owns this game on
}
