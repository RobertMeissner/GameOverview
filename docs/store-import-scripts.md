# Game Store Import Scripts

This document contains browser console scripts to export your game libraries from various stores. These scripts are based on reverse-engineered APIs - use at your own discretion.

All scripts output **JSONC format** with `name` and `appid` fields for better import compatibility:
```jsonc
[
  { "name": "Game Name", "appid": "12345" },
  { "name": "Another Game", "appid": "67890" }
]
```

## Name Cleanup Function

All scripts below use this helper to clean up game names by removing common artifacts:

```javascript
// Cleans game names by removing date suffixes, promotional text, etc.
const cleanName = (name) => {
  if (!name) return name;
  return name
    // Remove date suffixes like " - Oct 2025", " - Jan 2024"
    .replace(/ - (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/i, '')
    // Remove promotional package text
    .replace(/Limited Free Promotional Packag(e)?/gi, '')
    // Remove common suffixes
    .replace(/ - Free$/i, '')
    .replace(/ Demo$/i, '')
    // Clean up leftover dashes and whitespace
    .replace(/ - $/g, '')
    .trim();
};
```

## Epic Games Library Export

Navigate to: `https://www.epicgames.com/account/transactions`

This script fetches ALL pages automatically via the Epic Games order history API:

```javascript
// Name cleanup helper (copy from above or include inline)
const cleanName = (name) => {
  if (!name) return name;
  return name
    .replace(/ - (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/i, '')
    .replace(/Limited Free Promotional Packag(e)?/gi, '')
    .replace(/ - Free$/i, '').replace(/ Demo$/i, '').replace(/ - $/g, '').trim();
};

const fetchGamesList = async (pageToken = '', existingList = []) => {
  const data = await (await fetch(`https://www.epicgames.com/account/v2/payment/ajaxGetOrderHistory?sortDir=DESC&sortBy=DATE&nextPageToken=${pageToken}&locale=en-US`)).json();
  const gamesList = data.orders.reduce((acc, order) => [
    ...acc,
    ...order.items.map(item => ({
      name: cleanName(item.description),
      appid: item.offerId || item.id || null
    }))
  ], []);
  console.log(`Games on this page: ${gamesList.length}, Next page: ${data.nextPageToken || 'none'}`);
  const newList = [...existingList, ...gamesList];
  if (!data.nextPageToken) return newList;
  return await fetchGamesList(data.nextPageToken, newList);
};

fetchGamesList().then(games => {
  console.log("=== EPIC GAMES (" + games.length + ") ===");
  console.log(JSON.stringify(games, null, 2));
});
```

**How to use:**
1. Go to `https://www.epicgames.com/account/transactions`
2. Open browser DevTools (F12) → Console tab
3. If prompted, type `allow pasting` and press Enter
4. Paste the script and press Enter
5. Wait for it to fetch all pages (you'll see progress in console)
6. Copy the JSONC output from the console

**Note:** Some free games may not appear if they didn't generate an order record.

## Steam Library Export

### Method 1: Steam Web API (Recommended)

If you have a Steam API key, this returns the most complete data with app IDs:

```javascript
// Name cleanup helper (copy from above or include inline)
const cleanName = (name) => {
  if (!name) return name;
  return name
    .replace(/ - (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/i, '')
    .replace(/Limited Free Promotional Packag(e)?/gi, '')
    .replace(/ - Free$/i, '').replace(/ Demo$/i, '').replace(/ - $/g, '').trim();
};

// Replace with your values
const STEAM_API_KEY = 'YOUR_API_KEY';
const STEAM_ID = 'YOUR_STEAM_ID_64';

fetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}&format=json&include_appinfo=true`)
  .then(r => r.json())
  .then(data => {
    const games = data.response.games.map(g => ({
      name: cleanName(g.name),
      appid: String(g.appid)
    }));
    console.log("=== STEAM GAMES (" + games.length + ") ===");
    console.log(JSON.stringify(games, null, 2));
  });
```

**How to get your Steam API key:** [Steam Web API Key](https://steamcommunity.com/dev/apikey)

**How to find your Steam ID 64:** Visit [SteamID.io](https://steamid.io/) or check your Steam profile URL

### Method 2: Steam Community Games Page (Console Script)

Navigate to: `https://steamcommunity.com/id/YOUR_STEAM_ID/games/?tab=all`

**Important:** Scroll all the way to the bottom first to load ALL games!

