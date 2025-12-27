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
        script = `// Steam Library Export - Manual Method
// 1. Go to: https://store.steampowered.com/account/licenses/
// 2. Select all game names (Ctrl+A on the game list area)
// 3. Copy and paste into the import text area (one game per line)
//
// Alternative: Steam Community Games Page
// Go to: https://steamcommunity.com/id/YOUR_ID/games/?tab=all
// Scroll to bottom to load ALL games, then run:

var games = Array.from(document.getElementsByClassName("gameslistitems_GameName_22awl"));
var gameNames = games.map(g => g.innerHTML.trim());
console.log("Found " + gameNames.length + " games");
copy(gameNames.join("\\n"));
console.log("Copied to clipboard! Paste into import.");`;
        break;

      case 'gog':
        script = `// GOG Library Export Script - Fetches ALL pages
// Run this on: https://www.gog.com/en/account

const fetchAllGogGames = async () => {
  let page = 1;
  let allGames = [];
  let totalPages = 1;

  do {
    const response = await fetch(\`https://www.gog.com/account/getFilteredProducts?hiddenFlag=0&mediaType=1&page=\${page}&sortBy=title\`);
    const data = await response.json();
    const games = data.products.map(p => p.title);
    allGames = [...allGames, ...games];
    totalPages = data.totalPages;
    console.log(\`Page \${page}/\${totalPages}: Found \${games.length} games (Total: \${allGames.length})\`);
    page++;
  } while (page <= totalPages);

  return allGames;
};

fetchAllGogGames().then(games => {
  console.log("Total GOG games found: " + games.length);
  copy(games.join("\\n"));
  console.log("Copied to clipboard! Paste into import.");
});`;
        break;

      case 'epic':
        script = `// Epic Games Library Export Script
// Run this on: https://www.epicgames.com/account/transactions
// This fetches ALL pages automatically via the API.

const fetchGamesList = async (pageToken = '', existingList = []) => {
  const data = await (await fetch(\`https://www.epicgames.com/account/v2/payment/ajaxGetOrderHistory?sortDir=DESC&sortBy=DATE&nextPageToken=\${pageToken}&locale=en-US\`)).json();
  const gamesList = data.orders.reduce((acc, value) => [...acc, ...value.items.map(v => v.description)], []);
  console.log(\`Games on this page: \${gamesList.length}, Next page: \${data.nextPageToken || 'none'}\`);
  const newList = [...existingList, ...gamesList];
  if (!data.nextPageToken) return newList;
  return await fetchGamesList(data.nextPageToken, newList);
};

fetchGamesList().then(games => {
  console.log("Total games found: " + games.length);
  copy(games.join("\\n"));
  console.log("Copied to clipboard! Paste into import.");
});`;
        break;
    }

    navigator.clipboard.writeText(script).then(() => {
      alert('Script copied to clipboard! Paste it in the browser console on the store website.');
    });
  }
}
