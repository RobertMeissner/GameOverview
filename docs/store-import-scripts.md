# Game Store Import Scripts

This document contains browser console scripts to export your game libraries from various stores. These scripts are based on reverse-engineered APIs - use at your own discretion.

## Epic Games Library Export

Navigate to: `https://www.epicgames.com/account/transactions`

This script fetches ALL pages automatically via the Epic Games order history API:

```javascript
const fetchGamesList = async (pageToken = '', existingList = []) => {
  const data = await (await fetch(`https://www.epicgames.com/account/v2/payment/ajaxGetOrderHistory?sortDir=DESC&sortBy=DATE&nextPageToken=${pageToken}&locale=en-US`)).json();
  const gamesList = data.orders.reduce((acc, value) => [...acc, ...value.items.map(v => v.description)], []);
  console.log(`Games on this page: ${gamesList.length}, Next page: ${data.nextPageToken || 'none'}`);
  const newList = [...existingList, ...gamesList];
  if (!data.nextPageToken) return newList;
  return await fetchGamesList(data.nextPageToken, newList);
};

fetchGamesList().then(games => {
  console.log("Total games found: " + games.length);
  copy(games.join("\n"));
  console.log("Copied to clipboard! Paste into import.");
});
```

**How to use:**
1. Go to `https://www.epicgames.com/account/transactions`
2. Open browser DevTools (F12) → Console tab
3. If prompted, type `allow pasting` and press Enter
4. Paste the script and press Enter
5. Wait for it to fetch all pages (you'll see progress in console)
6. The game list is copied to your clipboard

**Note:** Some free games may not appear if they didn't generate an order record.

## Steam Library Export

### Method 1: Licenses Page (Manual - Most Reliable)

1. Go to: `https://store.steampowered.com/account/licenses/`
2. The page shows all your licenses
3. Select the game names and copy them
4. Paste into the bulk import (one game per line)

### Method 2: Steam Community Games Page (Console Script)

Navigate to: `https://steamcommunity.com/id/YOUR_STEAM_ID/games/?tab=all`

**Important:** Scroll all the way to the bottom first to load ALL games!

```javascript
var games = Array.from(document.getElementsByClassName("gameslistitems_GameName_22awl"));
var gameNames = games.map(g => g.innerHTML.trim());
console.log("Found " + gameNames.length + " games");
copy(gameNames.join("\n"));
console.log("Copied to clipboard! Paste into import.");
```

**Troubleshooting:**
- If you get 0 games, the page structure may have changed. Use Method 1 instead.
- Make sure your profile is set to public for the games list to be visible.
- Scroll to the very bottom before running the script.

### Method 3: Steam Web API (For Developers)

If you have a Steam API key, you can use:
```
http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=YOUR_API_KEY&steamid=YOUR_STEAM_ID&format=json&include_appinfo=true
```

See: [Steam Web API Documentation](https://developer.valvesoftware.com/wiki/Steam_Web_API)

## GOG Library Export

Navigate to: `https://www.gog.com/en/account`

```javascript
var games = gogData.accountProducts.map(p => p.title);
console.log("Found " + games.length + " games:");
console.log(games);
copy(games.join("\n"));
console.log("Copied to clipboard! Paste into import.");
```

**Note:** This only exports games visible on the current page. If you have multiple pages of games, you need to run this script on each page.

### Alternative: Full GOG Export with Pagination

For a complete export including all pages, you can save the entire `gogData` object:
```javascript
console.log(JSON.stringify(gogData, null, 2));
```

Then extract the game titles from the JSON.

## Using the Exported Data

After running any of these scripts:

1. The game list is copied to your clipboard (one game per line)
2. Go to your GameOverview app's **Store Dashboard** (`/stores`)
3. Click **Bulk Import**
4. Select the appropriate store (Steam, GOG, or Epic)
5. Paste the copied text into the text area
6. Click **Import Games**

The import will:
- Create new games if they don't exist in your catalog
- Update existing games with store-specific data
- Add new games to your collection automatically

## Troubleshooting

### "copy is not defined"
The `copy()` function is a Chrome DevTools feature. For other browsers:
```javascript
navigator.clipboard.writeText(output).then(() => console.log('Copied!'));
```

### "allow pasting" prompt
In Chrome, you may need to type `allow pasting` in the console first before pasting scripts.

### Scripts return 0 games
- Website structures change frequently
- Try the manual methods instead
- Check that you're logged in
- Ensure the page has fully loaded

### Some games missing
- Free games may not generate order records (Epic)
- DLCs may be listed separately
- Some games may have different names across platforms

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
