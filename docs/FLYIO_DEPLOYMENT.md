# Fly.io Deployment Guide for Game Overview Backend

## Prerequisites

1. Install the Fly CLI:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. Sign up and login to Fly.io:
   ```bash
   flyctl auth signup  # or flyctl auth login
   ```

## Initial Deployment

1. Navigate to the backend directory:
   ```bash
   cd backend/
   ```

2. Launch the app (this will create the app and deploy it):
   ```bash
   flyctl launch
   ```
   - When prompted, use the existing `fly.toml` configuration
   - Choose whether to deploy immediately (recommended: yes)

## Environment Variables

If your application requires environment variables, set them using:

```bash
flyctl secrets set SECRET_NAME=secret_value
```

For example, if you have API keys or database URLs:
```bash
flyctl secrets set DATABASE_URL=your_database_url
flyctl secrets set API_KEY=your_api_key
```

## Deployment Commands

### Deploy changes:
```bash
flyctl deploy
```

### Check deployment status:
```bash
flyctl status
```

### View logs:
```bash
flyctl logs
```

### Scale the application:
```bash
flyctl scale count 2  # Scale to 2 instances
flyctl scale memory 1024  # Scale to 1GB RAM
```

## Configuration Details

The `fly.toml` configuration includes:

- **App Name**: `game-overview-backend` (you may need to change this if the name is taken)
- **Region**: `sjc` (San Jose, CA) - change to your preferred region
- **Port**: 8001 (matches your FastAPI app)
- **Memory**: 512MB (can be scaled up if needed)
- **Health Check**: Uses `/api/games/catalog` endpoint
- **Auto-scaling**: Suspends machines when idle, auto-starts on requests

## Monitoring and Debugging

### Check app health:
```bash
flyctl status
```

### Open app in browser:
```bash
flyctl open
```

### SSH into the running machine:
```bash
flyctl ssh console
```

### View machine metrics:
```bash
flyctl metrics
```

## Custom Domains

To add a custom domain:

1. Add the domain:
   ```bash
   flyctl domains add yourdomain.com
   ```

2. Configure DNS according to Fly.io's instructions

## Database Integration

If you need a database, Fly.io offers:

- **Fly Postgres**: `flyctl postgres create`
- **Fly Redis**: `flyctl redis create`

## Production Considerations

1. **Environment**: The Dockerfile is optimized for production
2. **Security**: Uses non-root user and security headers
3. **Health Checks**: Configured to monitor `/api/games/catalog`
4. **Scaling**: Auto-suspend and auto-start configured
5. **CORS**: Currently allows all origins - consider restricting in production

## Troubleshooting

### Common Issues:

1. **App name taken**: Change the `app` name in `fly.toml`
2. **Port issues**: Ensure the PORT environment variable matches internal_port
3. **Health check failures**: Verify the `/api/games/catalog` endpoint works locally
4. **Build failures**: Check that all dependencies are in `pyproject.toml`

### Debug commands:
```bash
flyctl logs --app game-overview-backend
flyctl ssh console --app game-overview-backend
flyctl doctor  # Check Fly CLI setup
```

## Cost Optimization

- The current configuration uses minimal resources (512MB RAM, 1 CPU)
- Auto-suspend feature reduces costs when the app is idle
- Consider using `flyctl scale count 0` to completely stop the app when not needed

## CI/CD with GitHub Actions

A GitHub Actions workflow has been created at `.github/workflows/backend-ci.yml` that:

1. **Tests**: Runs pytest with coverage on backend code
2. **Builds**: Creates Docker image and pushes to GitHub Container Registry
3. **Deploys**: Automatically deploys to Fly.io on main branch pushes
4. **Security**: Scans Docker images for vulnerabilities with Trivy

### Required Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

```bash
FLY_API_TOKEN=your_fly_api_token
```

To get your Fly.io API token:
```bash
flyctl auth token
```

### Manual Deployment via GitHub Actions

You can trigger manual deployments using:
- Go to Actions tab → Backend CI/CD → Run workflow
- Check "Deploy to Fly.io after build" option

### Docker Images

Built images are available at:
```
ghcr.io/your-username/gameoverview/backend:latest
ghcr.io/your-username/gameoverview/backend:main-sha
```

## Next Steps

After successful deployment:

1. Test all API endpoints
2. Configure any required environment variables
3. Set up monitoring and alerts
5. Update CORS settings for production use
