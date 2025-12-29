import {Component, inject, OnInit, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {CollectionEntry} from '../../domain/entities/CollectionEntry';
import {GamesService} from '../../services/games.service';

@Component({
  selector: 'app-top-games',
  imports: [FormsModule],
  templateUrl: './top-games.html',
  styleUrl: './top-games.scss',
})
export class TopGames implements OnInit {
  ngOnInit(): void {
    this.topGames();
  }

  private gamesService = inject(GamesService);

  games = signal<CollectionEntry[]>([]);

  protected topGames(): void {
    this.gamesService.getTopGames().subscribe({
      next: games => {
        this.games.set(games);
      }, error: err => {
        console.log(err)
      }
    });
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
    });
  }
}
