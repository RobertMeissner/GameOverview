import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {GamesService} from '../../services/games.service';
import {CollectionEntry} from '../../domain/entities/CollectionEntry';

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

  filteredGames = computed(() => {
    const allGames = this.games();
    const showPlayed = this.filterPlayed();
    const showHidden = this.filterHidden();
    const showForLater = this.filterForLater();

    // If no filters are active, show all games
    if (!showPlayed && !showHidden && !showForLater) {
      return allGames;
    }

    // Show games that match ANY of the selected filters
    return allGames.filter(game =>
      (showPlayed && game.markedAsPlayed) ||
      (showHidden && game.markedAsHidden) ||
      (showForLater && game.markedForLater)
    );
  });

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
