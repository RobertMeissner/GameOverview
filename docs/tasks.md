# Task List: Migration to FastAPI + HTMX

## 🎯 Objective A: Migrate Spring Boot Backend to FastAPI

**Goal**: Replace 96 Java files with ~10 Python files while preserving all functionality and data.

---

## 📋 Phase 1: Preparation & Understanding (Current)

### ✅ Completed
- [x] Analyze current Spring Boot backend structure
- [x] Identify all REST endpoints
- [x] Understand data models (DTOs, Entities)
- [x] Understand business logic (services)
- [x] Create PR branch: `vibe/htmx-exploration-361fae`
- [x] Create `session.md` with context

### 📌 Current Spring Boot API Endpoints

#### Collection Endpoints (GamerCollectionController)
- `GET /collection?userId={uuid}` - Get user's game collection
- `GET /collection/top?userId={uuid}` - Get top 3 games
- `PATCH /collection/games/{gameId}?userId={uuid}` - Update game flags
- `GET /collection/admin?userId={uuid}` - Get admin collection view
- `GET /collection/backlog?userId={uuid}` - Get backlog games
- `GET /collection/short-good?userId={uuid}&maxHours=5&minRating=80` - Get short, good games

#### Catalog Endpoints (CatalogController)
- `GET /catalog` - Get all canonical games
- `GET /catalog/duplicates` - Get duplicate game groups
- `PATCH /catalog/games/{gameId}` - Update catalog values
- `POST /catalog/games/{targetId}/merge` - Merge duplicate games

#### Store Endpoints (GameImportController, StoreStatsController)
- `POST /import/bulk` - Bulk import games
- `GET /stats` - Get store statistics

#### Scraper Endpoints (GameScraperController)
- `GET /scraper/games?query={search}&limit=10` - Search games
- `POST /scraper/games/{igdbId}` - Add game by IGDB ID
- `GET /scraper/status` - Get scraper status

#### Thumbnail Endpoints (ThumbnailController)
- `GET /thumbnails/{gameId}` - Get game thumbnail

---

## 📋 Phase 2: Create HTMX Test Frontend (Testing Now)

### 🎯 Goal: Test HTMX feel with existing Spring backend

#### Files to Create
- [ ] `htmx-test/index.html` - Main entry point
- [ ] `htmx-test/games.html` - Game catalog view
- [ ] `htmx-test/top-games.html` - Top games view
- [ ] `htmx-test/backlog.html` - Backlog view
- [ ] `htmx-test/styles.css` - Basic styling
- [ ] `htmx-test/.gitignore` - Ignore node_modules if any

#### API Integration Points
```
Spring Boot Base URL: http://localhost:8080
Frontend will use: http://localhost:8080/api
```

#### Key API Calls to Test
1. `GET /api/collection?userId={uuid}` - Fetch games
2. `PATCH /api/collection/games/{gameId}?userId={uuid}` - Update flags
3. `GET /api/collection/top?userId={uuid}` - Fetch top games
4. `GET /api/collection/backlog?userId={uuid}` - Fetch backlog

#### Data Model (from CollectionGameView.java)
```json
{
  "id": "uuid",
  "name": "string",
  "thumbnailUrl": "string",
  "rating": 0.0,
  "markedAsPlayed": false,
  "markedAsHidden": false,
  "markedForLater": false,
  "storeLinks": {
    "steamLink": "string",
    "steamRating": 0.0,
    "gogLink": "string",
    "epicLink": "string",
    "metacriticLink": "string",
    "metacriticScore": 0,
    "hltbLink": "string",
    "hltbMainHours": 0.0
  },
  "steamPlaytimeMinutes": 0,
  "storeOwnership": {
    "ownedOnSteam": false,
    "ownedOnGog": false,
    "ownedOnEpic": false,
    "ownedOnXbox": false,
    "ownedOnPlayStation": false,
    "otherStores": "string"
  },
  "genres": ["string"]
}
```

---

## 📋 Phase 3: Migrate Backend to FastAPI (After HTMX Test)

