import { CollectionEntry } from '../domain/entities/CollectionEntry';

export type SortField = 'name' | 'rating' | 'playtime';
export type SortDirection = 'asc' | 'desc';

export function sortCollectionEntries(
  entries: CollectionEntry[],
  field: SortField,
  direction: SortDirection,
): CollectionEntry[] {
  return [...entries].sort((a, b) => {
    let comparison = 0;
    if (field === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (field === 'rating') {
      comparison = a.rating - b.rating;
    } else {
      const aHours = a.storeLinks?.hltbMainHours ?? Infinity;
      const bHours = b.storeLinks?.hltbMainHours ?? Infinity;
      comparison = aHours - bHours;
    }
    return direction === 'asc' ? comparison : -comparison;
  });
}

export function uniqueGenres(entries: CollectionEntry[]): string[] {
  return [...new Set(entries.flatMap((entry) => entry.genres || []))].sort();
}

export function toggleGenre(genres: string[], genre: string): string[] {
  return genres.includes(genre) ? genres.filter((g) => g !== genre) : [...genres, genre];
}
