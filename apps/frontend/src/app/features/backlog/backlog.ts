import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {GamesService} from '../../services/games.service';
import {CollectionEntry} from '../../domain/entities/CollectionEntry';

export type SortField = 'name' | 'rating';
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

  sortedGames = computed(() => {
    const allGames = [...this.games()];
    const field = this.sortField();
    const direction = this.sortDirection();

    allGames.sort((a, b) => {
      let comparison = 0;
      if (field === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (field === 'rating') {
        comparison = a.rating - b.rating;
      }
      return direction === 'asc' ? comparison : -comparison;
    });

    return allGames;
  });

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
}
