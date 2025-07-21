# Feature Flagging System

GameOverview uses a custom Cloudflare KV-based feature flagging system for safe deployment and testing of new features.

## Overview

The feature flagging system provides:
- ✅ **Runtime toggles** - Enable/disable features without deployments
- ✅ **Gradual rollouts** - Percentage-based user targeting
- ✅ **User targeting** - Whitelist/blacklist specific users
- ✅ **Environment isolation** - Separate flags for dev/staging/prod
- ✅ **Consistent evaluation** - Same user always gets same result
- ✅ **Zero latency** - KV cached at edge locations

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Worker Code   │───▶│ FeatureFlagService │───▶│ Cloudflare KV   │
│                 │    │                 │    │                 │
│ • Route Guards  │    │ • Flag Evaluation│    │ • Flag Config   │
│ • Feature Gates │    │ • User Targeting │    │ • User Overrides│
│ • A/B Testing   │    │ • Variant Selection│    │ • Rollout State │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Usage

### Basic Flag Check

```typescript
import { createFeatureFlagService } from './utils/featureFlags.js'

const flags = createFeatureFlagService(env)
const authEnabled = await flags.isEnabled('authentication', userId)

if (authEnabled) {
  // Show new authentication UI
} else {
  // Show legacy login
}
```

### Route Protection

```typescript
// Protect entire route with feature flag
if (url.pathname.startsWith('/api/auth/')) {
  const authEnabled = await flags.isEnabled('authentication')
  if (!authEnabled) {
    return new Response('Feature disabled', { status: 503 })
  }
  return handleAuthRoutes(request, env, ctx)
}
```

### Gradual Rollout

```typescript
// Roll out to 25% of users
const newDashboard = await flags.isEnabled('new_dashboard', userId)
if (newDashboard) {
  return serveNewDashboard()
} else {
  return serveLegacyDashboard()
}
```

### A/B Testing with Variants

```typescript
const variant = await flags.getVariant('checkout_flow', userId)
switch (variant) {
  case 'control':
    return renderOriginalCheckout()
  case 'treatment_a':
    return renderSimplifiedCheckout()
  case 'treatment_b':
    return renderOneClickCheckout()
  default:
    return renderOriginalCheckout()
}
```

## Flag Configuration

### Basic Flag Structure

```typescript
interface FeatureFlag {
  enabled: boolean                    // Global on/off switch
  rolloutPercentage?: number         // 0-100, percentage of users to include
  userWhitelist?: string[]           // Always enabled for these users
  userBlacklist?: string[]           // Always disabled for these users
  environments?: string[]            // Only enabled in these environments
  variant?: string                   // Default variant name
  variants?: Record<string, number>  // A/B test variants with percentages
}
```

### Example Configurations

#### Simple Toggle
```json
{
  "enabled": true
}
```

#### Gradual Rollout
```json
{
  "enabled": true,
  "rolloutPercentage": 25
}
```

#### Environment-Specific
```json
{
  "enabled": true,
  "environments": ["dev", "staging"]
}
```

#### A/B Test
```json
{
  "enabled": true,
  "rolloutPercentage": 50,
  "variants": {
    "control": 50,
    "treatment": 50
  }
}
```

#### Complex Targeting
```json
{
  "enabled": true,
  "rolloutPercentage": 75,
  "userWhitelist": ["admin@company.com", "beta_user_123"],
  "userBlacklist": ["problematic_user"],
  "environments": ["staging", "prod"],
  "variants": {
    "control": 40,
    "treatment_a": 30,
    "treatment_b": 30
  }
}
```

## Management

### CLI Tool

The project includes a CLI tool for managing feature flags:

```bash
# List all flags
npm run flags list [env]

# Enable a flag
npm run flags enable authentication dev 50

# Disable a flag
npm run flags disable new_feature prod

# Set complex configuration
npm run flags set my_flag '{"enabled":true,"rolloutPercentage":25}' staging

# Set user override
npm run flags user authentication user123 true dev

# Get help
npm run flags help
```

### Direct Wrangler Commands

```bash
# List flags for environment
wrangler kv:key list --binding=FEATURE_FLAGS --prefix="feature:prod:"

# Set a flag
wrangler kv:key put "feature:prod:authentication" '{"enabled":true,"rolloutPercentage":50}' --binding=FEATURE_FLAGS

# Get flag value
wrangler kv:key get "feature:prod:authentication" --binding=FEATURE_FLAGS

# Delete a flag
wrangler kv:key delete "feature:prod:authentication" --binding=FEATURE_FLAGS
```

### API Endpoints

