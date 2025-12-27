export interface StoreLinks {
  steamLink: string | null;
  gogLink: string | null;
  metacriticLink: string | null;
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
}
