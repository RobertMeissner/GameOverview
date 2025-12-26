# Game Store Import Scripts

This document contains browser console scripts to export your game libraries from various stores. Copy the script, paste it into your browser's developer console (F12) on the appropriate store page, and it will copy a list of games to your clipboard.

## Steam Library Export

### Method 1: Steam Community Games Page
Navigate to: `https://steamcommunity.com/id/YOUR_STEAM_ID/games/?tab=all`

```javascript
// Steam Library Export Script
// Run this on your Steam games page (steamcommunity.com/id/YOUR_ID/games/?tab=all)
// Make sure to scroll down to load all games first!

const games = [...document.querySelectorAll('.gameListRowItemName')].map(el => {
  const row = el.closest('.gameListRow');
  const appId = row?.dataset?.appid || null;
  return {
    name: el.textContent.trim(),
    store: 'steam',
    storeId: appId
  };
});

console.log(`Found ${games.length} games:`);
console.log(JSON.stringify(games, null, 2));

// Copy to clipboard in the format needed for bulk import
const output = games.map(g => JSON.stringify(g)).join('\n');
copy(output);
console.log('✅ Copied to clipboard! Paste this into the Store Dashboard bulk import.');
```

### Method 2: Steam Store Library Page
Navigate to: `https://store.steampowered.com/dynamicstore/userdata/` (when logged in)

```javascript
// Alternative: Parse from Steam API userdata
// This is the raw data Steam uses internally

fetch('https://store.steampowered.com/dynamicstore/userdata/')
  .then(r => r.json())
  .then(data => {
    const ownedApps = data.rgOwnedApps || [];
    console.log(`Found ${ownedApps.length} owned apps`);
    console.log('App IDs:', ownedApps);

    // Note: This only gives you app IDs, not names
    // You'll need to use the Steam API to get names
    const games = ownedApps.map(id => ({
      name: `Steam App ${id}`,  // Placeholder - update manually or use API
      store: 'steam',
      storeId: String(id)
    }));

    copy(games.map(g => JSON.stringify(g)).join('\n'));
    console.log('✅ Copied to clipboard!');
  });
```

## GOG Library Export

Navigate to: `https://www.gog.com/en/account` (must be logged in)

```javascript
// GOG Galaxy Library Export Script
// Run this on your GOG account page (gog.com/en/account)
// Wait for all games to load (scroll down if needed)

const games = [...document.querySelectorAll('.product-tile')].map(tile => {
  const nameEl = tile.querySelector('.product-tile__title');
  const linkEl = tile.querySelector('a[href*="/game/"]');

  // Extract GOG ID from the link
  const href = linkEl?.href || '';
  const gogIdMatch = href.match(/\/game\/([^\/\?]+)/);

  return {
    name: nameEl?.textContent?.trim() || 'Unknown',
    store: 'gog',
    storeLink: href || null
  };
}).filter(g => g.name !== 'Unknown');

console.log(`Found ${games.length} games:`);
console.log(JSON.stringify(games, null, 2));

const output = games.map(g => JSON.stringify(g)).join('\n');
copy(output);
console.log('✅ Copied to clipboard! Paste this into the Store Dashboard bulk import.');
```

### Alternative GOG Method (Galaxy API)
```javascript
// If you have GOG Galaxy, you can also export from the API
// This requires being logged in and having GOG Galaxy data accessible

async function exportGogLibrary() {
  // Try fetching from the orders/movies API
  const response = await fetch('https://www.gog.com/account/getFilteredProducts?hiddenFlag=0&mediaType=1&sortBy=title');
  const data = await response.json();

  const games = data.products.map(p => ({
    name: p.title,
    store: 'gog',
    storeId: String(p.id),
    storeLink: `https://www.gog.com/game/${p.slug}`,
    thumbnailUrl: p.image ? `https:${p.image}_196.jpg` : null
  }));

  console.log(`Found ${games.length} games`);
  copy(games.map(g => JSON.stringify(g)).join('\n'));
  console.log('✅ Copied to clipboard!');

  return games;
}

exportGogLibrary();
```

## Epic Games Library Export

Navigate to: `https://www.epicgames.com/account/transactions` or your library page

### Method 1: Transactions Page
```javascript
// Epic Games Library Export Script
// Run this on your Epic transactions page
// Scroll down to load all transactions first!

const games = [...document.querySelectorAll('[data-testid="transaction-product-title"]')]
  .map(el => {
    const name = el.textContent.trim();
    // Try to find the store link
    const container = el.closest('[data-testid="transaction-row"]');
    const link = container?.querySelector('a[href*="store.epicgames.com"]');

    return {
      name: name,
      store: 'epic',
      storeLink: link?.href || null
    };
  })
  .filter(g => g.name);

// Remove duplicates
const uniqueGames = [...new Map(games.map(g => [g.name, g])).values()];

console.log(`Found ${uniqueGames.length} unique games:`);
console.log(JSON.stringify(uniqueGames, null, 2));

const output = uniqueGames.map(g => JSON.stringify(g)).join('\n');
copy(output);
console.log('✅ Copied to clipboard! Paste this into the Store Dashboard bulk import.');
```

### Method 2: Library Page
```javascript
// Epic Games Library Export - Library Page
// Navigate to: https://store.epicgames.com/en-US/library
// Scroll to load all games first!

const games = [...document.querySelectorAll('[data-testid="library-grid"] article')]
  .map(article => {
    const titleEl = article.querySelector('[data-testid="offer-title-info-title"]');
    const linkEl = article.querySelector('a[href*="/p/"]');

    const href = linkEl?.href || '';
    const slugMatch = href.match(/\/p\/([^\/\?]+)/);

    return {
      name: titleEl?.textContent?.trim() || 'Unknown',
      store: 'epic',
      storeId: slugMatch?.[1] || null,
      storeLink: href || null
    };
  })
  .filter(g => g.name !== 'Unknown');

console.log(`Found ${games.length} games:`);
console.log(JSON.stringify(games, null, 2));

const output = games.map(g => JSON.stringify(g)).join('\n');
copy(output);
console.log('✅ Copied to clipboard! Paste this into the Store Dashboard bulk import.');
```

## Using the Exported Data

After running any of these scripts:

1. The game list is copied to your clipboard
2. Go to your GameOverview app's **Store Dashboard** (`/stores`)
3. Click **Bulk Import**
4. Select the appropriate store (Steam, GOG, or Epic)
5. Paste the copied text into the text area
6. Click **Import Games**

The import will:
- Create new games if they don't exist
- Update existing games with store-specific data (IDs, links)
- Add new games to your collection automatically

## Tips

- **Scroll first**: Most store pages load games dynamically. Scroll to the bottom to load all games before running the script.
- **Check the console**: The scripts output how many games were found. If the number seems low, try scrolling more.
- **Run multiple times**: You can run scripts from different stores and import them all.
- **Manual cleanup**: Some games might have slightly different names across stores. Use the Admin panel to merge duplicates.

## Troubleshooting

### "copy is not defined"
The `copy()` function is a Chrome DevTools feature. If you're using Firefox or another browser, replace `copy(output)` with:
```javascript
navigator.clipboard.writeText(output).then(() => console.log('Copied!'));
```

### "No games found"
- Make sure you're on the correct page
- Try scrolling to load all games
- Check if the page structure has changed (store websites update frequently)

### Games not importing correctly
- Check the browser console for the raw output
- Verify the JSON format is correct
- Try importing one game at a time using the single import feature
