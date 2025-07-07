# Testing Guide for GameOverview

## Overview

The GameOverview project uses a comprehensive testing strategy to ensure reliability and maintainability of the authentication system and overall application.

## Testing Stack

### Backend (Cloudflare Worker)
- **Framework**: Vitest with Miniflare
- **Environment**: Simulated Cloudflare Workers runtime
- **Coverage**: Unit tests for utilities, integration tests for API endpoints

### Frontend (React)
- **Framework**: React Testing Library + Jest (via Create React App)
- **Environment**: jsdom
- **Coverage**: Component tests, service tests, context tests

## Test Structure

### Backend Tests (`worker/src/`)
```
src/
├── utils/
│   └── auth.test.ts          # AuthUtils and UserService unit tests
├── routes/
│   └── auth.test.ts          # Authentication endpoint integration tests
└── vitest.config.ts          # Vitest configuration
```

### Frontend Tests (`frontend/src/`)
```
src/
├── services/
│   └── authService.test.ts   # API client tests
├── context/
│   └── AuthContext.test.tsx  # Authentication context tests
└── components/auth/
    └── LoginForm.test.tsx    # Component tests
```

## Running Tests

### Backend Tests
```bash
# Run all worker tests
cd worker && npm test

# Run tests with coverage
cd worker && npm run test:coverage

# Run tests in watch mode
cd worker && npm test -- --watch

# Type checking
cd worker && npm run type-check
```

### Frontend Tests
```bash
# Run all frontend tests
cd frontend && npm test

# Run tests once (CI mode)
cd frontend && npm test -- --run

# Run tests with coverage
cd frontend && npm test -- --coverage --run
```

### All Tests
```bash
# From project root
make test  # If Makefile exists, or run both commands above
```

## Test Categories

### 1. Unit Tests

#### AuthUtils Tests (`worker/src/utils/auth.test.ts`)
- **Password Hashing**: SHA-256 consistency and security
- **JWT Management**: Token creation, verification, expiration
- **Token Extraction**: Header and cookie parsing
- **Input Validation**: Edge cases and error handling

#### UserService Tests (`worker/src/utils/auth.test.ts`)
- **User Creation**: Database operations and validation
- **User Lookup**: Email, username, and ID queries
- **Authentication**: Password verification and user validation
- **Error Handling**: Database constraints and failures

### 2. Integration Tests

#### Authentication Endpoints (`worker/src/routes/auth.test.ts`)
- **Registration Flow**: Complete user registration process
- **Login Flow**: Authentication with email/username
- **Logout Flow**: Session termination
- **User Info**: Protected route access
- **Error Scenarios**: Invalid inputs, database errors
- **CORS Headers**: Cross-origin request handling

### 3. Frontend Tests

#### AuthService Tests (`frontend/src/services/authService.test.ts`)
- **API Calls**: Registration, login, logout, user info
- **Token Management**: localStorage operations
- **Error Handling**: Network errors, API errors
- **Axios Integration**: Request/response interceptors

#### AuthContext Tests (`frontend/src/context/AuthContext.test.tsx`)
- **State Management**: Authentication state transitions
- **Context Provider**: Proper context value provision
- **Auth Check**: Automatic authentication verification
- **Error Handling**: Failed authentication scenarios

#### Component Tests (`frontend/src/components/auth/LoginForm.test.tsx`)
- **Form Rendering**: UI elements and accessibility
- **User Interactions**: Form submission, validation
- **Error Display**: Error message handling
- **Loading States**: UI feedback during operations
- **Keyboard Navigation**: Accessibility compliance

## Test Configuration

### Vitest Configuration (`worker/vitest.config.ts`)
```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'miniflare',
    environmentOptions: {
      modules: true,
      scriptPath: './src/index.ts',
      bindings: {
        JWT_SECRET: 'test-secret-key-for-testing-only',
      },
      d1Databases: ['DB'],
    },
    include: ['src/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/**/*.test.ts', 'static/'],
    },
  },
})
```

### Jest Configuration (Frontend)
Uses Create React App's built-in Jest configuration with:
- React Testing Library setup
- jsdom environment
- Module mocking capabilities
- Coverage reporting

## Mocking Strategy

### Backend Mocks
- **D1 Database**: Mocked with Vitest functions
- **Environment Variables**: Test-specific values
- **Web Crypto API**: Uses real implementation in Miniflare

### Frontend Mocks
- **AuthService**: Mocked for context and component tests
- **localStorage**: Custom mock implementation
- **axios**: Mocked HTTP requests and responses
- **Material-UI**: Theme provider for component tests

## Coverage Goals

### Current Coverage Targets
- **Backend**: 90%+ line coverage for authentication utilities
- **Frontend**: 80%+ line coverage for authentication components
- **Integration**: All authentication endpoints tested

### Coverage Reports
- **Backend**: HTML reports in `worker/coverage/`
- **Frontend**: Console output and HTML reports
- **CI/CD**: Coverage data collected in GitHub Actions

## CI/CD Integration

### GitHub Actions Workflow
1. **Test Job**: Runs before deployment
   - TypeScript type checking
   - Backend unit and integration tests
   - Frontend component and service tests
   - Build verification

2. **Deploy Job**: Runs only if tests pass
   - Builds and deploys to Cloudflare Workers

### Test Commands in CI
```yaml
- name: Run Worker TypeScript type check
  run: npm run type-check
  working-directory: worker

- name: Run Worker tests
  run: npm test
  working-directory: worker

- name: Run Frontend tests
  run: npm test -- --run --reporter=verbose
  working-directory: frontend
```

## Best Practices

### Writing Tests
1. **Descriptive Names**: Clear test descriptions
2. **Arrange-Act-Assert**: Structured test organization
3. **Mock Isolation**: Independent test execution
4. **Edge Cases**: Test error conditions and boundaries
5. **Accessibility**: Include a11y testing for components

### Test Maintenance
1. **Regular Updates**: Keep tests current with code changes
2. **Refactoring**: Improve test quality and readability
3. **Performance**: Optimize slow tests
4. **Documentation**: Update test documentation

### Debugging Tests
1. **Verbose Output**: Use detailed test reporters
2. **Isolation**: Run individual test files
3. **Debug Mode**: Use debugger in test environment
4. **Logging**: Add console output for complex scenarios

## Common Issues and Solutions

### Backend Testing
- **Miniflare Setup**: Ensure proper environment configuration
- **Async Operations**: Use proper async/await patterns
- **Mock Database**: Verify mock function calls and responses

### Frontend Testing
- **Component Rendering**: Wrap with necessary providers
- **Async State**: Use waitFor for state updates
- **Event Simulation**: Use userEvent for realistic interactions
- **Mock Cleanup**: Clear mocks between tests

## Future Enhancements

### Planned Improvements
1. **E2E Tests**: Playwright or Cypress integration
2. **Visual Testing**: Screenshot comparison tests
3. **Performance Tests**: Load testing for API endpoints
4. **Security Tests**: Penetration testing automation
5. **Mutation Testing**: Code quality verification

### Monitoring
1. **Test Metrics**: Track test execution time and reliability
2. **Coverage Trends**: Monitor coverage changes over time
3. **Flaky Tests**: Identify and fix unreliable tests
4. **Test Debt**: Regular test code quality reviews
