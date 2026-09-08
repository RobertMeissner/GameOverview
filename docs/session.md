# Session Context: HTMX Exploration for GameOverview

## 📅 Date
2025-01-10

## 🎯 Objective
Explore HTMX as a lightweight alternative to Angular for the GameOverview dashboard frontend, while keeping the existing Spring Boot backend for initial testing.

## 💡 User Requirements
1. **Primary Goal**: Test the "feel" of HTMX before committing to full migration
2. **Constraint**: Keep Spring Boot backend unchanged during testing
3. **Constraint**: Preserve all existing data
4. **Long-term Goal**: Migrate from Java/Spring Boot to Python/FastAPI (Option A)

## 📚 Background

### Current Stack
- **Backend**: Spring Boot (Java 25) with 96 files, JPA/Hibernate, SQLite
- **Frontend**: Angular 21 with 69 files, TypeScript, RxJS
- **Total**: 165+ files, ~20,000+ lines of code

### User History
- Started with Streamlit (Python) - abandoned because "frontend was not functional for data manipulation"
- Moved to React - found it heavy
- Currently on Angular - finds it overly complex for a personal dashboard
- **Main issue**: Java backend is too heavy, not the frontend

### User's Actual Needs
- Personal dashboard only (not a public SaaS)
- Data manipulation focus (import, deduplicate, filter, enrich games)
- CRUD operations on game library
- Multi-store aggregation (Steam, GOG, Epic)
- No need for SPA complexity, animations, or real-time updates

## 🔍 Key Insights from Code Analysis

### Frontend Complexity Breakdown
| Feature | Current Lines | Complexity | Can be Server-Side? |
|---------|---------------|------------|---------------------|
| Catalog (filter/sort) | ~560 | Medium | ✅ Yes |
| Top Games | ~220 | Low | ✅ Yes |
| Short Games | ~320 | Low | ✅ Yes |
| Backlog | ~470 | Medium | ✅ Yes |
| Store Dashboard | ~1270 | Medium | ✅ Yes |
| Admin Panel | ~1460 | High | ✅ Mostly |
| Deduplication | ~1920 | Very High | ✅ Yes (algorithm) |
| Game Scraper | ~370 | Medium | ✅ Yes |
| Game Enrichment | ~197 | Low | ✅ Yes |

**Total Frontend: ~7,500 lines**

### Backend Complexity (Spring Boot)
- 96 Java files
- JPA entities and repositories
- Service layer with business logic
- REST controllers
- DTO mapping (MapStruct)
- Validation
- **Total Backend: ~10,000+ lines**

### The Real Problem
**~70% of complexity is backend logic that could be simpler in Python:**
- Deduplication algorithm (Levenshtein distance, fuzzy matching)
- Import parsing (Steam/GOG/Epic text/JSON parsing)
- Enrichment logic (Metacritic, HLTB, Steam API integration)
- Data aggregation and statistics

## 🎯 Decision: Test HTMX with Current Backend

### Why This Approach
1. **Low Risk**: Spring backend remains unchanged
2. **Quick Test**: Can evaluate HTMX feel in ~1 hour
3. **Minimal Effort**: Create 3-5 HTMX files alongside existing Angular
4. **No Data Loss**: Reads from same Spring API

### Success Criteria for HTMX Test
- [ ] Can display game list from Spring API
- [ ] Can filter games (by store, played status)
- [ ] Can mark game as played (POST to Spring API)
- [ ] Can navigate between views
- [ ] Feels responsive and intuitive

## 📁 Files to Create for Testing

### Minimum HTMX Test Files
1. `htmx-test/index.html` - Entry point with HTMX setup
2. `htmx-test/games.html` - Game catalog with filters
3. `htmx-test/styles.css` - Basic styling
4. `htmx-test/app.js` - Minimal JS (if needed)

### Spring API Endpoints to Use
- `GET /api/collection/games` - Get all games
- `POST /api/collection/games/{id}/flags` - Update game flags
- `GET /api/catalog/games/top` - Get top games
- `GET /api/collection/games/backlog` - Get backlog

## 🔄 Next Steps

1. ✅ Create PR branch: `vibe/htmx-exploration-361fae`
2. ✅ Create this `session.md` file
3. ⏳ Create `task.md` with migration steps
4. ⏳ Create minimum HTMX test files
5. ⏳ Open PR for review

## 📝 Notes

- User wants to **feel** HTMX before deciding
- User acknowledges current setup is **overly complicated**
- User's **main pain point is Java backend**, not frontend
- Long-term goal: **FastAPI + HTMX** (~15 files vs 165)
- Short-term goal: **Test HTMX** with existing backend

## 🔗 Related Files
- `apps/api/src/main/java/com/robertforpresent/api/collection/presentation/rest/GamerCollectionController.java`
- `apps/api/src/main/java/com/robertforpresent/api/catalog/presentation/rest/CatalogController.java`
- `apps/frontend/src/app/features/catalog-component/catalog-component.ts`
- `apps/frontend/src/app/features/admin-panel/admin-panel.ts`
- `apps/frontend/src/app/features/game-deduplication/game-deduplication.ts`
