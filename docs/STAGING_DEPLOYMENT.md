# Staging Deployment Guide

This document describes how to deploy to the staging environment for testing changes before production.

## Overview

The GameOverview project uses a git tag-based staging deployment strategy. Staging deployments are triggered by creating git tags with specific patterns.

## Staging Environment

- **URL**: https://nextbestgame-staging.robertforpresent.workers.dev
- **Database**: Separate D1 database (`gameoverview-staging-db`)
- **KV Namespace**: Separate KV namespace for feature flags
- **Environment**: `staging`

## Deployment Methods

### 1. Git Tag Deployment (Recommended)

Create a git tag with the staging pattern to trigger automatic deployment:

```bash
# Create a staging tag with current date/time
git tag staging-$(date +%Y-%m-%d-%H-%M)
git push origin staging-$(date +%Y-%m-%d-%H-%M)

# Or create a version-based staging tag
git tag v1.2.3-staging
git push origin v1.2.3-staging
```

**Supported tag patterns:**
- `staging-*` (e.g., `staging-2025-01-15-14-30`)
- `v*-staging` (e.g., `v1.2.3-staging`)

### 2. Manual Deployment

Deploy directly using npm scripts:

```bash
cd worker
npm run deploy:staging
```

### 3. GitHub Actions Manual Trigger

1. Go to the [Actions tab](https://github.com/your-repo/actions)
2. Select "Deploy to Cloudflare Workers"
3. Click "Run workflow"
4. Select "staging" from the environment dropdown
5. Click "Run workflow"

## Testing Staging Deployment

After deployment, verify the staging environment:

### 1. Test API Health
```bash
curl https://nextbestgame-staging.robertforpresent.workers.dev/api/health
```

### 2. Test User Registration
```bash
curl -X POST https://nextbestgame-staging.robertforpresent.workers.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"testpass123"}'
```

### 3. Test Game Addition
```bash
# Use the token from registration response
curl -X POST https://nextbestgame-staging.robertforpresent.workers.dev/api/games \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"name":"Test Game","store":"steam","app_id":"220"}'
```

### 4. Test Frontend
Visit https://nextbestgame-staging.robertforpresent.workers.dev in your browser.

## Database Migrations

When deploying new database schema changes to staging:

```bash
cd worker

# Run migrations on staging database
npx wrangler d1 execute DB --env staging --remote --file=./migrations/MIGRATION_FILE.sql
```

## Environment Differences

| Aspect | Production | Staging |
|--------|------------|---------|
| URL | `nextbestgame.robertforpresent.workers.dev` | `nextbestgame-staging.robertforpresent.workers.dev` |
| Database | `gameoverview-db` | `gameoverview-staging-db` |
| JWT Secret | Production secret | Staging secret |
| Environment | `production` | `staging` |

## Promoting to Production

After testing in staging, promote to production:

1. **Merge to main branch** (for automatic production deployment)
   ```bash
   git checkout main
   git merge your-feature-branch
   git push origin main
   ```

2. **Manual production deployment**
   ```bash
   cd worker
   npm run deploy:production
   ```

## Rollback

To rollback staging to a previous version:

```bash
# Find the previous tag
git tag -l "staging-*" | sort -r | head -5

# Create a new tag pointing to the previous commit
git tag staging-rollback-$(date +%Y-%m-%d-%H-%M) PREVIOUS_COMMIT_HASH
git push origin staging-rollback-$(date +%Y-%m-%d-%H-%M)
```

## Monitoring

- **Staging URL**: https://nextbestgame-staging.robertforpresent.workers.dev
- **Cloudflare Dashboard**: Monitor staging worker performance and logs
- **Database**: Check D1 database metrics in Cloudflare dashboard

## Troubleshooting

### Common Issues

1. **Database not found error**
   - Ensure migrations have been run on the staging database
   - Check that the staging database ID is correct in `wrangler.toml`

2. **Authentication errors**
   - Verify JWT secret is set correctly for staging environment
   - Check that the staging KV namespace is properly configured

3. **Asset loading issues**
   - Ensure frontend build completed successfully
   - Check that assets were copied to the `static` directory

### Debug Commands

```bash
# Check staging environment configuration
npx wrangler whoami
npx wrangler dev --env staging

# View staging database schema
npx wrangler d1 execute DB --env staging --command="SELECT name FROM sqlite_master WHERE type='table';"

# Check staging logs
npx wrangler tail --env staging
```

## Best Practices

1. **Always test in staging** before promoting to production
2. **Use descriptive tag names** with timestamps for easy identification
3. **Run database migrations** before deploying code changes that require them
4. **Verify all functionality** including authentication, game management, and frontend
5. **Clean up old staging tags** periodically to avoid clutter
6. **Document any staging-specific configuration** or test data requirements

## Related Documentation

- [ADR-012: Staging Deployment Strategy](./arc42/adr-012-staging-deployment-strategy.adoc)
- [Deployment Architecture](./arc42/07_deployment_view.adoc)
- [Testing Guide](./TESTING.md)
