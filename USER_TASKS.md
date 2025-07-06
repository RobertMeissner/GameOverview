# User Tasks - Test Failures to Fix

## Summary
Test results show multiple failures in the frontend tests, while worker tests are passing. Here are the issues that need to be addressed:

## Frontend Test Failures (4 failed test suites, 10 failed tests)

### 1. AuthService Tests (`src/services/authService.test.ts`)
**Status**: 5 tests failing
**Issues**:
- Mock axios responses not properly configured for error handling
- Tests expect specific error messages but service throws generic messages
- Logout test expects POST call but none is made

**Specific Fixes Needed**:
- Fix register test: Mock axios to return proper success response
- Fix register error test: Ensure error.response.data.error contains "Email already exists"
- Fix login test: Mock axios to return proper success response  
- Fix login error test: Ensure error.response.data.error contains "Invalid credentials"
- Fix logout test: Ensure axios.post is called with '/auth/logout'
- Fix getCurrentUser test: Mock axios to return proper user data
- Fix getCurrentUser error test: Ensure error.response.data.error contains "Invalid token"

### 2. AuthContext Tests (`src/context/AuthContext.test.tsx`)
**Status**: 2 tests failing
**Issues**:
- Using deprecated ReactDOMTestUtils.act instead of React.act
- Using undefined `vi` instead of `jest` for mocking
- Mock setup issues causing authentication failures

**Specific Fixes Needed**:
- Replace `vi.spyOn` with `jest.spyOn` in line 258
- Fix mock setup for login failure test
- Address React.act deprecation warnings

### 3. LoginForm Tests (`src/components/auth/LoginForm.test.tsx`)
**Status**: Test suite failed to run
**Issues**:
- `userEvent.setup()` is not a function - version compatibility issue

**Specific Fixes Needed**:
- Update userEvent usage to compatible version or use different testing approach
- Check @testing-library/user-event version compatibility

### 4. App Tests (`src/App.test.js`)
**Status**: 1 test failing
**Issues**:
- Test expects "learn react" text but app shows login form
- React.act warnings for state updates
- Data loading errors due to undefined API responses

**Specific Fixes Needed**:
- Update test to match actual app content (login form instead of "learn react")
- Wrap state updates in act() calls
- Mock API responses properly for useData hook

## Worker Test Status
**Status**: ✅ All tests passing (52 passed, 30 skipped)
**Note**: Some expected error logging in feature flags tests (this is normal behavior)

## Test Coverage Issues

### Frontend Coverage (29.91% overall)
**Low coverage areas**:
- FilterContext.tsx: 0% coverage
- index.tsx: 0% coverage  
- reportWebVitals.js: 0% coverage
- Most components have very low coverage (0-25%)
- UserMenu.tsx: 0% coverage
- useThumbnails.ts: 0% coverage

## Priority Order for Fixes

### High Priority (Blocking)
1. **Fix AuthService test mocks** - Critical for authentication testing
2. **Fix userEvent compatibility** - Prevents LoginForm tests from running
3. **Update App.test.js** - Fix basic app rendering test

### Medium Priority  
4. **Fix AuthContext test issues** - Important for context testing
5. **Address React.act warnings** - Improve test reliability

### Low Priority (Coverage)
6. **Add tests for untested components** - Improve overall coverage
7. **Add tests for FilterContext** - Currently 0% coverage
8. **Add tests for UserMenu** - Currently 0% coverage

## Recommended Next Steps

1. Start with AuthService test fixes as they're fundamental to the app
2. Update testing library dependencies if needed for userEvent compatibility
3. Fix the basic App test to match current app structure
4. Gradually add tests for uncovered components
5. Consider adding integration tests for complete user flows

## Notes
- Worker tests are in good shape with comprehensive coverage
- Frontend needs significant test improvements
- Most failures are related to mocking and test setup rather than actual code issues
