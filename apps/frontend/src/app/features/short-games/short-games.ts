import {Component, inject, OnInit, signal} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {CollectionEntry} from '../../domain/entities/CollectionEntry';
import {GamesService} from '../../services/games.service';

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
    return `https://www.gog.com/en/games?query=${encodeURIComponent(gameName)}&order=desc:score`;
  }

  getEpicSearchUrl(gameName: string): string {
    return `https://store.epicgames.com/browse?q=${encodeURIComponent(gameName)}`;
  }

  getHltbSearchUrl(gameName: string): string {
    return `https://howlongtobeat.com/?q=${encodeURIComponent(gameName)}`;
  }

  formatPlaytime(hours: number | null | undefined): string {
    if (hours == null) return 'N/A';
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
}
