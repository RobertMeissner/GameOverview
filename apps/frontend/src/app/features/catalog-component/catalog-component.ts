import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {GamesService} from '../../services/games.service';
import {Game} from '../../domain/entities/game.model';

@Component({
  selector: 'app-catalog-component',
  imports: [CommonModule],
  templateUrl: './catalog-component.html',
  styleUrl: './catalog-component.scss',
})
export class CatalogComponent implements OnInit {
  ngOnInit(): void {
    this.loadGames();
  }

  private gamesService = inject(GamesService);

  games = signal<Game[]>([]);

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
