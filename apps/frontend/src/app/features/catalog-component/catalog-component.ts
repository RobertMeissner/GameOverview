import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {GamesService} from '../../services/games.service';
import {ExportService} from '../../services/export.service';
import {CollectionEntry} from '../../domain/entities/CollectionEntry';
import {SortField, SortDirection, sortCollectionEntries, toggleGenre, uniqueGenres} from '../../shared/collection-sort';
import {formatPlaytimeHours} from '../../shared/formatters';
import {epicSearchUrl, gogSearchUrl, hltbSearchUrl, steamSearchUrl} from '../../shared/store-links';
import {gameFlagsOf} from '../../domain/entities/GameFlags';

@Component({
  selector: 'app-catalog-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './catalog-component.html',
  styleUrl: './catalog-component.scss',
})
export class CatalogComponent implements OnInit {
  ngOnInit(): void {
    this.loadGames();
  }

  private gamesService = inject(GamesService);
  private exportService = inject(ExportService);

  games = signal<CollectionEntry[]>([]);

  filterPlayed = signal(false);
  filterHidden = signal(false);
  filterForLater = signal(false);
  filterUnflagged = signal(false);
  selectedGenres = signal<string[]>([]);

  sortField = signal<SortField>('rating');
  sortDirection = signal<SortDirection>('desc');

  availableGenres = computed(() => uniqueGenres(this.games()));

  filteredAndSortedGames = computed(() => {
    const allGames = this.games();
    const showPlayed = this.filterPlayed();
    const showHidden = this.filterHidden();
    const showForLater = this.filterForLater();
    const showUnflagged = this.filterUnflagged();
    const genreFilter = this.selectedGenres();
    const field = this.sortField();
    const direction = this.sortDirection();

    // Filter games by flags
    let filtered: CollectionEntry[];
    if (!showPlayed && !showHidden && !showForLater && !showUnflagged) {
      filtered = [...allGames];
    } else {
      filtered = allGames.filter(game =>
        (showPlayed && game.markedAsPlayed) ||
        (showHidden && game.markedAsHidden) ||
        (showForLater && game.markedForLater) ||
        (showUnflagged && (!game.markedAsPlayed && !game.markedForLater && !game.markedAsHidden))
      );
    }

    // Filter by genres (AND logic - game must have ALL selected genres)
    if (genreFilter.length > 0) {
      filtered = filtered.filter(game =>
        genreFilter.every(genre => (game.genres || []).includes(genre))
      );
    }

    return sortCollectionEntries(filtered, field, direction);
  });

  // Keep old name for backwards compatibility in template
  filteredGames = this.filteredAndSortedGames;

  setSortField(field: SortField): void {
    if (this.sortField() === field) {
      // Toggle direction if same field
      this.sortDirection.update(dir => dir === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      // Default to descending for rating, ascending for name and playtime
      this.sortDirection.set(field === 'rating' ? 'desc' : 'asc');
    }
  }

  onFlagChange(game: CollectionEntry): void {
    const updates = gameFlagsOf(game);
    this.gamesService.updateGameFlags(game.id, updates).subscribe({
      next: () => {
        // Update local signal to trigger reactive filtering
        this.games.update(games => games.map(g =>
          g.id === game.id ? {...g, ...updates} : g
        ));
      },
      error: err => {
        console.error(err);
      }
    });
  }

  private loadGames(): void {
    this.gamesService.getAllGames().subscribe({
      next: games => {
        this.games.set(games)
      },
      error: err => {
        console.error(err);
      }
    })
  }

  exportToMarkdown(): void {
    this.exportService.exportToMarkdown(this.games());
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