### 📁 Step 1: Project Setup
- [ ] Create `backend/` directory (or reuse existing)
- [ ] Initialize Python project with `pyproject.toml`
- [ ] Add dependencies: `fastapi`, `uvicorn`, `sqlalchemy`, `pydantic`
- [ ] Set up SQLite database connection
- [ ] Configure CORS for frontend access

### 📁 Step 2: Database Layer
- [ ] Create `models.py` with SQLAlchemy models
  - `CanonicalGame` (from Java entity)
  - `Store` (from Java entity)
  - `User` (from Java entity)
  - `CollectionEntry` (from Java entity)
- [ ] Create `database.py` with connection and session management
- [ ] Migrate existing SQLite data (if schema compatible)

### 📁 Step 3: Schema Definitions
- [ ] Create `schemas.py` with Pydantic models
  - `GameCreate`, `GameUpdate`, `GameResponse`
  - `CollectionGameView` (match Java DTO)
  - `UpdateFlagsRequest` (match Java DTO)
  - All other DTOs from Spring backend

### 📁 Step 4: API Endpoints (main.py)

#### Collection Endpoints
```python
# GET /collection
@app.get("/collection")
async def get_collection(user_id: UUID):
    # Implementation
    pass

# GET /collection/top
@app.get("/collection/top")
async def get_top_games(user_id: UUID):
    pass

# PATCH /collection/games/{game_id}
@app.patch("/collection/games/{game_id}")
async def update_flags(game_id: UUID, user_id: UUID, request: UpdateFlagsRequest):
    pass

# GET /collection/admin
@app.get("/collection/admin")
async def get_admin_collection(user_id: UUID):
    pass

# GET /collection/backlog
@app.get("/collection/backlog")
async def get_backlog(user_id: UUID):
    pass

# GET /collection/short-good
@app.get("/collection/short-good")
async def get_short_good_games(user_id: UUID, max_hours: float = 5, min_rating: int = 80):
    pass
```

#### Catalog Endpoints
```python
# GET /catalog
@app.get("/catalog")
async def get_catalog():
    pass

# GET /catalog/duplicates
@app.get("/catalog/duplicates")
async def get_duplicates():
    pass

# PATCH /catalog/games/{game_id}
@app.patch("/catalog/games/{game_id}")
async def update_catalog_values(game_id: UUID, request: UpdateCatalogRequest):
    pass

# POST /catalog/games/{target_id}/merge
@app.post("/catalog/games/{target_id}/merge")
async def merge_games(target_id: UUID, request: MergeGamesRequest):
    pass
```

#### Import & Scraper Endpoints
```python
# POST /import/bulk
@app.post("/import/bulk")
async def import_bulk_games(request: List[GameImportRequest]):
    pass

# GET /scraper/games
@app.get("/scraper/games")
async def search_games(query: str, limit: int = 10):
    pass

# POST /scraper/games/{igdb_id}
@app.post("/scraper/games/{igdb_id}")
async def add_game_by_igdb(igdb_id: int):
    pass

# GET /scraper/status
@app.get("/scraper/status")
async def get_scraper_status():
    pass
```

### 📁 Step 5: Business Logic Migration
- [ ] Migrate `GamerCollectionService.java` → `services/collection.py`
- [ ] Migrate `CatalogService.java` → `services/catalog.py`
- [ ] Migrate `GameImportService.java` → `services/import.py`
- [ ] Migrate `GameEnrichmentService.java` → `services/enrichment.py`
- [ ] Migrate `StoreService.java` → `services/store.py`
- [ ] Migrate deduplication algorithm → `services/deduplication.py`

### 📁 Step 6: Utility Functions
- [ ] Create `utils/name_normalization.py` - Name cleaning functions
- [ ] Create `utils/levenshtein.py` - String similarity (from Angular dedup)
- [ ] Create `utils/steam_parser.py` - Steam data parsing
- [ ] Create `utils/gog_parser.py` - GOG data parsing
- [ ] Create `utils/epic_parser.py` - Epic data parsing

