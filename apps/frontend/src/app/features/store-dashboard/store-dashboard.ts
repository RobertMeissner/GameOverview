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

  /**
   * Cleans game names by removing common import artifacts:
   * - Date suffixes like " - Oct 2025"
   * - "Limited Free Promotional Package" text
   * - " - Free" and " Demo" suffixes
   */
  private cleanGameName(name: string): string {
    if (!name) return name;
    return name
      .replace(/ - (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/i, '')
      .replace(/Limited Free Promotional Packag(e)?/gi, '')
      .replace(/ - Free$/i, '')
      .replace(/ Demo$/i, '')
      .replace(/ - $/g, '')
      .trim();
  }

  stats = signal<StoreStats | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Import state
  importMode = signal<'none' | 'single' | 'bulk'>('none');
  bulkImportText = signal('');
  selectedStore = signal<'steam' | 'gog' | 'epic' | 'steam-family'>('steam');
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

    // Try to parse as JSON array first
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        const store = this.selectedStore();
        return parsed.map(item => ({
          name: this.cleanGameName(item.name || item.title || ''),
          store,
          storeId: item.appid || item.id || item.appId || item.storeId,
          storeLink: item.link || item.url || item.storeLink,
          thumbnailUrl: item.thumbnailUrl || item.thumbnail || item.image
        } as GameImportRequest)).filter(g => g.name);
      }
    } catch {
      // Not a JSON array, continue with line-by-line parsing
    }

    const lines = text.split('\n').filter(line => line.trim());
    const store = this.selectedStore();

    return lines.map(line => {
      // Try to parse each line as JSON
      try {
        const parsed = JSON.parse(line);
        return {
          name: this.cleanGameName(parsed.name || parsed.title || line.trim()),
          store,
          storeId: parsed.appid || parsed.id || parsed.appId || parsed.storeId,
          storeLink: parsed.link || parsed.url || parsed.storeLink,
          thumbnailUrl: parsed.thumbnailUrl || parsed.thumbnail || parsed.image
        } as GameImportRequest;
      } catch {
        // Fallback to plain text (just game name)
        return {
          name: this.cleanGameName(line.trim()),
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
    // Shared cleanup function for all scripts
    const cleanNameFn = `const cleanName = (name) => {
  if (!name) return name;
  return name
    .replace(/ - (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \\d{4}$/i, '')
    .replace(/Limited Free Promotional Packag(e)?/gi, '')
    .replace(/ - Free$/i, '').replace(/ Demo$/i, '').replace(/ - $/g, '').trim();
};`;

    let script = '';

    switch (store) {
      case 'steam':
        script = `// Steam Library Export Script (JSONC with appid)
// Run on: https://steamcommunity.com/id/YOUR_ID/games/?tab=all
// IMPORTANT: Scroll to the very bottom first to load ALL games!

${cleanNameFn}

let gameRows = document.querySelectorAll('[data-appid]');
if (!gameRows.length) gameRows = document.querySelectorAll('.gameListRow');

if (!gameRows.length) {
  console.log("No games found. Try the Steam API method instead.");
} else {
  const games = [...gameRows].map(row => {
    const appid = row.dataset?.appid || row.getAttribute('data-appid') || null;
    const nameEl = row.querySelector('.gameListRowItemName') || row.querySelector('[class*="GameName"]');
    const rawName = nameEl ? nameEl.textContent.trim() : 'Unknown';
    return { name: cleanName(rawName), appid };
  }).filter(g => g.name !== 'Unknown');
  console.log("=== STEAM GAMES (" + games.length + ") ===");
  console.log(JSON.stringify(games, null, 2));
}`;
        break;

      case 'gog':
        script = `// GOG Library Export Script (JSONC with appid)
// Run on: https://www.gog.com/en/account

${cleanNameFn}

async function fetchAllGogGames() {
  let page = 1, allGames = [], totalPages = 1;
  do {
    const response = await fetch(\`https://www.gog.com/account/getFilteredProducts?mediaType=1&page=\${page}\`);
    const data = await response.json();
    totalPages = data.totalPages;
    const games = data.products.map(p => ({ name: cleanName(p.title), appid: String(p.id) }));
    allGames = allGames.concat(games);
    console.log(\`Page \${page}/\${totalPages}: Found \${games.length} games\`);
    page++;
  } while (page <= totalPages);
  console.log("=== GOG GAMES (" + allGames.length + ") ===");
  console.log(JSON.stringify(allGames, null, 2));
}

fetchAllGogGames();`;
        break;

      case 'epic':
        script = `// Epic Games Library Export Script (JSONC with appid)
// Run on: https://www.epicgames.com/account/transactions

${cleanNameFn}

const fetchGamesList = async (pageToken = '', existingList = []) => {
  const data = await (await fetch(\`https://www.epicgames.com/account/v2/payment/ajaxGetOrderHistory?sortDir=DESC&sortBy=DATE&nextPageToken=\${pageToken}&locale=en-US\`)).json();
  const gamesList = data.orders.reduce((acc, order) => [
    ...acc,
    ...order.items.map(item => ({ name: cleanName(item.description), appid: item.offerId || item.id || null }))
  ], []);
  console.log(\`Games on this page: \${gamesList.length}, Next: \${data.nextPageToken || 'none'}\`);
  const newList = [...existingList, ...gamesList];
  if (!data.nextPageToken) return newList;
  return await fetchGamesList(data.nextPageToken, newList);
};

fetchGamesList().then(games => {
  console.log("=== EPIC GAMES (" + games.length + ") ===");
  console.log(JSON.stringify(games, null, 2));
});`;
        break;
    }

    navigator.clipboard.writeText(script).then(() => {
      alert('Script copied to clipboard! Paste it in the browser console on the store website.');
    });
  }
}
