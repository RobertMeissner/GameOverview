import {ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {GamesService} from '../../services/games.service';
import {ScraperService} from '../../services/scraper.service';
import {AdminGameEntry} from '../../domain/entities/AdminGameEntry';
import {ScrapedGameInfo} from '../../domain/entities/ScrapedGameInfo';
import {forkJoin} from 'rxjs';

export type SortField = 'name' | 'rating' | 'steamAppId';
export type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-admin-panel',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPanel implements OnInit {
  private gamesService = inject(GamesService);
  private scraperService = inject(ScraperService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.loadGames();
  }

  games = signal<AdminGameEntry[]>([]);
  editingGame = signal<AdminGameEntry | null>(null);
  editSteamAppId = signal<number | null>(null);
  editSteamName = signal<string | null>(null);
  editGogId = signal<number | null>(null);
  editGogName = signal<string | null>(null);
  editMetacriticScore = signal<number | null>(null);
  editMetacriticName = signal<string | null>(null);

  filterMissingAppId = signal(false);
  filterNameMismatch = signal(false);

  sortField = signal<SortField>('name');
  sortDirection = signal<SortDirection>('asc');

  // Rescrape modal state
  rescrapeModalOpen = signal(false);
  rescrapeGame = signal<AdminGameEntry | null>(null);
  rescrapeSearchQuery = signal('');
  rescrapeSearchResults = signal<ScrapedGameInfo[]>([]);
  rescrapeSearching = signal(false);
  rescrapeInProgress = signal(false);
  rescrapeMessage = signal<{type: 'success' | 'error', text: string} | null>(null);

  // Rescrape all state
  rescrapeAllModalOpen = signal(false);
  rescrapeAllInProgress = signal(false);
  rescrapeAllProgress = signal(0);
  rescrapeAllTotal = signal(0);
  rescrapeAllSuccessCount = signal(0);
  rescrapeAllFailCount = signal(0);

  filteredAndSortedGames = computed(() => {
    const allGames = this.games();
    const showMissingAppId = this.filterMissingAppId();
    const showNameMismatch = this.filterNameMismatch();
    const field = this.sortField();
    const direction = this.sortDirection();

    let filtered: AdminGameEntry[];
    if (!showMissingAppId && !showNameMismatch) {
      filtered = [...allGames];
    } else {
      filtered = allGames.filter(game =>
        (showMissingAppId && game.steamAppId === null) ||
        (showNameMismatch && game.steamName !== null && game.steamName !== game.name)
      );
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      if (field === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (field === 'rating') {
        comparison = a.rating - b.rating;
      } else if (field === 'steamAppId') {
        const aVal = a.steamAppId ?? -1;
        const bVal = b.steamAppId ?? -1;
        comparison = aVal - bVal;
      }
      return direction === 'asc' ? comparison : -comparison;
    });

    return filtered;
  });

  setSortField(field: SortField): void {
    if (this.sortField() === field) {
      this.sortDirection.update(dir => dir === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set(field === 'rating' ? 'desc' : 'asc');
    }
  }

  startEdit(game: AdminGameEntry): void {
    this.editingGame.set(game);
    this.editSteamAppId.set(game.steamAppId);
    this.editSteamName.set(game.steamName);
    this.editGogId.set(game.gogId);
    this.editGogName.set(game.gogName);
    this.editMetacriticScore.set(game.metacriticScore);
    this.editMetacriticName.set(game.metacriticName);
  }

  cancelEdit(): void {
    this.editingGame.set(null);
    this.editSteamAppId.set(null);
    this.editSteamName.set(null);
    this.editGogId.set(null);
    this.editGogName.set(null);
    this.editMetacriticScore.set(null);
    this.editMetacriticName.set(null);
  }

  saveEdit(): void {
    const game = this.editingGame();
    if (!game) return;

    const updates = {
      steamAppId: this.editSteamAppId(),
      steamName: this.editSteamName(),
      gogId: this.editGogId(),
      gogName: this.editGogName(),
      metacriticScore: this.editMetacriticScore(),
      metacriticName: this.editMetacriticName()
    };

    this.gamesService.updateCatalogValues(game.id, updates)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // Update local data instead of full reload
          this.games.update(games => games.map(g =>
            g.id === game.id ? {...g, ...updates} : g
          ));
          this.cancelEdit();
        },
        error: err => console.error(err)
      });
  }

  onFlagChange(game: AdminGameEntry): void {
    this.gamesService.updateGameFlags(game.id, {
      markedAsPlayed: game.markedAsPlayed,
      markedAsHidden: game.markedAsHidden,
      markedForLater: game.markedForLater
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: err => console.error(err)
      });
  }

  private loadGames(): void {
    this.gamesService.getAdminGames()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: games => this.games.set(games),
        error: err => console.error(err)
      });
  }

  // Rescrape modal methods
  openRescrapeModal(game: AdminGameEntry): void {
    this.rescrapeGame.set(game);
    this.rescrapeSearchQuery.set(game.name);
    this.rescrapeSearchResults.set([]);
    this.rescrapeMessage.set(null);
    this.rescrapeModalOpen.set(true);
    this.searchIgdb();
  }

  closeRescrapeModal(): void {
    this.rescrapeModalOpen.set(false);
    this.rescrapeGame.set(null);
    this.rescrapeSearchQuery.set('');
    this.rescrapeSearchResults.set([]);
    this.rescrapeMessage.set(null);
  }

  searchIgdb(): void {
    const query = this.rescrapeSearchQuery();
    if (!query.trim()) return;

    this.rescrapeSearching.set(true);
    this.rescrapeMessage.set(null);
    this.scraperService.searchGames(query, 10)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.rescrapeSearchResults.set(result.results);
          this.rescrapeSearching.set(false);
        },
        error: err => {
          console.error(err);
          this.rescrapeSearching.set(false);
          this.rescrapeMessage.set({type: 'error', text: 'Search failed. Please try again.'});
        }
      });
  }

  rescrapeWithIgdbId(igdbId: number): void {
    const game = this.rescrapeGame();
    if (!game) return;

    this.rescrapeInProgress.set(true);
    this.rescrapeMessage.set(null);
    this.gamesService.rescrapeGame(game.id, {igdbId})
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.rescrapeInProgress.set(false);
          if (result.success) {
            this.rescrapeMessage.set({type: 'success', text: result.message || 'Game data updated successfully!'});
            this.updateGameInList(game.id, result.updatedFields);
          } else {
            this.rescrapeMessage.set({type: 'error', text: result.message || 'Rescrape failed.'});
          }
        },
        error: err => {
          console.error(err);
          this.rescrapeInProgress.set(false);
          this.rescrapeMessage.set({type: 'error', text: 'Rescrape failed. Please try again.'});
        }
      });
  }

  rescrapeAutomatic(): void {
    const game = this.rescrapeGame();
    if (!game) return;

    this.rescrapeInProgress.set(true);
    this.rescrapeMessage.set(null);
    this.gamesService.rescrapeGame(game.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.rescrapeInProgress.set(false);
          if (result.success) {
            this.rescrapeMessage.set({type: 'success', text: result.message || 'Game data updated successfully!'});
            this.updateGameInList(game.id, result.updatedFields);
          } else {
            this.rescrapeMessage.set({type: 'error', text: result.message || 'Rescrape failed.'});
          }
        },
        error: err => {
          console.error(err);
          this.rescrapeInProgress.set(false);
          this.rescrapeMessage.set({type: 'error', text: 'Rescrape failed. Please try again.'});
        }
      });
  }

  private updateGameInList(gameId: string, updatedFields: any): void {
    if (!updatedFields) return;
    this.games.update(games => games.map(g => {
      if (g.id !== gameId) return g;
      return {
        ...g,
        steamAppId: updatedFields.steamAppId ?? g.steamAppId,
        gogLink: updatedFields.gogLink ?? g.gogLink,
        // Append timestamp to force thumbnail refresh
        thumbnailUrl: g.thumbnailUrl + '?t=' + Date.now()
      };
    }));
  }

  // Rescrape All functionality
  openRescrapeAllModal(): void {
    this.rescrapeAllModalOpen.set(true);
    this.rescrapeAllProgress.set(0);
    this.rescrapeAllTotal.set(this.filteredAndSortedGames().length);
    this.rescrapeAllSuccessCount.set(0);
    this.rescrapeAllFailCount.set(0);
  }

  closeRescrapeAllModal(): void {
    this.rescrapeAllModalOpen.set(false);
    this.rescrapeAllInProgress.set(false);
  }

  startRescrapeAll(): void {
    const gamesToRescrape = this.filteredAndSortedGames();
    if (gamesToRescrape.length === 0) return;

    this.rescrapeAllInProgress.set(true);
    this.rescrapeAllProgress.set(0);
    this.rescrapeAllTotal.set(gamesToRescrape.length);
    this.rescrapeAllSuccessCount.set(0);
    this.rescrapeAllFailCount.set(0);

    // Process games sequentially to avoid overwhelming the API
    this.processNextGame(gamesToRescrape, 0);
  }

  private processNextGame(games: AdminGameEntry[], index: number): void {
    if (index >= games.length || !this.rescrapeAllInProgress()) {
      this.rescrapeAllInProgress.set(false);
      // Reload games to get updated data
      this.loadGames();
      return;
    }

    const game = games[index];
    this.rescrapeAllProgress.set(index + 1);

    this.gamesService.rescrapeGame(game.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          if (result.success) {
            this.rescrapeAllSuccessCount.update(c => c + 1);
          } else {
            this.rescrapeAllFailCount.update(c => c + 1);
          }
          // Small delay to avoid rate limiting
          setTimeout(() => this.processNextGame(games, index + 1), 500);
        },
        error: () => {
          this.rescrapeAllFailCount.update(c => c + 1);
          setTimeout(() => this.processNextGame(games, index + 1), 500);
        }
      });
  }

  cancelRescrapeAll(): void {
    this.rescrapeAllInProgress.set(false);
  }
}
