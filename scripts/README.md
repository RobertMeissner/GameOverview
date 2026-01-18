# GameOverview Import Scripts

This folder contains automation tools to help you import your game libraries from various stores.

## 📁 Files

### 🚀 Automation Tools

#### `store-auto-export.user.js`
**Tampermonkey/Greasemonkey userscript for one-click exports**

- Adds "📤 Export to GameOverview" buttons to store websites
- Automatically fetches all games and sends them to your GameOverview instance
- Supports: Epic Games, GOG, Steam, Steam Family Library
- No copy/paste needed!

**Installation:**
1. Install [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Open Tampermonkey → Create new script
3. Copy the contents of `store-auto-export.user.js` and paste
4. Save (Ctrl+S)
5. Visit any supported store page and click the export button

#### `auto_import_stores.py`
**Python script for command-line automation**

- Fetches games using your browser cookies (no manual login needed)
- Imports directly into GameOverview API
- Supports batch processing from multiple stores
- Can be scheduled with cron/Task Scheduler

**Installation:**
```bash
pip install requests browser-cookie3
```

**Usage:**
```bash
# Import from all stores
python auto_import_stores.py --all

# Import only Epic Games
python auto_import_stores.py --epic

# Import only GOG
python auto_import_stores.py --gog

# Import Steam (requires API key)
python auto_import_stores.py --steam YOUR_API_KEY YOUR_STEAM_ID

# Use specific browser cookies
python auto_import_stores.py --browser chrome --all

# Custom API URL
python auto_import_stores.py --api-url http://your-server:8080 --all
```

**Requirements:**
- Must be logged into stores in Chrome or Firefox
- GameOverview backend must be running

### 📦 Legacy Tools

#### `import_legacy_data.py`
Legacy data import script for migrating old GameOverview data.

---

## 🎯 Quick Start

### Recommended: Use the Userscript

1. Install Tampermonkey browser extension
2. Install the userscript (`store-auto-export.user.js`)
3. Visit store websites while logged in
4. Click "📤 Export to GameOverview" button
5. Done! Games are automatically imported

### Alternative: Python Automation

Best for:
- Running scheduled imports
- Batch processing multiple stores
- Server/headless environments

```bash
pip install requests browser-cookie3
python auto_import_stores.py --all
```

---

## 📖 Full Documentation

See [../docs/store-import-scripts.md](../docs/store-import-scripts.md) for:
- Detailed installation instructions
- Manual browser console scripts (if automation doesn't work)
- Troubleshooting guide
- Store-specific notes

---

## 🔧 Configuration

### Userscript Configuration

Edit these variables in the userscript:
```javascript
const API_BASE_URL = 'http://localhost:8080';  // Your GameOverview API URL
```

### Python Script Configuration

Use command-line arguments:
```bash
--api-url http://localhost:8080    # GameOverview API URL
--browser chrome                   # Browser to extract cookies from (chrome/firefox/auto)
```

---

## 🐛 Troubleshooting

### "Export failed. Is GameOverview running?"

- Make sure your GameOverview backend is running
- Check that the API URL is correct (default: `http://localhost:8080`)
- Verify CORS is enabled for your frontend domain

### "No games found" or "Fetch failed"

- Ensure you're logged into the store website
- Try refreshing the page
- Check browser console for errors
- Fall back to manual console scripts (see docs)

### Python script: "Cookie extraction failed"

- Make sure you're logged into the stores in Chrome or Firefox
- Close the browser before running the script (some browsers lock the cookie database)
- Try specifying browser explicitly: `--browser chrome` or `--browser firefox`

### Import shows 0 created/0 updated

- Games might already exist in your database
- Check the "failed" count - there might be validation errors
- Try with a single game first to debug

---

## 🤝 Contributing

Found a bug or have an improvement?

1. Check if store APIs have changed (they do frequently!)
2. Update the selectors/API endpoints in the scripts
3. Test with your own accounts
4. Submit a PR with your fixes

---

## ⚠️ Disclaimer

These scripts use reverse-engineered store APIs and browser automation:

- ✓ Safe for personal use
- ✓ Read-only operations (no data modification on stores)
- ✗ Not officially supported by stores
- ⚠️ May break if stores change their APIs/page structure

Use at your own discretion. Always maintain backups of your data.
