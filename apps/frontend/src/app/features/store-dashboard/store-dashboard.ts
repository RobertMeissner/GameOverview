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
  selectedStore = signal<'steam' | 'steam-family' | 'steam-licenses' | 'gog' | 'epic'>('steam');
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

  copyConsoleScript(store: 'steam' | 'gog' | 'epic' | 'steam-licenses' | 'steam-family'): void {
    let script = '';

    switch (store) {
      case 'steam':
        script = `// Steam Library Export Script
// Run on: https://steamcommunity.com/id/YOUR_ID/games/?tab=all
// IMPORTANT: Scroll to the very bottom first to load ALL games!

// Try multiple selectors (Steam changes these frequently)
let games = document.querySelectorAll('.gameListRowItemName');
if (!games.length) games = document.querySelectorAll('[class*="GameName"]');
if (!games.length) games = document.querySelectorAll('[class*="gamename"]');

if (!games.length) {
  console.log("No games found. Try the manual method:");
  console.log("1. Go to https://store.steampowered.com/account/licenses/");
  console.log("2. Select and copy the game names manually");
} else {
  const names = [...games].map(g => g.textContent.trim());
  console.log("=== STEAM GAMES (" + names.length + ") ===");
  console.log(names.join("\\n"));
}`;
        break;

      case 'steam-licenses':
        script = `// Steam Licenses Page Export Script
// Run on: https://store.steampowered.com/account/licenses/
// This extracts game names from your Steam licenses page

const rows = document.querySelectorAll('.account_table tr');
const games = [];

rows.forEach(row => {
  const cells = row.querySelectorAll('td');
  if (cells.length >= 2) {
    const nameCell = cells[1];
    if (nameCell) {
      let name = nameCell.textContent.trim();
      // Clean up whitespace
      name = name.replace(/\\s+/g, ' ').trim();

      // Skip empty, header rows, and removed licenses
      if (!name || name.includes('Product Name') || name.startsWith('Remove ')) {
        return;
      }

      // Remove "Limited Free Promotional Package - Month Year" suffix
      name = name.replace(/ Limited Free Promotional Package - \\w+ \\d{4}$/, '');

      // Remove common suffixes
      name = name.replace(/ Retail(?: \\(.*?\\))?$/, '');
      name = name.replace(/ Steam Store and Retail Key$/, '');
      name = name.replace(/ Thirdparty Retail$/, '');
      name = name.replace(/ Comp$/, '');
      name = name.replace(/ \\(WW\\)$/, '');
      name = name.replace(/ \\(Europe\\)$/, '');
      name = name.replace(/ ROW$/, '');
      name = name.replace(/ \\(Humble Monthly\\)$/, '');
      name = name.replace(/ \\(DE\\)$/, '');
      name = name.replace(/ Free$/, '');
      name = name.replace(/ - Gift$/, '');

      // Skip if name is now empty after cleanup
      if (name.trim()) {
        games.push(name.trim());
      }
    }
  }
});

// Remove duplicates
const uniqueGames = [...new Set(games)];
console.log("=== STEAM LICENSES (" + uniqueGames.length + ") ===");
console.log(uniqueGames.join("\\n"));`;
        break;

      case 'steam-family':
        script = `// Steam Family Library Export Script (Virtualized Scroll Handler)
// Run on: https://store.steampowered.com/account/familymanagement?tab=library
// This script auto-scrolls to capture all games from the virtualized list

(async () => {
  const games = new Map(); // Use Map to dedupe by appId
  let lastCount = 0;
  let noNewItemsCount = 0;
  const maxNoNewItems = 5; // Stop after 5 scroll attempts with no new items

  // Find the scrollable container
  const container = document.querySelector('[class*="sharedlibrary_Container"]') ||
                    document.querySelector('[class*="libraryhome_Container"]') ||
                    document.documentElement;

  const collectVisibleGames = () => {
    const images = document.querySelectorAll('img[src*="steam/apps"]');
    images.forEach(img => {
      const alt = img.getAttribute('alt');
      const src = img.getAttribute('src');
      if (alt && src) {
        const match = src.match(/\\/steam\\/apps\\/(\\d+)\\//);
        const appId = match ? match[1] : null;
        if (appId && !games.has(appId)) {
          games.set(appId, { name: alt, appId: appId });
        }
      }
    });
  };

  const scrollAndCollect = () => {
    return new Promise(resolve => {
      collectVisibleGames();

      // Scroll down
      window.scrollBy(0, window.innerHeight * 0.8);

      // Wait for new content to load
      setTimeout(() => {
        collectVisibleGames();
        resolve();
      }, 300);
    });
  };

  console.log("Starting auto-scroll collection...");
  console.log("This will scroll through the entire library automatically.");

  // Scroll loop
  while (noNewItemsCount < maxNoNewItems) {
    await scrollAndCollect();

    if (games.size === lastCount) {
      noNewItemsCount++;
      console.log(\`No new games found (attempt \${noNewItemsCount}/\${maxNoNewItems}), current: \${games.size}\`);
    } else {
      noNewItemsCount = 0;
      console.log(\`Found \${games.size} games so far...\`);
    }
    lastCount = games.size;
  }

  // Scroll back to top
  window.scrollTo(0, 0);

  const uniqueGames = [...games.values()];
  console.log("=== STEAM FAMILY LIBRARY (" + uniqueGames.length + ") ===");
  console.log(uniqueGames.map(g => JSON.stringify(g)).join("\\n"));
})();`;
        break;

      case 'gog':
        script = `// GOG Library Export Script - Fetches ALL pages
// Run on: https://www.gog.com/en/account

const fetchAllGogGames = async () => {
  let page = 1, allGames = [], totalPages = 1;
  do {
    const response = await fetch(\`https://www.gog.com/account/getFilteredProducts?hiddenFlag=0&mediaType=1&page=\${page}&sortBy=title\`);
    const data = await response.json();
    allGames = [...allGames, ...data.products.map(p => p.title)];
    totalPages = data.totalPages;
    console.log(\`Page \${page}/\${totalPages}: \${allGames.length} total\`);
    page++;
  } while (page <= totalPages);
  return allGames;
};

fetchAllGogGames().then(games => {
  console.log("=== GOG GAMES (" + games.length + ") ===");
  console.log(games.join("\\n"));
});`;
        break;

      case 'epic':
        script = `// Epic Games Library Export Script
// Run on: https://www.epicgames.com/account/transactions

const fetchGamesList = async (pageToken = '', existingList = []) => {
  const data = await (await fetch(\`https://www.epicgames.com/account/v2/payment/ajaxGetOrderHistory?sortDir=DESC&sortBy=DATE&nextPageToken=\${pageToken}&locale=en-US\`)).json();
  const gamesList = data.orders.reduce((acc, value) => [...acc, ...value.items.map(v => v.description)], []);
  console.log(\`Fetched \${gamesList.length} games, next: \${data.nextPageToken || 'done'}\`);
  const newList = [...existingList, ...gamesList];
  if (!data.nextPageToken) return newList;
  return await fetchGamesList(data.nextPageToken, newList);
};

fetchGamesList().then(games => {
  console.log("=== EPIC GAMES (" + games.length + ") ===");
  console.log(games.join("\\n"));
});`;
        break;
    }

    navigator.clipboard.writeText(script).then(() => {
      alert('Script copied to clipboard! Paste it in the browser console on the store website.');
    });
  }
}
