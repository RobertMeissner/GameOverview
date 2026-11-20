import {Component, inject, OnInit, signal} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {CollectionEntry} from '../../domain/entities/CollectionEntry';
import {GamesService} from '../../services/games.service';
import {formatPlaytimeHours} from '../../shared/formatters';
import {epicSearchUrl, gogSearchUrl, hltbSearchUrl, steamSearchUrl} from '../../shared/store-links';
import {gameFlagsOf} from '../../domain/entities/GameFlags';

@Component({
  selector: 'app-top-games',
  imports: [FormsModule, DecimalPipe],
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
    const updates = gameFlagsOf(game);
    this.gamesService.updateGameFlags(game.id, updates).subscribe({
      next: () => {
        // Refresh the top games list since flagged games may no longer qualify
        this.topGames();
      },
      error: err => {
        console.error(err);
      }
    });
  }

  protected readonly getSteamSearchUrl = steamSearchUrl;
  protected readonly getGogSearchUrl = gogSearchUrl;
  protected readonly getEpicSearchUrl = epicSearchUrl;
  protected readonly getHltbSearchUrl = hltbSearchUrl;

  protected readonly formatPlaytime = formatPlaytimeHours;
}
