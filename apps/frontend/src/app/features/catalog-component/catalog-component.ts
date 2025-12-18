import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {GamesService} from '../../services/games.service';
import {CollectionEntry} from '../../domain/entities/CollectionEntry';

export type SortField = 'name' | 'rating';
export type SortDirection = 'asc' | 'desc';

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

  games = signal<CollectionEntry[]>([]);

  filterPlayed = signal(false);
  filterHidden = signal(false);
  filterForLater = signal(false);
  filterUnflagged = signal(false);

  sortField = signal<SortField>('rating');
  sortDirection = signal<SortDirection>('desc');

  filteredAndSortedGames = computed(() => {
    const allGames = this.games();
    const showPlayed = this.filterPlayed();
    const showHidden = this.filterHidden();
    const showForLater = this.filterForLater();
    const showUnflagged = this.filterUnflagged();
    const field = this.sortField();
    const direction = this.sortDirection();

    // Filter games
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

    // Sort games
    filtered.sort((a, b) => {
      let comparison = 0;
      if (field === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (field === 'rating') {
        comparison = a.rating - b.rating;
      }
      return direction === 'asc' ? comparison : -comparison;
    });

    return filtered;
  });

  // Keep old name for backwards compatibility in template
  filteredGames = this.filteredAndSortedGames;

  setSortField(field: SortField): void {
    if (this.sortField() === field) {
      // Toggle direction if same field
      this.sortDirection.update(dir => dir === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      // Default to descending for rating, ascending for name
      this.sortDirection.set(field === 'rating' ? 'desc' : 'asc');
    }
  }

  onFlagChange(game: CollectionEntry): void {
    this.gamesService.updateGameFlags(game.id, {
      markedAsPlayed: game.markedAsPlayed,
      markedAsHidden: game.markedAsHidden,
      markedForLater: game.markedForLater
    }).subscribe({
      error: err => {
        console.error(err);
      }
    })
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
}
