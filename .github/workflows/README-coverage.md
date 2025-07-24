# Coverage Integration with Qlty

This project automatically uploads test coverage from all components to Qlty for comprehensive code quality analysis.

## Coverage Sources

### 🐍 Backend (Python)
- **Location**: `backend/src/`
- **Test Framework**: pytest with pytest-cov
- **Coverage Files**:
  - XML: `backend/coverage-backend.xml`
  - LCOV: `backend/coverage-backend.lcov`
- **Local Command**: `make test-coverage-qlty`

### ⚛️ Frontend (React)
- **Location**: `frontend/src/`
- **Test Framework**: Jest with React Testing Library
- **Coverage Files**:
  - LCOV: `frontend/coverage/lcov.info`
  - XML: `frontend/coverage/cobertura-coverage.xml`
- **Local Command**: `cd frontend && npm test -- --coverage`

### ⚡ Worker (Cloudflare Workers)
- **Location**: `worker/src/`
- **Test Framework**: Vitest
- **Coverage Files**:
  - LCOV: `worker/coverage/lcov.info`
  - XML: `worker/coverage/cobertura-coverage.xml`
- **Local Command**: `cd worker && npm run test:coverage`

## GitHub Actions Integration

The [`qlty.yml`](.github/workflows/qlty.yml) workflow automatically:

1. **Runs Tests**: Executes all test suites with coverage
2. **Collects Coverage**: Gathers coverage files from all components
3. **Uploads to Qlty**: Sends coverage data to Qlty dashboard
4. **Generates Summary**: Creates GitHub step summary with results

### Trigger Events
- Push to `main`, `dev`, or `develop` branches
- Pull requests to these branches

## Local Testing

### Generate Coverage Locally
```bash
# Backend coverage
make test-coverage-qlty

# Frontend coverage
cd frontend && npm test -- --coverage --watchAll=false

# Worker coverage
cd worker && npm run test:coverage
```

### Test Qlty Upload
```bash
# Set your token (get from qlty.sh dashboard)
export QLTY_COVERAGE_TOKEN="your-token-here"

# Test backend upload
make test-qlty-upload
```

## Coverage Formats

Qlty accepts multiple coverage formats:
- **XML**: Cobertura, JaCoCo formats
- **LCOV**: Standard LCOV info files
- **JSON**: Coverage.py JSON format

Our setup generates both XML and LCOV for maximum compatibility.

## Configuration

### Required Secrets
- `QLTY_COVERAGE_TOKEN`: Available in your Qlty dashboard

### File Locations
Coverage files are organized in the `coverage-reports/` directory:
```
coverage-reports/
├── backend-coverage.xml
├── backend-coverage.lcov
├── frontend-coverage.xml
├── frontend-coverage.lcov
├── worker-coverage.xml
└── worker-coverage.lcov
```

## Viewing Results

1. **Qlty Dashboard**: Visit [qlty.sh](https://qlty.sh) to view detailed coverage reports
2. **GitHub Summary**: Check the workflow summary for quick overview
3. **Artifacts**: Download coverage reports from GitHub Actions artifacts

## Troubleshooting

### No Coverage Data
- Ensure tests are actually running
- Check that coverage reporting is enabled in test commands
- Verify file paths in the workflow

### Upload Failures
- Check `QLTY_COVERAGE_TOKEN` is set correctly
- Verify coverage files are in expected formats
- Look for rate limiting or API errors in logs

### Framework Detection
The workflow specifies frameworks explicitly:
- `--framework python` for backend
- `--framework javascript` for frontend/worker

This helps Qlty properly parse and display coverage data.
