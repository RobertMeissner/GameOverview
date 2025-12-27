import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ScraperService} from '../../services/scraper.service';
import {EnrichedGameInfo, ScraperStatus} from '../../domain/entities/ScrapedGameInfo';

@Component({
  selector: 'app-game-scraper',
  imports: [CommonModule, FormsModule],
  templateUrl: './game-scraper.html',
  styleUrl: './game-scraper.scss',
})
export class GameScraper implements OnInit {
  private scraperService = inject(ScraperService);

  searchQuery = signal('');
  searchResults = signal<EnrichedGameInfo[]>([]);
  isLoading = signal(false);
  isAdding = signal<number | null>(null);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  status = signal<ScraperStatus | null>(null);
  selectedGame = signal<EnrichedGameInfo | null>(null);

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
    this.successMessage.set(null);
    this.selectedGame.set(null);

    this.scraperService.searchGamesEnriched(query, 10).subscribe({
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

  selectGame(game: EnrichedGameInfo): void {
    this.selectedGame.set(game);
  }

  clearSelection(): void {
    this.selectedGame.set(null);
  }

  clearResults(): void {
    this.searchResults.set([]);
    this.selectedGame.set(null);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  addGameToLibrary(game: EnrichedGameInfo, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const externalId = game.gameInfo.externalId;
    this.isAdding.set(externalId);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.scraperService.addGameToLibrary(externalId).subscribe({
      next: result => {
        this.isAdding.set(null);
        this.successMessage.set(`"${game.gameInfo.name}" added to your library!`);

        // Update the search results to mark this game as in library
        this.searchResults.update(results =>
          results.map(r =>
            r.gameInfo.externalId === externalId
              ? {...r, inLibrary: true, catalogGameId: result.canonicalGameId}
              : r
          )
        );

        // Update selected game if it's the one we just added
        if (this.selectedGame()?.gameInfo.externalId === externalId) {
          this.selectedGame.update(g => g ? {...g, inLibrary: true, catalogGameId: result.canonicalGameId} : null);
        }
      },
      error: err => {
        console.error('Failed to add game', err);
        this.isAdding.set(null);
        this.errorMessage.set(`Failed to add "${game.gameInfo.name}" to library.`);
      }
    });
  }

  openIgdbLink(): void {
    const query = encodeURIComponent(this.searchQuery().trim());
    window.open(`https://www.igdb.com/search?type=1&q=${query}`, '_blank');
  }
}