### 📁 Step 7: Testing
- [ ] Test all endpoints with existing Angular frontend
- [ ] Verify data migration worked correctly
- [ ] Test with HTMX frontend (if created)
- [ ] Run existing integration tests (if any)

---

## 📋 Phase 4: Migrate Frontend to HTMX (Optional)

### If HTMX test is successful:
- [ ] Replace Angular with HTMX templates
- [ ] Migrate all views to server-rendered HTML
- [ ] Add HTMX attributes for interactivity
- [ ] Add Alpine.js for complex interactions (if needed)
- [ ] Remove Angular entirely

### If HTMX test is not successful:
- [ ] Keep Angular frontend
- [ ] Just use FastAPI backend
- [ ] Still reduces 96 Java files → 10 Python files

---

## 📊 Expected Results

### Before Migration
- **Backend**: 96 Java files, Spring Boot, Maven
- **Frontend**: 69 Angular files, TypeScript, RxJS
- **Total**: 165+ files
- **Build Time**: 30-60 seconds
- **Dependencies**: Java 25, Node.js, npm, Angular CLI

### After Phase 3 (FastAPI Backend)
- **Backend**: ~10 Python files, FastAPI, pip
- **Frontend**: 69 Angular files (unchanged)
- **Total**: ~79 files
- **Build Time**: 0 seconds (Python)
- **Dependencies**: Python 3.10+, FastAPI

### After Phase 4 (HTMX Frontend)
- **Backend**: ~10 Python files
- **Frontend**: ~10 HTMX templates + CSS
- **Total**: ~20 files
- **Build Time**: 0 seconds
- **Dependencies**: Python 3.10+, FastAPI, HTMX

---

## 🎯 Success Criteria

### Phase 2 (HTMX Test)
- [ ] HTMX frontend can display game list
- [ ] Can filter by store, played status
- [ ] Can mark games as played
- [ ] Can navigate between views
- [ ] User approves the "feel"

### Phase 3 (FastAPI Migration)
- [ ] All Spring endpoints have FastAPI equivalents
- [ ] All data is preserved
- [ ] All business logic works correctly
- [ ] Angular frontend works with FastAPI backend
- [ ] Tests pass

### Phase 4 (HTMX Migration - Optional)
- [ ] All Angular views replaced with HTMX
- [ ] All features work
- [ ] No build step required
- [ ] User is happy with simplicity

---

## ⏱️ Estimated Timeline

| Phase | Task | Time Estimate |
|-------|------|---------------|
| 2 | HTMX Test | 1-2 hours |
| 3 | FastAPI Backend | 1-2 days |
| 4 | HTMX Frontend (optional) | 1-2 days |
| **Total** | **Full Migration** | **2-4 days** |

---

## 📝 Notes

1. **Data Preservation**: SQLite database is file-based, so migration is just copying the file
2. **Incremental Migration**: Can do Phase 3 without Phase 4 (keep Angular)
3. **Rollback**: Easy - just switch back to Spring Boot if needed
4. **Testing**: Can test FastAPI backend with existing Angular frontend
5. **User's Main Pain Point**: Java backend complexity, not frontend

---

## 🔗 Dependencies for FastAPI

```toml
# pyproject.toml
[project]
name = "game-overview-api"
version = "1.0.0"
dependencies = [
    "fastapi>=0.109.0",
    "uvicorn[standard]>=0.27.0",
    "sqlalchemy>=2.0.25",
    "pydantic>=2.5.0",
    "python-multipart>=0.0.6",
    "python-dotenv>=1.0.0",
    "requests>=2.31.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-asyncio>=0.23.0",
    "httpx>=0.26.0",
]
```

---

## 🚀 Quick Start Commands

```bash
# Phase 2: Test HTMX
cd htmx-test
python -m http.server 8000  # Or use any static server

# Phase 3: Run FastAPI backend
cd backend
uvicorn main:app --reload --port 8080

# Phase 4: Run HTMX frontend (if migrated)
# Just open index.html in browser (no server needed for static files)
```
