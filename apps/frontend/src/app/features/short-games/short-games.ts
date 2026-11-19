import {Component, inject, OnInit, signal} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {CollectionEntry} from '../../domain/entities/CollectionEntry';
import {GamesService} from '../../services/games.service';
import {formatPlaytimeHours} from '../../shared/formatters';
import {epicSearchUrl, gogSearchUrl, hltbSearchUrl, steamSearchUrl} from '../../shared/store-links';
import {gameFlagsOf} from '../../domain/entities/GameFlags';

@Component({
  selector: 'app-short-games',
  imports: [FormsModule, DecimalPipe],
  templateUrl: './short-games.html',
  styleUrl: './short-games.scss',
})
export class ShortGames implements OnInit {
  private gamesService = inject(GamesService);

  games = signal<CollectionEntry[]>([]);
  loading = signal(false);

  // Filter settings with defaults
  maxHours = signal(5);
  minRating = signal(80);
  sortBy = signal<'rating' | 'playtime'>('rating');

  ngOnInit(): void {
    this.loadGames();
  }

  loadGames(): void {
    this.loading.set(true);
    this.gamesService.getShortGoodGames(this.maxHours(), this.minRating()).subscribe({
      next: games => {
        this.games.set(this.sortGames(games));
        this.loading.set(false);
      },
      error: err => {
        console.error(err);
        this.loading.set(false);
      }
    });
  }

  onFilterChange(): void {
    this.loadGames();
  }

  onSortChange(): void {
    this.games.update(games => this.sortGames([...games]));
  }

  private sortGames(games: CollectionEntry[]): CollectionEntry[] {
    if (this.sortBy() === 'playtime') {
      return games.sort((a, b) => {
        const aHours = a.storeLinks?.hltbMainHours ?? Infinity;
        const bHours = b.storeLinks?.hltbMainHours ?? Infinity;
        return aHours - bHours; // Shortest first
      });
    } else {
      return games.sort((a, b) => b.rating - a.rating); // Highest rating first
    }
  }

  onFlagChange(game: CollectionEntry): void {
    const updates = gameFlagsOf(game);
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

  protected readonly getSteamSearchUrl = steamSearchUrl;
  protected readonly getGogSearchUrl = gogSearchUrl;
  protected readonly getEpicSearchUrl = epicSearchUrl;
  protected readonly getHltbSearchUrl = hltbSearchUrl;

  protected readonly formatPlaytime = formatPlaytimeHours;
}
