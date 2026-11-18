# Agent Guidelines for GameOverview

## Repo layout
- `apps/api` — Spring Boot 4 API, Java 25 (Maven, `./mvnw`), SQLite via JPA. Hexagonal, package-by-feature.
- `apps/frontend` — Angular 21 frontend (npm/vitest).
- `scripts/` — Python one-off tools for store imports (uv).
- `htmx-test/` — static HTML prototype, not part of the app.
- `docs/arc42` — architecture doc template (not yet filled in for the current API).

## Build/Test Commands
- **API**: `cd apps/api && ./mvnw verify` (tests only: `./mvnw test`; single test: `./mvnw test -Dtest=ClassName`)
- **Frontend**: `cd apps/frontend && npm test` (build: `npm run build`, types: `npx tsc --noEmit`)
- **Lint/format**: `cd apps/api && ./mvnw spotless:check` (Java, google-java-format AOSP); frontend uses Prettier (`npx prettier --check "src/**/*.{ts,html,scss}"`)
- CI runs the API tests on Java 25 (`.github/workflows/test-pr.yml`, job `api-tests`) and the frontend tests.

## Architecture (apps/api)
Modules under `com.robertforpresent.api`: `catalog`, `collection`, `scraper`, `thumbnail`, plus `config` and `shared`.
Each module follows hexagonal layers: `domain` (model, `port`, `repository`), `application` (service, command, dto), `infrastructure` (persistence, external clients, adapters), `presentation/rest` (controllers + request/response records).

Rules:
- Dependencies point inward only: `application` must not import `presentation`; `domain` must not import infrastructure.
- Cross-module calls go through ports defined in the consuming module's `domain.port` (e.g. `GameCollectionPort`), implemented by adapters in `infrastructure`.
- All external data sources implement `catalog.domain.port.ExternalSource` (`GameInfoProvider`, `GameEnrichmentProvider`).
- Controllers live in `presentation/rest` and map REST DTOs to application commands.
- One shared `HttpClient` bean (`config/HttpClientConfig`) and Spring's `ObjectMapper`; do not create new ones per class.
- Store identifiers use `catalog.domain.model.StoreCode`; lenient parsing via `shared/Parsing`.
- Mutating a `CanonicalGame` goes through `game.toBuilder()....build()`, never by re-listing all builder fields.

## Code Style
- Java 25: records, sealed types, switch expressions, `var`, `@Nullable` (jspecify). Target release is set by `java.version` in the pom — do not add `source`/`target` overrides.
- Constructor injection only (no field `@Autowired`).
- Domain aggregates use explicit builders; Lombok is used for `@Slf4j` and entity getters/setters.
- 4-space indentation (Spotless google-java-format AOSP). Comments only when explicitly requested.
