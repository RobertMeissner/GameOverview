# Agent Guidelines for GameOverview

## Build/Test Commands
- **Frontend**: `cd frontend && npm test` (single test: `npm test -- --testNamePattern="TestName"`)
- **Worker**: `cd worker && npm test` (single test: `vitest run src/path/to/test.ts`)
- **Backend**: `cd backend && uv run pytest` (single test: `uv run pytest tests/test_file.py::test_function`)
- **Lint**: `cd backend && make pre-commit` (Python), Frontend/Worker use built-in ESLint
- **Type check**: `cd worker && npm run type-check`, Frontend uses built-in TypeScript

## Code Style
- **Python**: Use ruff formatting (140 char line length), dataclasses with type hints, snake_case
- **TypeScript**: Use interfaces over types, explicit return types, camelCase variables
- **Imports**: Group by external/internal, use absolute paths where possible
- **Error handling**: Use proper exception types (Python), typed errors (TypeScript)
- **Naming**: Descriptive names, avoid abbreviations, use consistent patterns
- **Comments**: Only add when explicitly requested by user

## Architecture
- **Backend**: Hexagonal architecture (domain/application/adapters), use dependency injection
- **Frontend**: React with Material-UI, custom hooks for data fetching
- **Worker**: Cloudflare Workers with D1 database
- **Testing**: Unit tests required, integration tests for API endpoints

## Key Patterns
- Use existing utilities and services before creating new ones
- Follow established patterns in each module (check neighboring files)
- Maintain type safety across all TypeScript code
- Use environment-specific configurations via environment variables
