import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {StoreService} from '../../services/store.service';
import {BulkImportResponse, GameImportRequest, StoreStats} from '../../domain/entities/StoreStats';

@Component({
  selector: 'app-store-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './store-dashboard.html',
  styleUrl: './store-dashboard.scss',
})
export class StoreDashboard implements OnInit {
  private storeService = inject(StoreService);

  stats = signal<StoreStats | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Import state
  importMode = signal<'none' | 'single' | 'bulk'>('none');
  bulkImportText = signal('');
  selectedStore = signal<'steam' | 'gog' | 'epic'>('steam');
  importResults = signal<BulkImportResponse | null>(null);
  isImporting = signal(false);

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.storeService.getStoreStats().subscribe({
      next: stats => {
        this.stats.set(stats);
        this.isLoading.set(false);
      },
      error: err => {
        console.error('Failed to load store stats', err);
        this.errorMessage.set('Failed to load store statistics');
        this.isLoading.set(false);
      }
    });
  }

  showBulkImport(): void {
    this.importMode.set('bulk');
    this.importResults.set(null);
  }

  cancelImport(): void {
    this.importMode.set('none');
    this.bulkImportText.set('');
    this.importResults.set(null);
  }

  parseGamesFromText(): GameImportRequest[] {
    const text = this.bulkImportText().trim();
    if (!text) return [];

    const lines = text.split('\n').filter(line => line.trim());
    const store = this.selectedStore();

    return lines.map(line => {
      // Try to parse JSON first
      try {
        const parsed = JSON.parse(line);
        return {
          name: parsed.name || parsed.title || line.trim(),
          store,
          storeId: parsed.id || parsed.appId || parsed.storeId,
          storeLink: parsed.link || parsed.url || parsed.storeLink,
          thumbnailUrl: parsed.thumbnailUrl || parsed.thumbnail || parsed.image
        } as GameImportRequest;
      } catch {
        // Fallback to plain text (just game name)
        return {
          name: line.trim(),
          store
        } as GameImportRequest;
      }
    });
  }

  importGames(): void {
    const games = this.parseGamesFromText();
    if (games.length === 0) {
      this.errorMessage.set('No valid games to import');
      return;
    }

    this.isImporting.set(true);
    this.errorMessage.set(null);

    this.storeService.importBulkGames(games).subscribe({
      next: result => {
        this.importResults.set(result);
        this.isImporting.set(false);
        this.loadStats(); // Refresh stats
      },
      error: err => {
        console.error('Import failed', err);
        this.errorMessage.set('Failed to import games: ' + (err.message || 'Unknown error'));
        this.isImporting.set(false);
      }
    });
  }

  getStoreIcon(store: string): string {
    switch (store.toLowerCase()) {
      case 'steam':
        return 'bi-steam';
      case 'gog':
        return 'bi-box-seam';
      case 'epic':
      case 'epic games':
        return 'bi-controller';
      case 'metacritic':
        return 'bi-bar-chart-fill';
      default:
        return 'bi-shop';
    }
  }

  getPercentage(count: number): number {
    const total = this.stats()?.totalGames || 1;
    return Math.round((count / total) * 100);
  }

  openStoreUrl(url: string): void {
    window.open(url, '_blank');
  }

  copyConsoleScript(store: 'steam' | 'gog' | 'epic'): void {
    let script = '';

    switch (store) {
      case 'steam':
        script = `// Steam Library Export Script
// Run this in the browser console on https://store.steampowered.com/dynamicstore/userdata/
// Or use the Steam Web API

// For Steam library page (steamcommunity.com/id/YOUR_ID/games/?tab=all)
const games = [...document.querySelectorAll('.gameListRowItemName')].map(el => ({
  name: el.textContent.trim(),
  store: 'steam'
}));
console.log(JSON.stringify(games, null, 2));
copy(games.map(g => JSON.stringify(g)).join('\\n'));
console.log('Copied ' + games.length + ' games to clipboard!');`;
        break;

      case 'gog':
        script = `// GOG Galaxy Export Script
// Run this in the browser console on https://www.gog.com/account

const games = [...document.querySelectorAll('.product-title__text')].map(el => ({
  name: el.textContent.trim(),
  store: 'gog'
}));
console.log(JSON.stringify(games, null, 2));
copy(games.map(g => JSON.stringify(g)).join('\\n'));
console.log('Copied ' + games.length + ' games to clipboard!');`;
        break;

      case 'epic':
        script = `// Epic Games Library Export Script
// Run this in browser console on https://www.epicgames.com/account/transactions
// Or on library page after scrolling to load all games

const games = [...document.querySelectorAll('[data-testid="offer-title-info-title"]')]
  .map(el => ({
    name: el.textContent.trim(),
    store: 'epic'
  }));
console.log(JSON.stringify(games, null, 2));
copy(games.map(g => JSON.stringify(g)).join('\\n'));
console.log('Copied ' + games.length + ' games to clipboard!');`;
        break;
    }

    navigator.clipboard.writeText(script).then(() => {
      alert('Script copied to clipboard! Paste it in the browser console on the store website.');
    });
  }
}
