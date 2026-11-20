[![Maintainability](https://qlty.sh/gh/RobertMeissner/projects/GameOverview/maintainability.svg)](https://qlty.sh/gh/RobertMeissner/projects/GameOverview)

# GameOverview

Personal game-library dashboard: a scraper/enrichment backend plus an Angular frontend that shows
the highest-ranked games in my library that I haven't played yet — so I don't waste time switching
between Steam, GoG, Epic and other store accounts looking for something to play.

This is a one-person PoC. Everything is WIP and not production-ready. You will encounter bugs and
unexpected behaviour.

Parts of the used APIs are reverse engineered or simply obtained by misusing certain parts of the
stores' websites. Use at your own discretion.

## Stack

| Part | Technology |
|------|------------|
| `apps/api` | Spring Boot 4, Java 25, Maven (`./mvnw`), SQLite via JPA, hexagonal package-by-feature |
| `apps/frontend` | Angular, npm, vitest |
| `scripts/` | Python one-off tools for store imports (uv) |
| `docs/ai_docs/AGENTS.md` | architecture + coding rules for agents and humans |
| `docs/arc42/` | arc42 architecture doc template (not yet filled in for the current API) |
| `htmx-test/` | static HTML prototype, not part of the app |

## Running locally

API (port 8080):

```bash
cd apps/api
IGDB_CLIENT_ID=... IGDB_CLIENT_SECRET=... STEAM_API_KEY=... ./mvnw spring-boot:run
```

Frontend (port 4200, talks to `http://localhost:8080`, see `apps/frontend/src/environments/`):

```bash
cd apps/frontend
npm ci
npm start
```

Or both via `make run` from the repo root.

### Configuration (API)

Environment variables (see `apps/api/src/main/resources/application.properties`):

- `IGDB_CLIENT_ID` / `IGDB_CLIENT_SECRET` — IGDB (Twitch) API credentials, get them at
  https://dev.twitch.tv/console/apps
- `STEAM_API_KEY` — Steam Web API key, get it at https://steamcommunity.com/dev/apikey
- `CORS_ALLOWED_ORIGINS` — defaults to `http://localhost:4200`
- `APP_DEFAULT_GAMER_ID` — gamer used when a request has no `userId`

The database is a local SQLite file at `./data/gamedb.sqlite`; thumbnails are cached in
`./data/thumbnails`.

## Store imports

See [docs/store-import-scripts.md](docs/store-import-scripts.md) and the scripts in `scripts/`
(Tampermonkey userscript for one-click export, plus Python importers). Steam libraries can also be
imported directly through the API (`POST /steam/import-library`).

## Health check

`GET /scraper/health` smoke-tests the scraping pipeline (catalog search, IGDB/Steam/HLTB/GOG/Rawg
enrichment, thumbnail download) against the reference games in `scraper.reference-games`
(default: Elden Ring, Hades, Stardew Valley, Cyberpunk 2077). The same check runs monthly via
`.github/workflows/health-check.yml` and opens an issue when something is broken; the result is
also visible on the "Game Scraper" page in the frontend.

## Development

```bash
# API: format check + tests
cd apps/api && ./mvnw spotless:check verify

# Frontend: tests, build, types, lint
cd apps/frontend && npm test && npm run build && npx tsc --noEmit && npm run lint
```

CI (`.github/workflows/test-pr.yml`) runs both test suites on every PR to `main`; Dependabot opens
grouped weekly dependency PRs which are auto-merged once CI is green
(`.github/workflows/automerge.yml`).

Create an issue or pull request if you want to contribute.
