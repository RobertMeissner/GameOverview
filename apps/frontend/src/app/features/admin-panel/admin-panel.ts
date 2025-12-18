import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {GamesService} from '../../services/games.service';
import {AdminGameEntry} from '../../domain/entities/AdminGameEntry';

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

  games = signal<AdminGameEntry[]>([]);
  editingGame = signal<AdminGameEntry | null>(null);
  editSteamAppId = signal<number | null>(null);
  editSteamName = signal<string | null>(null);

  filterMissingAppId = signal(false);
  filterNameMismatch = signal(false);

  sortField = signal<SortField>('name');
  sortDirection = signal<SortDirection>('asc');

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
  }

  cancelEdit(): void {
    this.editingGame.set(null);
    this.editSteamAppId.set(null);
    this.editSteamName.set(null);
  }

  saveEdit(): void {
    const game = this.editingGame();
    if (!game) return;

    this.gamesService.updateCatalogValues(game.id, {
      steamAppId: this.editSteamAppId(),
      steamName: this.editSteamName()
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
}
