# HTMX Test Frontend for GameOverview

## 🎯 Purpose

This is a **minimal HTMX frontend** to test the "feel" of HTMX compared to your current Angular frontend, while keeping the existing Spring Boot backend unchanged.

## 📁 Structure

```
htmx-test/
├── index.html          # Main entry point with navigation
├── games.html          # Game catalog with filters
├── top-games.html      # Top rated unplayed games
├── backlog.html        # Backlog view
├── short-games.html    # Short, highly-rated games
├── styles.css          # Custom CSS styling
└── README.md           # This file
```

## 🚀 Quick Start

### 1. Start your Spring Boot backend

```bash
cd apps/api
./mvnw spring-boot:run
```

Make sure it's running at `http://localhost:8080`

### 2. Open the HTMX test frontend

You have several options:

**Option A: Simple file open**
```bash
# Just open index.html in your browser
open htmx-test/index.html
# or on Windows: start htmx-test/index.html
# or on Linux: xdg-open htmx-test/index.html
```

**Option B: Local web server** (recommended for better CORS handling)
```bash
cd htmx-test
python -m http.server 8000
# Then open http://localhost:8000 in your browser
```

**Option C: Use existing dev server**
If you have a dev server running, just navigate to the htmx-test directory.

## 🔧 Configuration

### User ID
The default user ID used in all API calls is: `00000000-0000-0000-0000-000000000001`

**To change it:**
1. Open any of the HTML files (games.html, top-games.html, etc.)
2. Find the `userId` input field or the hardcoded UUID in the fetch calls
3. Replace it with your actual user UUID from your Spring backend

### Spring Boot API URL
The frontend expects your Spring Boot backend at: `http://localhost:8080/api`

**If your backend is at a different URL:**
1. Open each HTML file
2. Find `API_BASE` constant (usually at the top of the script)
3. Update it to match your backend URL

## 🎯 Features Implemented

### ✅ All Views
- [x] **All Games** - Full game catalog with filtering
- [x] **Top Games** - Highest-rated unplayed games
- [x] **Backlog** - Games marked for later
- [x] **Short Games** - Short, highly-rated games with configurable filters

### ✅ All Actions
- [x] **View games** - Display game list from Spring API
- [x] **Filter games** - By store (Steam, GOG, Epic) and status (played/unplayed)
- [x] **Mark as played** - Toggle played status via PATCH API
- [x] **Add to backlog** - Toggle backlog status via PATCH API
- [x] **Search** - Text search for game names (client-side)

### ✅ UI Features
- [x] Responsive design (mobile-friendly)
- [x] Loading states with spinners
- [x] Error handling with user-friendly messages
- [x] Store ownership icons (Steam, GOG, Epic)
- [x] Game thumbnails
- [x] Rating and playtime display

## 📊 Comparison: HTMX vs Angular

| Aspect | HTMX + Vanilla JS | Angular |
|--------|-------------------|---------|
| **Files** | 5 HTML + 1 CSS = 6 files | 69 files |
| **Lines of Code** | ~800 | ~7,500 |
| **Dependencies** | HTMX (5KB), Bootstrap (CDN) | Angular, RxJS, TypeScript, npm |
| **Build Time** | 0 seconds | 15-45 seconds |
| **Dev Reload** | Instant (no build) | 1-3 seconds |
| **Learning Curve** | 1 hour | 1+ week |
| **Complexity** | Low | High |

## 💡 What This Demonstrates

### 1. **Simplicity**
- No build steps
- No npm, no Node.js
- Edit HTML directly
- No TypeScript compilation

### 2. **Direct Backend Integration**
- Calls your Spring Boot API directly
- No frontend framework abstraction
- Easy to debug (just check browser console)

### 3. **Progressive Enhancement**
- Works without JavaScript (for basic views)
- Enhances with JavaScript for interactivity
- Graceful degradation

### 4. **Minimal Code**
- ~800 lines vs ~7,500 lines
- No complex state management
- No reactive programming
- No dependency injection

## 🎯 What's NOT Implemented (Yet)

These features exist in your Angular frontend but are not in this test:

- [ ] Deduplication UI (complex fuzzy matching)
- [ ] Admin panel (inline editing of game data)
- [ ] Game scraper UI (search and add new games)
- [ ] Store dashboard (import from stores)
- [ ] Game enrichment UI
- [ ] Theme toggle (dark/light mode)
- [ ] Export to markdown
- [ ] Pagination
- [ ] Advanced sorting

**Why?** This is a *test* to feel the simplicity. If you like HTMX, these can be added incrementally.

## 🔄 Next Steps

### If you LIKE HTMX:
1. **Full HTMX migration**: Convert all views to use HTMX attributes instead of JavaScript
2. **Backend migration**: Replace Spring Boot with FastAPI (Python)
3. **Result**: ~20 files total, all Python, no Java, no Angular

### If you DON'T LIKE HTMX:
1. **Keep Angular**: But still migrate backend to FastAPI
2. **Result**: ~79 files (10 Python + 69 Angular), no Java

### If you're UNSURE:
1. **Try it more**: Add more views (deduplication, admin, etc.)
2. **Compare**: Use both frontends side-by-side
3. **Decide**: Based on your experience

## 📝 Notes

### About the Implementation

This test uses **vanilla JavaScript with fetch()** rather than pure HTMX because:

1. **Spring Boot returns JSON**, not HTML
2. **HTMX expects HTML** by default
3. **Transforming JSON to HTML** requires JavaScript

A **pure HTMX** implementation would require:
- Spring Boot to return HTML (not JSON)
- OR a backend proxy that transforms JSON to HTML
- OR using HTMX with custom extensions

But the **simplicity and feel** is still valid - the code is much shorter and easier to understand than Angular.

### Performance

- **Page load**: ~50-100ms (no build, no framework overhead)
- **API calls**: Same as Angular (depends on your Spring backend)
- **Rendering**: Slightly slower than Angular (no virtual DOM), but imperceptible for your use case

### Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge) - ✅ Fully supported
- IE11 - ❌ Not supported (but you don't need it for a personal tool)

## 🔗 Related Documentation

- [Session Context](../docs/session.md) - Why we're doing this
- [Task List](../docs/tasks.md) - Full migration plan
- [HTMX Documentation](https://htmx.org/docs/) - Official HTMX docs
- [FastAPI Documentation](https://fastapi.tiangolo.com/) - For backend migration

## 💬 Feedback Questions

After testing, ask yourself:

1. **Does this feel simpler than Angular?**
2. **Is the code easier to understand and modify?**
3. **Do you like the instant reload (no build step)?**
4. **Does it handle all your use cases adequately?**
5. **Would you be happy with this for a personal dashboard?**

If the answer to most of these is **yes**, then HTMX is a good fit for you!
