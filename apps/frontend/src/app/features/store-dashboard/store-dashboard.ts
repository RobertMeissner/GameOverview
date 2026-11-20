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

  copyConsoleScript(store: 'steam' | 'gog' | 'epic' | 'steam-licenses' | 'steam-family'): void {
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
// Uses the XML endpoint - no scrolling needed. Requires public game details (or being logged in as this profile).

${cleanNameFn}

const xmlResponse = await fetch(location.origin + location.pathname + '?tab=all&xml=1', { credentials: 'include' });
const xmlDoc = new DOMParser().parseFromString(await xmlResponse.text(), 'text/xml');

if (xmlDoc.querySelector('error')) {
  console.log('XML endpoint error: ' + xmlDoc.querySelector('error').textContent + ' - falling back to DOM scraping (scroll to the very bottom first!)');
  let gameRows = document.querySelectorAll('[data-appid]');
  if (!gameRows.length) gameRows = document.querySelectorAll('.gameListRow');
  const domGames = [...gameRows].map(row => {
    const appid = row.dataset?.appid || row.getAttribute('data-appid') || (row.id || '').replace('game_', '') || null;
    const nameEl = row.querySelector('.gameListRowItemName') || row.querySelector('[class*="GameName"]');
    const rawName = nameEl ? nameEl.textContent.trim() : 'Unknown';
    return { name: cleanName(rawName), appid };
  }).filter(g => g.name && g.name !== 'Unknown');
  console.log("=== STEAM GAMES (" + domGames.length + ") ===");
  console.log(JSON.stringify(domGames, null, 2));
} else {
  const games = [...xmlDoc.querySelectorAll('game')].map(g => ({
    name: cleanName(g.querySelector('name')?.textContent || ''),
    appid: g.querySelector('appID')?.textContent || null
  })).filter(g => g.name);
  console.log("=== STEAM GAMES (" + games.length + ") ===");
  console.log(JSON.stringify(games, null, 2));
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

  // Find the scrollable container (the family library scrolls an inner div, not the window)
  const container = document.querySelector('[class*="sharedlibrary_Container"]') ||
                    document.querySelector('[class*="libraryhome_Container"]') ||
                    document.scrollingElement || document.documentElement;

  const scrollStep = () => {
    const amount = (container.clientHeight || window.innerHeight) * 0.8;
    if (container === document.scrollingElement || container === document.documentElement) {
      window.scrollBy(0, amount);
    } else {
      container.scrollBy(0, amount);
    }
  };

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

      // Scroll down inside the actual scrollable container
      scrollStep();

      // Wait for new content to load
      setTimeout(() => {
        collectVisibleGames();
        resolve();
      }, 500);
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
  if (container === document.scrollingElement || container === document.documentElement) {
    window.scrollTo(0, 0);
  } else {
    container.scrollTo(0, 0);
  }

  const uniqueGames = [...games.values()];
  console.log("=== STEAM FAMILY LIBRARY (" + uniqueGames.length + ") ===");
  console.log(uniqueGames.map(g => JSON.stringify(g)).join("\\n"));
})();`;
        break;

      case 'gog':
        script = `// GOG Library Export Script (JSONC with appid)
// Run on: https://www.gog.com/en/account

${cleanNameFn}

async function fetchAllGogGames() {
  let page = 1, allGames = [], totalPages = 1;
  do {
    const response = await fetch(\`https://www.gog.com/account/getFilteredProducts?mediaType=1&hiddenFlag=0&sortBy=title&page=\${page}\`, { credentials: 'include' });
    if (!response.ok) {
      console.error(\`GOG request failed: HTTP \${response.status} on page \${page} - are you logged in at gog.com/en/account?\`);
      return;
    }
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
  const response = await fetch(\`https://www.epicgames.com/account/v2/payment/ajaxGetOrderHistory?sortDir=DESC&sortBy=DATE&nextPageToken=\${pageToken}&locale=en-US\`, { credentials: 'include' });
  if (!response.ok) {
    throw new Error(\`HTTP \${response.status} - Epic is gating the order history endpoint. Make sure you are logged in at epicgames.com, otherwise export via legendary/Heroic instead.\`);
  }
  const data = await response.json();
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