Feature flags can also be managed via API (requires authentication):

```bash
# List all flags
curl -H "Authorization: Bearer $TOKEN" https://your-worker.dev/api/flags

# Get specific flag evaluation
curl -H "Authorization: Bearer $TOKEN" https://your-worker.dev/api/flags/authentication?userId=user123

# Enable a flag
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"enabled":true,"rolloutPercentage":50}' \
  https://your-worker.dev/api/flags/authentication

# Set user override
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"enabled":true}' \
  https://your-worker.dev/api/flags/authentication/users/user123
```

## Environments

The system supports multiple environments with isolated flag configurations:

- **Development** (`dev`) - All flags default to enabled for testing
- **Staging** (`staging`) - Production-like flag evaluation
- **Production** (`prod`) - Conservative flag evaluation

Environment is controlled by the `ENVIRONMENT` variable in `wrangler.toml`.

## KV Key Structure

```
feature:{env}:{flagName}                    # Flag configuration
feature:{env}:{flagName}:users:{userId}     # User-specific overrides
feature:{env}:global:rollout_salt           # Consistent hashing salt
```

Examples:
```
feature:prod:authentication                 # Auth flag in production
feature:dev:new_dashboard:users:user123     # User override in development
feature:staging:global:rollout_salt         # Rollout salt for staging
```

## Best Practices

### Flag Naming
- Use descriptive names: `new_checkout_flow` not `flag1`
- Use snake_case: `user_dashboard` not `userDashboard`
- Include context: `mobile_app_redesign` not `redesign`

### Rollout Strategy
1. **Start small**: Begin with 1-5% rollout
2. **Monitor metrics**: Watch for errors, performance impact
3. **Gradual increase**: 5% → 25% → 50% → 100%
4. **Quick rollback**: Disable flag if issues arise

### Environment Progression
1. **Development**: Test flag functionality
2. **Staging**: Validate with production-like data
3. **Production**: Gradual rollout to real users

### Flag Lifecycle
1. **Create**: Add flag with `enabled: false`
2. **Test**: Enable in development environment
3. **Stage**: Enable in staging for validation
4. **Rollout**: Gradual percentage increase in production
5. **Cleanup**: Remove flag code and configuration after 100% rollout

### Code Organization
```typescript
// ✅ Good: Feature-specific flag checks
const newCheckoutEnabled = await flags.isEnabled('new_checkout_flow', userId)
if (newCheckoutEnabled) {
  return renderNewCheckout()
}
return renderLegacyCheckout()

// ❌ Bad: Multiple unrelated flags
const flags = await Promise.all([
  flags.isEnabled('feature1'),
  flags.isEnabled('feature2'),
  flags.isEnabled('feature3')
])
```

## Monitoring

### Metrics to Track
- Flag evaluation latency
- Flag evaluation frequency
- User distribution across variants
- Error rates by flag status

### Logging
```typescript
// Log flag evaluations in development
if (env.ENVIRONMENT === 'dev') {
  console.log(`Flag ${flagName} evaluated to ${result.enabled} for user ${userId} (${result.reason})`)
}
```

### Alerts
- Flag evaluation failures
- Unexpected rollout distributions
- High latency in flag evaluation

## Troubleshooting

### Common Issues

#### Flag not taking effect
1. Check KV propagation (takes ~60 seconds globally)
2. Verify environment configuration
3. Check user targeting rules

#### Inconsistent behavior
1. Verify user ID is consistent
2. Check for user overrides
3. Validate rollout salt generation

#### Performance issues
1. Monitor KV operation latency
2. Check flag evaluation frequency
3. Consider caching strategies

### Debug Commands

```bash
# Check flag configuration
wrangler kv:key get "feature:prod:my_flag" --binding=FEATURE_FLAGS

# List all keys for debugging
wrangler kv:key list --binding=FEATURE_FLAGS --prefix="feature:prod:"

# Check user override
wrangler kv:key get "feature:prod:my_flag:users:user123" --binding=FEATURE_FLAGS
```

## Migration and Cleanup

### Removing Flags
1. Set flag to 100% enabled in production
2. Remove flag checks from code
3. Deploy code changes
4. Delete flag from KV storage
5. Remove flag from tests and documentation

### Flag Debt Management
- Regular audits of active flags
- Automated alerts for old flags
- Documentation of flag purpose and timeline
- Code review requirements for new flags

## Security Considerations

- Flag configurations don't contain sensitive data
- User IDs are hashed for rollout calculations
- Admin API requires authentication
- Environment isolation prevents cross-contamination
- No PII stored in flag configurations