```javascript
// Name cleanup helper (copy from above or include inline)
const cleanName = (name) => {
  if (!name) return name;
  return name
    .replace(/ - (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/i, '')
    .replace(/Limited Free Promotional Packag(e)?/gi, '')
    .replace(/ - Free$/i, '').replace(/ Demo$/i, '').replace(/ - $/g, '').trim();
};

// Try to find game elements with app IDs
let gameRows = document.querySelectorAll('[data-appid]');
if (!gameRows.length) gameRows = document.querySelectorAll('.gameListRow');

if (!gameRows.length) {
  console.log("No games found. Try Method 1 (API) instead.");
} else {
  const games = [...gameRows].map(row => {
    const appid = row.dataset?.appid || row.getAttribute('data-appid') || null;
    const nameEl = row.querySelector('.gameListRowItemName') || row.querySelector('[class*="GameName"]');
    const rawName = nameEl ? nameEl.textContent.trim() : 'Unknown';
    return { name: cleanName(rawName), appid };
  }).filter(g => g.name !== 'Unknown');

  console.log("=== STEAM GAMES (" + games.length + ") ===");
  console.log(JSON.stringify(games, null, 2));
}
```

**Troubleshooting:**
- If you get 0 games, the page structure may have changed. Use Method 1 (API) instead.
- Make sure your profile is set to public for the games list to be visible.
- Scroll to the very bottom before running the script.

### Method 3: Licenses Page (Manual Fallback)

1. Go to: `https://store.steampowered.com/account/licenses/`
2. The page shows all your licenses
3. For each game, you'll need to note the name and look up the App ID

### Steam Family Sharing

For games shared via Steam Family Sharing, use the same export methods above but select "Steam Family Sharing" as the store when importing. This helps track which games you own vs. which are shared.

## GOG Library Export

Navigate to: `https://www.gog.com/en/account`

This script fetches ALL pages automatically:

```javascript
// Name cleanup helper (copy from above or include inline)
const cleanName = (name) => {
  if (!name) return name;
  return name
    .replace(/ - (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/i, '')
    .replace(/Limited Free Promotional Packag(e)?/gi, '')
    .replace(/ - Free$/i, '').replace(/ Demo$/i, '').replace(/ - $/g, '').trim();
};

async function fetchAllGogGames() {
  let page = 1;
  let allGames = [];
  let totalPages = 1;

  do {
    const response = await fetch(`https://www.gog.com/account/getFilteredProducts?mediaType=1&page=${page}`);
    const data = await response.json();
    totalPages = data.totalPages;
    const games = data.products.map(p => ({
      name: cleanName(p.title),
      appid: String(p.id)
    }));
    allGames = allGames.concat(games);
    console.log(`Page ${page}/${totalPages}: Found ${games.length} games`);
    page++;
  } while (page <= totalPages);

  console.log("=== GOG GAMES (" + allGames.length + ") ===");
  console.log(JSON.stringify(allGames, null, 2));
}

fetchAllGogGames();
```

**How to use:**
1. Go to `https://www.gog.com/en/account`
2. Make sure you're logged in
3. Open browser DevTools (F12) → Console tab
4. Paste the script and press Enter
5. Wait for all pages to be fetched
6. Copy the JSONC output from the console

## Using the Exported Data

After running any of these scripts:

1. The JSONC data is logged to the console with `name` and `appid` fields
2. Select and copy the JSON output from the console
3. Go to your GameOverview app's **Store Dashboard** (`/stores`)
4. Click **Bulk Import**
5. Select the appropriate store (Steam, GOG, Epic, or Steam Family Sharing)
6. Paste the copied JSONC into the text area
7. Click **Import Games**

**JSONC Format Benefits:**
- **App IDs preserved**: Direct linking to store pages and APIs
- **Better matching**: More accurate game identification
- **Enrichment**: App IDs enable automatic metadata fetching

The import will:
- Create new games if they don't exist in your catalog
- Update existing games with store-specific data (using app ID for matching)
- Add new games to your collection automatically
- Use app IDs for store linking and data enrichment

## Troubleshooting

### Scripts return 0 games
- Website structures change frequently
- Try the manual methods instead
- Check that you're logged in
- Ensure the page has fully loaded

### Some games missing
- Free games may not generate order records (Epic)
- DLCs may be listed separately
- Some games may have different names across platforms

### "allow pasting" prompt
In Chrome, you may need to type `allow pasting` in the console first before pasting scripts.

## External Tools

If the scripts don't work, consider these alternatives:

- **[Epic Games Library Exporter](https://chromewebstore.google.com/detail/epic-games-library-export/gfhbpoeikkjapjbnfnjceikdfolcgcln)** - Chrome extension
- **[Playnite](https://playnite.link/)** - Desktop app that syncs all stores
- **[GOG Galaxy 2.0](https://www.gog.com/galaxy)** - GOG's app with multi-store integration

## Sources

- [Steam Web API Documentation](https://developer.valvesoftware.com/wiki/Steam_Web_API)
- [Steam Library Export Guide 2025](https://www.play-this.com/blog/steam-library-export-guide)
- [GOG Galaxy Export Script](https://github.com/AB1908/GOG-Galaxy-Export-Script)
- [epicstore_api Python Library](https://github.com/SD4RK/epicstore_api)
