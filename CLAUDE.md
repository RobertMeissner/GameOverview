# GameOverview Project Documentation

## Overview
GameOverview is a game library management application transitioning from a traditional multi-service architecture to a unified serverless deployment on Cloudflare Workers.

## Technology Stack
- **Frontend**: React 18 with TypeScript, Material-UI components
- **Backend**: Python FastAPI (legacy), Cloudflare Workers (target)
- **Database**: Local Parquet files (legacy), migrating to cloud storage
- **Deployment**: GitHub Actions → Cloudflare Workers
- **Build Tools**: Create React App, Wrangler CLI

## Architecture Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub Repo   │───▶│ GitHub Actions  │───▶│ Cloudflare      │
│                 │    │ 1. Build React  │    │ Worker          │
│ • React Source  │    │ 2. Copy Assets  │    │ • Static Files  │
│ • Worker Code   │    │ 3. Deploy       │    │ • API Routes    │
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
- Local build testing required before commits
- Automated testing in CI/CD pipeline

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
**Status**: In Progress  
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

## Migration Status
- ✅ **Steam API Integration**: Successfully migrated to Workers
- 🔄 **File-based Operations**: Pending migration to cloud storage
- 📋 **Remaining FastAPI Endpoints**: Awaiting individual assessment
- 🎯 **Target**: Complete serverless architecture on Cloudflare platform

## Common Development Patterns
- API endpoints use `/api/*` prefix for future-compatibility
- Environment variables follow `REACT_APP_*` convention for frontend
- Build scripts include directory creation (`mkdir -p`) for reliability
- Repository secrets (not environment secrets) for CI/CD authentication
