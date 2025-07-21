# GameOverview Project Documentation

## Overview
GameOverview is a game library management application transitioning from a traditional multi-service architecture to a unified serverless deployment on Cloudflare Workers.

## Technology Stack
- **Frontend**: React 18 with TypeScript, Material-UI components
- **Backend**: Cloudflare Workers with TypeScript (migrated from Python FastAPI)
- **Database**: Cloudflare D1 (migrated from local Parquet files)
- **Authentication**: JWT with Web Crypto API, HTTP-only cookies
- **Deployment**: GitHub Actions → Cloudflare Workers
- **Build Tools**: Create React App, Wrangler CLI

## Architecture Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub Repo   │───▶│ GitHub Actions  │───▶│ Cloudflare      │
│                 │    │ 1. Build React  │    │ Worker          │
│ • React Source  │    │ 2. Copy Assets  │    │ • Static Files  │
│ • Worker Code   │    │ 3. Deploy       │    │ • API Routes    │
│ • TypeScript    │    │ 4. Run Tests    │    │ • D1 Database   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Core Principles
1. **Serverless-First**: Prioritize solutions that eliminate infrastructure management
2. **Minimal Dependencies**: Avoid heavy libraries that don't work in serverless environments
3. **Configuration as Code**: All settings via environment variables and version control
4. **Build Separation**: Generate artifacts during deployment, not in development
5. **Code Quality Gates**: Automated linting and type checking prevent regressions

## Development Workflow
### Local Development
```bash
# Frontend development
cd frontend && npm start

# Legacy backend (temporary)
cd backend && python main.py

# Worker development
cd worker && npm run dev
```

### Production Deployment
```bash
# Manual deployment
cd worker && npm run build && npm run deploy

# Automated via GitHub Actions on main branch push
```

### Quality Assurance
- ESLint warnings treated as build failures
- TypeScript strict mode enabled
- Comprehensive test suite with 90%+ coverage
- Local build testing required before commits
- Automated testing in CI/CD pipeline

### Testing Commands
```bash
# Backend tests
cd worker && npm test
cd worker && npm run test:coverage

# Frontend tests
cd frontend && npm test
cd frontend && npm test -- --coverage --run

# Type checking
cd worker && npm run type-check
```

## Architectural Decision Records

### ADR-001: Unified Cloudflare Worker Architecture
**Status**: Implemented
**Context**: Originally deployed as separate Cloudflare Pages (frontend) and Workers (API)
**Decision**: Consolidate to single Worker handling both static assets and API endpoints
**Consequences**:
- ✅ Simplified deployment pipeline (one service vs two)
- ✅ Reduced CORS complexity and routing issues
- ✅ Lower operational costs and unified monitoring
- ❌ Slightly more complex Worker code structure

### ADR-002: Build Artifacts Excluded from Version Control
**Status**: Implemented
**Context**: Build outputs (`build/`, `static/`) were being committed to repository
**Decision**: Generate all build artifacts during CI/CD, exclude from git
**Consequences**:
- ✅ Cleaner repository without binary artifacts
- ✅ Eliminates merge conflicts on generated files
- ✅ Ensures builds are always fresh from source
- ❌ Requires reliable CI/CD for all deployments

### ADR-003: Environment-Driven Configuration
**Status**: Implemented
**Context**: Hard-coded URLs and configuration scattered throughout codebase
**Decision**: Centralize all configuration in environment variables
**Consequences**:
- ✅ Easy environment promotion (dev → staging → prod)
- ✅ Secrets management through platform-native tools
- ✅ Configuration changes without code deployments
- ❌ Additional complexity in local development setup

### ADR-004: Incremental Backend Migration Strategy
**Status**: Superseded by ADR-008
**Context**: Large Python FastAPI backend with file system dependencies
**Decision**: Migrate endpoints individually, starting with stateless operations
**Consequences**:
- ✅ Reduced risk of breaking existing functionality
- ✅ Ability to validate each migration independently
- ✅ Maintains development velocity during transition
- ❌ Temporary complexity of running dual systems

