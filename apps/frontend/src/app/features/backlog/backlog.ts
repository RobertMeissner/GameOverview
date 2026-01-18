import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {GamesService} from '../../services/games.service';
import {CollectionEntry} from '../../domain/entities/CollectionEntry';

export type SortField = 'name' | 'rating' | 'playtime';
export type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-backlog',
  imports: [CommonModule, FormsModule],
  templateUrl: './backlog.html',
  styleUrl: './backlog.scss',
})
export class Backlog implements OnInit {
  ngOnInit(): void {
    this.loadGames();
  }

  private gamesService = inject(GamesService);

  games = signal<CollectionEntry[]>([]);

  sortField = signal<SortField>('rating');
  sortDirection = signal<SortDirection>('desc');
  selectedGenres = signal<string[]>([]);

  // Compute all unique genres from games
  availableGenres = computed(() => {
    const allGenres = this.games().flatMap(game => game.genres || []);
    return [...new Set(allGenres)].sort();
  });

  filteredAndSortedGames = computed(() => {
    const allGames = this.games();
    const genreFilter = this.selectedGenres();
    const field = this.sortField();
    const direction = this.sortDirection();

    // Filter by genres (AND logic - game must have ALL selected genres)
    let filtered: CollectionEntry[];
    if (genreFilter.length > 0) {
      filtered = allGames.filter(game =>
        genreFilter.every(genre => (game.genres || []).includes(genre))
      );
    } else {
      filtered = [...allGames];
    }

    // Sort games
    filtered.sort((a, b) => {
      let comparison = 0;
      if (field === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (field === 'rating') {
        comparison = a.rating - b.rating;
      } else if (field === 'playtime') {
        const aHours = a.storeLinks?.hltbMainHours ?? Infinity;
        const bHours = b.storeLinks?.hltbMainHours ?? Infinity;
        comparison = aHours - bHours;
      }
      return direction === 'asc' ? comparison : -comparison;
    });

    return filtered;
  });

  // Keep old name for backwards compatibility
  sortedGames = this.filteredAndSortedGames;

  setSortField(field: SortField): void {
    if (this.sortField() === field) {
      this.sortDirection.update(dir => dir === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set(field === 'rating' ? 'desc' : 'asc');
    }
  }

  onFlagChange(game: CollectionEntry): void {
    const updates = {
      markedAsPlayed: game.markedAsPlayed,
      markedAsHidden: game.markedAsHidden,
      markedForLater: game.markedForLater
    };
    this.gamesService.updateGameFlags(game.id, updates).subscribe({
      next: () => {
        if (!game.markedForLater) {
          // Remove from backlog instantly instead of full reload
          this.games.update(games => games.filter(g => g.id !== game.id));
        } else {
          // Update local signal to trigger reactive updates
          this.games.update(games => games.map(g =>
            g.id === game.id ? {...g, ...updates} : g
          ));
        }
      },
      error: err => {
        console.error(err);
      }
    });
  }

  private loadGames(): void {
    this.gamesService.getBacklogGames().subscribe({
      next: games => {
        this.games.set(games);
      },
      error: err => {
        console.error(err);
      }
    });
  }

  // Generate store search URLs for games without direct links
  getSteamSearchUrl(gameName: string): string {
    return `https://store.steampowered.com/search/?term=${encodeURIComponent(gameName)}`;
  }

  getGogSearchUrl(gameName: string): string {
    return `https://www.gog.com/games?search=${encodeURIComponent(gameName)}`;
  }

  getEpicSearchUrl(gameName: string): string {
    return `https://store.epicgames.com/browse?q=${encodeURIComponent(gameName)}`;
  }

  getHltbSearchUrl(gameName: string): string {
    return `https://howlongtobeat.com/?q=${encodeURIComponent(gameName)}`;
  }

  formatPlaytime(hours: number | null | undefined): string {
    if (hours === null || hours === undefined) return '?h';
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${Math.round(hours * 10) / 10}h`;
  }

  toggleGenre(genre: string): void {
    this.selectedGenres.update(genres => {
      if (genres.includes(genre)) {
        return genres.filter(g => g !== genre);
      } else {
        return [...genres, genre];
      }
    });
  }

  isGenreSelected(genre: string): boolean {
    return this.selectedGenres().includes(genre);
  }

  clearGenreFilter(): void {
    this.selectedGenres.set([]);
  }
}
