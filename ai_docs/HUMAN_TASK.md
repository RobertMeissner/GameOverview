# Hexagonal Architecture Learning Plan - Steam Catalog Focus

## Learning Objective
Learn Hexagonal Architecture (Ports & Adapters) by refactoring the Steam catalog functionality (`load_catalog()` in `request_rating.py`) as a practical example. This will serve as a foundation for understanding clean architecture principles before applying them to the broader backend.

## Why Start with Steam Catalog?
The `load_catalog()` function is an excellent learning example because it:
- Has clear external dependencies (file system, HTTP API)
- Contains business logic mixed with infrastructure concerns
- Is self-contained and testable
- Demonstrates common architectural problems (tight coupling, hard to test, mixed responsibilities)

## Essential Reading Material

### Core Hexagonal Architecture Concepts
1. **Original Article**: [Hexagonal Architecture by Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)
2. **Practical Guide**: [Hexagonal Architecture with Python](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
3. **Python Implementation**: [Architecture Patterns with Python (O'Reilly)](https://www.cosmicpython.com/) - Chapters 1-4
4. **Ports & Adapters Explained**: [DDD, Hexagonal, Onion, Clean, CQRS](https://herbertograca.com/2017/11/16/explicit-architecture-01-ddd-hexagonal-onion-clean-cqrs-how-i-put-it-all-together/)

### Python-Specific Resources
5. **Dependency Injection in Python**: [Python Dependency Injection](https://python-dependency-injector.ets-labs.org/)
6. **Testing Strategies**: [Testing Pyramid for Python](https://martinfowler.com/articles/practical-test-pyramid.html)
7. **Repository Pattern**: [Repository Pattern in Python](https://www.cosmicpython.com/book/chapter_02_repository.html)

## Hexagonal Architecture Learning Tasks

### Phase 1: Understanding Current Problems (1 day)
**Goal**: Identify architectural issues in current Steam catalog implementation

**Tasks**:
1. **Analyze Current Code** (`backend/src/request_rating.py:106-122`)
   - Document all external dependencies (file system, HTTP API, logging)
   - Identify business rules vs infrastructure concerns
   - Map data flow and transformations
   - Note testing difficulties

2. **Create Problem Statement**
   - List why current code is hard to test
   - Identify coupling issues
   - Document configuration dependencies

**Deliverable**: Written analysis of current architectural problems

---

### Phase 2: Design Hexagonal Solution (2 days)
**Goal**: Design clean architecture for Steam catalog functionality

**Tasks**:
1. **Define Domain Model**
   ```python
   # Domain entities and value objects
   class GameCatalog:
       def __init__(self, games: Dict[str, int]): ...

   class SteamAppId:
       def __init__(self, value: int): ...

   class GameName:
       def __init__(self, value: str): ...
   ```

2. **Define Ports (Interfaces)**
   ```python
   # Primary ports (use cases)
   class CatalogService(ABC):
       def get_app_id_by_name(self, name: str) -> Optional[int]: ...
       def refresh_catalog(self) -> None: ...

   # Secondary ports (infrastructure interfaces)
   class CatalogRepository(ABC):
       def load_catalog(self) -> Dict[str, int]: ...
       def save_catalog(self, catalog: Dict[str, int]) -> None: ...

   class SteamApiClient(ABC):
       def fetch_app_list(self) -> Dict[str, Any]: ...
   ```

3. **Design Adapters**
   ```python
   # Secondary adapters (infrastructure implementations)
   class JsonFileCatalogRepository(CatalogRepository): ...
   class HttpSteamApiClient(SteamApiClient): ...
   class InMemoryCatalogRepository(CatalogRepository): ...  # for testing
   class MockSteamApiClient(SteamApiClient): ...  # for testing
   ```

**Deliverable**: Complete interface design with documentation

---

### Phase 3: Implement Core Domain (1 day)
**Goal**: Implement business logic without external dependencies

**Tasks**:
1. **Create Domain Services**
   ```python
   class SteamCatalogService:
       def __init__(self, repository: CatalogRepository, api_client: SteamApiClient):
           self._repository = repository
           self._api_client = api_client

       def get_app_id_by_name(self, name: str) -> Optional[int]:
           # Pure business logic - no external dependencies
           catalog = self._repository.load_catalog()
           return catalog.get(name, None)

       def refresh_catalog(self) -> None:
           # Orchestrates data flow without knowing implementation details
           api_data = self._api_client.fetch_app_list()
           catalog = self._restructure_api_data(api_data)
           self._repository.save_catalog(catalog)
   ```

2. **Implement Domain Logic**
   - Game name normalization
   - Catalog data transformation
   - Business rules for app ID matching

**Deliverable**: Working domain service with unit tests

---

### Phase 4: Implement Adapters (1 day)
**Goal**: Create infrastructure implementations that satisfy the ports

**Tasks**:
1. **File System Adapter**
   ```python
   class JsonFileCatalogRepository(CatalogRepository):
       def __init__(self, file_path: str):
           self._file_path = file_path

       def load_catalog(self) -> Dict[str, int]:
           # Handle file I/O, JSON parsing, error handling
           if not os.path.exists(self._file_path):
               return {}
           with open(self._file_path, 'r') as f:
               return json.load(f)
   ```

2. **HTTP API Adapter**
   ```python
   class HttpSteamApiClient(SteamApiClient):
       def __init__(self, base_url: str, timeout: int = 30):
           self._base_url = base_url
           self._timeout = timeout

       def fetch_app_list(self) -> Dict[str, Any]:
           # Handle HTTP requests, retries, error handling
           response = requests.get(f"{self._base_url}/ISteamApps/GetAppList/v2/")
           response.raise_for_status()
           return response.json()
   ```

**Deliverable**: Working adapters with integration tests

---

### Phase 5: Dependency Injection & Configuration (1 day)
**Goal**: Wire everything together with proper dependency injection

**Tasks**:
1. **Create Configuration**
   ```python
   @dataclass
   class SteamConfig:
       catalog_file_path: str
       api_base_url: str
       api_timeout: int = 30

       @classmethod
       def from_env(cls) -> 'SteamConfig':
           return cls(
               catalog_file_path=os.getenv('STEAM_CATALOG_FILE', 'steam_catalog.json'),
               api_base_url=os.getenv('STEAM_API_URL', 'https://api.steampowered.com'),
           )
   ```

2. **Create Factory/Container**
   ```python
   class SteamCatalogFactory:
       @staticmethod
       def create_service(config: SteamConfig) -> SteamCatalogService:
           repository = JsonFileCatalogRepository(config.catalog_file_path)
           api_client = HttpSteamApiClient(config.api_base_url, config.api_timeout)
           return SteamCatalogService(repository, api_client)
   ```

3. **Update FastAPI Integration**
   ```python
   # In main.py
   steam_service = SteamCatalogFactory.create_service(SteamConfig.from_env())

   @app.get("/games/search/{name}")
   def search_game(name: str):
       app_id = steam_service.get_app_id_by_name(name)
       return {"app_id": app_id}
   ```

**Deliverable**: Complete working system with dependency injection

---

### Phase 6: Comprehensive Testing (1 day)
**Goal**: Demonstrate testing benefits of hexagonal architecture

**Tasks**:
1. **Unit Tests** (Domain layer - no external dependencies)
   ```python
   def test_catalog_service_finds_existing_game():
       # Arrange
       mock_repo = Mock(spec=CatalogRepository)
       mock_repo.load_catalog.return_value = {"Half-Life 2": 220}
       service = SteamCatalogService(mock_repo, Mock())

       # Act
       app_id = service.get_app_id_by_name("Half-Life 2")

       # Assert
       assert app_id == 220
   ```

2. **Integration Tests** (Adapter layer)
   ```python
   def test_json_repository_loads_real_file():
       # Test with actual file system
       repo = JsonFileCatalogRepository("test_catalog.json")
       catalog = repo.load_catalog()
       assert isinstance(catalog, dict)
   ```

3. **End-to-End Tests** (Full system)
   ```python
   def test_catalog_refresh_integration():
       # Test with real HTTP calls (or VCR.py for recorded responses)
       config = SteamConfig.from_env()
       service = SteamCatalogFactory.create_service(config)
       service.refresh_catalog()
       # Verify catalog was updated
   ```

**Deliverable**: Complete test suite demonstrating all testing levels

---

## Success Criteria

After completing this learning plan, you should be able to:

- [ ] Explain the difference between ports and adapters
- [ ] Identify primary vs secondary ports in any system
- [ ] Design interfaces that isolate business logic from infrastructure
- [ ] Implement dependency injection without frameworks
- [ ] Write unit tests that don't require external dependencies
- [ ] Understand when and why to use hexagonal architecture

## Files to Create/Modify

### New Files (Hexagonal Implementation)
```
backend/src/steam_catalog/
├── domain/
│   ├── __init__.py
│   ├── entities.py          # GameCatalog, SteamAppId, GameName
│   └── services.py          # SteamCatalogService
├── ports/
│   ├── __init__.py
│   ├── repository.py        # CatalogRepository interface
│   └── api_client.py        # SteamApiClient interface
├── adapters/
│   ├── __init__.py
│   ├── json_repository.py   # JsonFileCatalogRepository
│   ├── http_api_client.py   # HttpSteamApiClient
│   └── memory_repository.py # InMemoryCatalogRepository (testing)
├── config.py                # SteamConfig
└── factory.py               # SteamCatalogFactory
```

### Test Files
```
backend/tests/steam_catalog/
├── unit/
│   ├── test_domain_services.py
│   └── test_entities.py
├── integration/
│   ├── test_json_repository.py
│   └── test_http_api_client.py
└── e2e/
    └── test_catalog_system.py
```

## Next Steps After Steam Catalog

Once you've mastered hexagonal architecture with the Steam catalog:

1. **Apply to Game Management** - Refactor game CRUD operations
2. **Apply to Rating System** - Refactor Steam rating functionality
3. **Apply to Data Processing** - Refactor pandas data pipeline
4. **Full Backend Refactoring** - Apply patterns to entire FastAPI application

## Additional Learning Resources

### Books
- "Clean Architecture" by Robert C. Martin
- "Architecture Patterns with Python" by Harry Percival & Bob Gregory
- "Domain-Driven Design" by Eric Evans

### Articles & Blogs
- [Hexagonal Architecture in Python](https://netflixtechblog.com/ready-for-changes-with-hexagonal-architecture-b315ec967749)
- [Testing Strategies for Hexagonal Architecture](https://blog.cleancoder.com/uncle-bob/2014/05/11/FrameworksAreDetails.html)
- [Dependency Injection Patterns](https://martinfowler.com/articles/injection.html)

This focused approach will give you hands-on experience with hexagonal architecture principles while working with familiar domain logic. The Steam catalog is complex enough to demonstrate real architectural benefits but simple enough to complete in a reasonable timeframe.

### 1. **CRITICAL - Separate Business Logic from API Layer**
**Priority: HIGH**
**Estimated Effort: 2-3 days**

**Why this matters:**
- Currently, all business logic is embedded directly in FastAPI route handlers
- Makes testing extremely difficult (requires full HTTP stack)
- Violates single responsibility principle
- Blocks future migration to Cloudflare Workers

**What to do:**
- Create `backend/src/services/` directory
- Extract game management logic into `GameService` class
- Extract data processing logic into `DataService` class
- Extract file operations into `FileService` class
- Move API models to `backend/src/models/` directory
- Update route handlers to use services (thin controller pattern)

**Files to refactor:**
- `main.py` lines 59-270 (all route handlers)
- Create new: `src/services/game_service.py`, `src/services/data_service.py`, `src/services/file_service.py`
- Create new: `src/models/requests.py`, `src/models/responses.py`

---

### 2. **HIGH - Fix Import Structure and Dependencies**
**Priority: HIGH**
**Estimated Effort: 1 day**

**Why this matters:**
- Mixed relative/absolute imports create confusion
- Circular import risks
- Inconsistent module structure
- Some imports are duplicated or unnecessary

**What to do:**
- Standardize all imports to absolute imports from project root
- Remove duplicate imports (lines 6 vs 12-24 in main.py)
- Create proper `__init__.py` files with explicit exports
- Add dependency injection for external services
- Fix the constants import duplication issue

**Files to refactor:**
- `main.py` (lines 1-29 - import cleanup)
- All files in `src/` directory
- Update `__init__.py` files throughout

---

### 3. **HIGH - Implement Proper Error Handling and Validation**
**Priority: HIGH**
**Estimated Effort: 1-2 days**

**Why this matters:**
- Generic exception handling masks real issues (lines 116, 154, 249)
- No input validation beyond basic Pydantic models
- Error responses are inconsistent
- No logging for debugging production issues

**What to do:**
- Create custom exception classes for different error types
- Add comprehensive input validation with detailed error messages
- Implement structured logging with different levels
- Create consistent error response format
- Add request/response middleware for logging

**Files to refactor:**
- Create new: `src/exceptions.py`, `src/logging_config.py`
- Update all route handlers in `main.py`
- Add validation to all Pydantic models

---

### 4. **MEDIUM - Extract Configuration Management**
**Priority: MEDIUM**
**Estimated Effort: 1 day**

**Why this matters:**
- Hard-coded file paths and configuration scattered throughout
- Environment-specific logic mixed with business logic
- No centralized configuration validation
- Docker detection logic is primitive

**What to do:**
- Create `src/config.py` with environment-based configuration
- Use Pydantic Settings for configuration validation
- Extract all file paths and constants to configuration
- Add environment variable support for all configurable values
- Remove hard-coded paths from business logic

**Files to refactor:**
- `src/constants.py` → `src/config.py`
- Update all files that import constants
- Add `.env` file support

---

### 5. **MEDIUM - Implement Repository Pattern for Data Access**
**Priority: MEDIUM**
**Estimated Effort: 2 days**

**Why this matters:**
- Direct file system operations scattered throughout code
- No abstraction for data persistence layer
- Difficult to test without actual files
- Blocks future database migration

**What to do:**
- Create abstract `Repository` interface
- Implement `ParquetRepository` for current file-based storage
- Create `GameRepository` and `ThumbnailRepository` classes
- Add in-memory repository for testing
- Update services to use repositories instead of direct file access

**Files to refactor:**
- Create new: `src/repositories/base.py`, `src/repositories/parquet_repo.py`
- Update: `src/services/` files to use repositories
- Remove direct file operations from route handlers

---

### 6. **MEDIUM - Add Comprehensive Testing Infrastructure**
**Priority: MEDIUM**
**Estimated Effort: 2-3 days**

**Why this matters:**
- Current tests are minimal and don't cover critical paths
- No integration tests for API endpoints
- No mocking of external dependencies
- Testing requires actual file system setup

**What to do:**
- Add pytest fixtures for test data and mocking
- Create unit tests for all service classes
- Add integration tests for API endpoints using TestClient
- Mock external API calls (Steam, GOG, etc.)
- Add test coverage reporting
- Create test data factories

**Files to create:**
- `tests/conftest.py` (pytest fixtures)
- `tests/unit/test_services.py`
- `tests/integration/test_api.py`
- `tests/factories.py` (test data)
- Update existing test files

---

### 7. **LOW - Performance and Code Quality Improvements**
**Priority: LOW**
**Estimated Effort: 1 day**

**Why this matters:**
- Some inefficient pandas operations
- Missing type hints in several places
- Code duplication in data processing
- No async/await optimization for I/O operations

**What to do:**
- Add comprehensive type hints throughout codebase
- Optimize pandas operations (avoid repeated file reads)
- Extract common data processing functions
- Add async/await for file I/O operations where beneficial
- Run code quality tools (black, isort, mypy)

**Files to refactor:**
- All Python files for type hints
- `src/utils.py` for common functions
- Route handlers for async optimization

---

## Implementation Strategy

### Phase 1: Foundation (Tasks 1-2)
Start with separating business logic and fixing imports. This creates a solid foundation for all other improvements.

### Phase 2: Reliability (Tasks 3-4)
Add proper error handling and configuration management to make the system more robust.

### Phase 3: Architecture (Tasks 5-6)
Implement repository pattern and comprehensive testing to prepare for future migrations.

### Phase 4: Polish (Task 7)
Performance and code quality improvements.

## Migration Alignment

This refactoring plan aligns with the project's goal of migrating to Cloudflare Workers:

- **Service layer** can be easily adapted to Worker environment
- **Repository pattern** allows switching from files to D1 database
- **Configuration management** supports environment variables in Workers
- **Proper error handling** translates well to HTTP responses
- **Comprehensive testing** ensures migration doesn't break functionality

## Success Criteria

- [ ] All business logic extracted from route handlers
- [ ] 100% test coverage for service layer
- [ ] Zero hard-coded file paths or configuration
- [ ] Consistent error handling and logging
- [ ] All imports follow project standards
- [ ] Repository pattern implemented for all data access
- [ ] Performance benchmarks maintained or improved

## Notes

- Keep the existing API contract intact during refactoring
- Each task can be implemented incrementally without breaking existing functionality
- Consider creating feature branches for each major task
- The current TypeScript Worker backend can serve as a reference for patterns and structure
