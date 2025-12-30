import {Component, inject, OnInit, signal} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {CollectionEntry} from '../../domain/entities/CollectionEntry';
import {GamesService} from '../../services/games.service';

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
    const updates = {
      markedAsPlayed: game.markedAsPlayed ?? false,
      markedAsHidden: game.markedAsHidden ?? false,
      markedForLater: game.markedForLater ?? false
    };
    this.gamesService.updateGameFlags(game.id, updates).subscribe({
      next: () => {
        // Update local signal to trigger reactive updates
        this.games.update(games => games.map(g =>
          g.id === game.id ? {...g, ...updates} : g
        ));
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
