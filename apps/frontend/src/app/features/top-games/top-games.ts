import {Component, inject, OnInit, signal} from '@angular/core';
import {Game} from '../../domain/entities/game.model';
import {GamesService} from '../../services/games.service';

@Component({
  selector: 'app-top-games',
  imports: [],
  templateUrl: './top-games.html',
  styleUrl: './top-games.scss',
})
export class TopGames implements OnInit {
  ngOnInit(): void {
    this.topGames();
  }

  private gamesService = inject(GamesService);

  games = signal<Game[]>([]);

  protected topGames(): void {
    this.gamesService.getTopGames().subscribe({
      next: games => {
        this.games.set(games);
      }, error: err => {
        console.log(err)
      }
    })
    ;
  }
}
