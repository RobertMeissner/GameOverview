import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {GamesService} from '../../services/games.service';
import {CollectionEntry} from '../../domain/entities/CollectionEntry';
import {SortField, SortDirection, sortCollectionEntries, toggleGenre, uniqueGenres} from '../../shared/collection-sort';
import {formatPlaytimeHours} from '../../shared/formatters';
import {epicSearchUrl, gogSearchUrl, hltbSearchUrl, steamSearchUrl} from '../../shared/store-links';
import {gameFlagsOf} from '../../domain/entities/GameFlags';

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

  availableGenres = computed(() => uniqueGenres(this.games()));

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

    return sortCollectionEntries(filtered, field, direction);
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
    const updates = gameFlagsOf(game);
    this.gamesService.updateGameFlags(game.id, updates).subscribe({
      next: () => {
        if (!game.markedForLater) {
          // Game left the backlog: reload the list
          this.loadGames();
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

  protected readonly getSteamSearchUrl = steamSearchUrl;
  protected readonly getGogSearchUrl = gogSearchUrl;
  protected readonly getEpicSearchUrl = epicSearchUrl;
  protected readonly getHltbSearchUrl = hltbSearchUrl;

  protected readonly formatPlaytime = formatPlaytimeHours;

  toggleGenre(genre: string): void {
    this.selectedGenres.update(genres => toggleGenre(genres, genre));
  }

  isGenreSelected(genre: string): boolean {
    return this.selectedGenres().includes(genre);
  }

  clearGenreFilter(): void {
    this.selectedGenres.set([]);
  }
}
