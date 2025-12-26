import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ScraperService} from '../../services/scraper.service';
import {ScrapedGameInfo, ScraperStatus} from '../../domain/entities/ScrapedGameInfo';

@Component({
  selector: 'app-game-scraper',
  imports: [CommonModule, FormsModule],
  templateUrl: './game-scraper.html',
  styleUrl: './game-scraper.scss',
})
export class GameScraper implements OnInit {
  private scraperService = inject(ScraperService);

  searchQuery = signal('');
  searchResults = signal<ScrapedGameInfo[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  status = signal<ScraperStatus | null>(null);
  selectedGame = signal<ScrapedGameInfo | null>(null);

  ngOnInit(): void {
    this.loadStatus();
  }

  private loadStatus(): void {
    this.scraperService.getStatus().subscribe({
      next: status => {
        this.status.set(status);
      },
      error: err => {
        console.error('Failed to load scraper status', err);
      }
    });
  }

  searchGames(): void {
    const query = this.searchQuery().trim();
    if (!query) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.selectedGame.set(null);

    this.scraperService.searchGames(query, 10).subscribe({
      next: result => {
        this.searchResults.set(result.results);
        this.isLoading.set(false);
        if (result.results.length === 0) {
          this.errorMessage.set(`No games found for "${query}"`);
        }
      },
      error: err => {
        console.error('Search failed', err);
        this.isLoading.set(false);
        this.errorMessage.set('Failed to search for games. Please try again.');
      }
    });
  }

  selectGame(game: ScrapedGameInfo): void {
    this.selectedGame.set(game);
  }

  clearSelection(): void {
    this.selectedGame.set(null);
  }

  clearResults(): void {
    this.searchResults.set([]);
    this.selectedGame.set(null);
    this.errorMessage.set(null);
  }

  openIgdbLink(): void {
    const query = encodeURIComponent(this.searchQuery().trim());
    window.open(`https://www.igdb.com/search?type=1&q=${query}`, '_blank');
  }
}
