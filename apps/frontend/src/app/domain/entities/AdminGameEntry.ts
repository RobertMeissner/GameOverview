export interface AdminGameEntry {
  id: string;
  name: string;
  thumbnailUrl: string;
  rating: number;
  markedAsPlayed: boolean;
  markedAsHidden: boolean;
  markedForLater: boolean;
  // Steam data
  steamAppId: number | null;
  steamName: string | null;
  steamLink: string | null;
  // GoG data
  gogId: number | null;
  gogName: string | null;
  gogLink: string | null;
  // IGDB data
  igdbId: number | null;
  igdbLink: string | null;
  // Metacritic data
  metacriticScore: number | null;
  metacriticName: string | null;
  metacriticLink: string | null;
  // Completeness metric
  completenessPercent: number;
}
