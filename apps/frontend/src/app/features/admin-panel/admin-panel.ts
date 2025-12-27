import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {GamesService} from '../../services/games.service';
import {ScraperService} from '../../services/scraper.service';
import {AdminGameEntry} from '../../domain/entities/AdminGameEntry';
import {ScrapedGameInfo} from '../../domain/entities/ScrapedGameInfo';

export type SortField = 'name' | 'rating' | 'steamAppId';
export type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-admin-panel',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.scss',
})
export class AdminPanel implements OnInit {
  ngOnInit(): void {
    this.loadGames();
  }

  private gamesService = inject(GamesService);
  private scraperService = inject(ScraperService);

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

    this.gamesService.updateCatalogValues(game.id, {
      steamAppId: this.editSteamAppId(),
      steamName: this.editSteamName(),
      gogId: this.editGogId(),
      gogName: this.editGogName(),
      metacriticScore: this.editMetacriticScore(),
      metacriticName: this.editMetacriticName()
    }).subscribe({
      next: () => {
        this.loadGames();
        this.cancelEdit();
      },
      error: err => {
        console.error(err);
      }
    });
  }

  onFlagChange(game: AdminGameEntry): void {
    this.gamesService.updateGameFlags(game.id, {
      markedAsPlayed: game.markedAsPlayed,
      markedAsHidden: game.markedAsHidden,
      markedForLater: game.markedForLater
    }).subscribe({
      error: err => {
        console.error(err);
      }
    });
  }

  private loadGames(): void {
    this.gamesService.getAdminGames().subscribe({
      next: games => {
        this.games.set(games);
      },
      error: err => {
        console.error(err);
      }
    });
  }

  // Rescrape modal methods
  openRescrapeModal(game: AdminGameEntry): void {
    this.rescrapeGame.set(game);
    this.rescrapeSearchQuery.set(game.name);
    this.rescrapeSearchResults.set([]);
    this.rescrapeMessage.set(null);
    this.rescrapeModalOpen.set(true);
    // Auto-search with game name
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
    this.scraperService.searchGames(query, 10).subscribe({
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
    this.gamesService.rescrapeGame(game.id, {igdbId}).subscribe({
      next: result => {
        this.rescrapeInProgress.set(false);
        if (result.success) {
          this.rescrapeMessage.set({type: 'success', text: result.message || 'Game data updated successfully!'});
          this.loadGames();
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
    this.gamesService.rescrapeGame(game.id).subscribe({
      next: result => {
        this.rescrapeInProgress.set(false);
        if (result.success) {
          this.rescrapeMessage.set({type: 'success', text: result.message || 'Game data updated successfully!'});
          this.loadGames();
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
}