### ADR-005: Strict Code Quality Enforcement
**Status**: Implemented
**Context**: Inconsistent code style and potential runtime errors from linting warnings
**Decision**: Treat all ESLint warnings as build failures in CI/CD
**Consequences**:
- ✅ Consistent code style across the project
- ✅ Early detection of potential runtime issues
- ✅ Reduced technical debt accumulation
- ❌ Stricter development workflow requirements

### ADR-006: Modern Assets API Migration
**Status**: Implemented
**Context**: Legacy `[site]` configuration with KV asset handler was failing
**Decision**: Migrate to modern `[assets]` configuration with `env.ASSETS.fetch()`
**Consequences**:
- ✅ Reliable asset serving and uploads
- ✅ Better integration with Wrangler v4
- ✅ Simplified Worker code without KV dependencies
- ❌ Breaking change requiring code updates

### ADR-007: JWT-Based Authentication with Cloudflare D1
**Status**: Implemented
**Context**: Need for user authentication and personalized game libraries
**Decision**: Implement JWT authentication with Cloudflare D1 database
**Consequences**:
- ✅ Stateless authentication perfect for serverless environment
- ✅ Secure implementation with Web Crypto API
- ✅ Dual token support (Bearer + HTTP-only cookies)
- ✅ Per-user data isolation with proper relationships
- ❌ Cannot revoke tokens before expiration
- ❌ JWT tokens larger than session IDs

### ADR-008: TypeScript Migration for Backend
**Status**: Implemented
**Context**: JavaScript backend causing type-related runtime errors
**Decision**: Migrate Cloudflare Worker backend to TypeScript with strict configuration
**Consequences**:
- ✅ Compile-time error detection prevents runtime issues
- ✅ Better developer experience with IDE support
- ✅ Shared types ensure frontend/backend compatibility
- ✅ Improved maintainability and refactoring
- ❌ Additional learning curve for TypeScript
- ❌ Migration effort required

## Migration Status
- ✅ **Steam API Integration**: Successfully migrated to Workers
- ✅ **Authentication System**: Complete JWT-based auth with D1 database
- ✅ **TypeScript Backend**: Full migration from JavaScript to TypeScript
- ✅ **User Management**: Registration, login, protected routes implemented
- ✅ **Database Schema**: Cloudflare D1 with users and games tables
- 🎯 **Target**: Complete serverless architecture achieved

## Common Development Patterns
- API endpoints use `/api/*` prefix for future-compatibility
- Environment variables follow `REACT_APP_*` convention for frontend
- Build scripts include directory creation (`mkdir -p`) for reliability
- Repository secrets (not environment secrets) for CI/CD authentication

## Context for Future Sessions

**IMPORTANT**: When starting a new session on this project, always read these files first to understand the current state:

1. **SESSION_SUMMARY.md** - Current implementation status, what's been completed, and next steps
2. **docs/arc42/adr-007-jwt-authentication.adoc** - JWT authentication architecture and decisions
3. **docs/arc42/adr-008-typescript-migration.adoc** - TypeScript migration rationale and implementation
4. **This file (CLAUDE.md)** - Overall project architecture and development patterns

### Key Implementation Files to Review
- `worker/src/utils/auth.ts` - Core authentication utilities (AuthUtils, UserService)
- `worker/src/routes/auth.ts` - Authentication API endpoints
- `worker/src/types/index.ts` - Shared TypeScript type definitions
- `frontend/src/context/AuthContext.tsx` - Frontend authentication state management
- `frontend/src/services/authService.ts` - Frontend API client for authentication

### Current Architecture Status
- **Authentication**: Complete JWT-based system with Cloudflare D1 database
- **Backend**: Fully migrated to TypeScript with strict type safety
- **Frontend**: React with TypeScript, Material-UI components
- **Deployment**: Automated via GitHub Actions to Cloudflare Workers
- **Database**: Cloudflare D1 with users and games tables, proper relationships

### Testing Status
- **Backend Tests**: ✅ Comprehensive unit and integration tests implemented
- **Frontend Tests**: ✅ Component, service, and context tests implemented
- **Integration Tests**: ✅ Authentication endpoint tests implemented
- **CI/CD Testing**: ✅ Automated testing in GitHub Actions pipeline
