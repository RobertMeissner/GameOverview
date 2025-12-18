export interface AdminGameEntry {
  id: string;
  name: string;
  thumbnailUrl: string;
  rating: number;
  markedAsPlayed: boolean;
  markedAsHidden: boolean;
  markedForLater: boolean;
  steamAppId: number | null;
  steamName: string | null;
}
