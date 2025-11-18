#!/bin/bash

# Integration Test Runner
# This script sets up and runs integration tests for the feature flagging system

set -e

echo "🧪 Feature Flag Integration Test Runner"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required tools are available
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is required but not installed${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is required but not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Install dependencies if needed
echo -e "${BLUE}Installing dependencies...${NC}"
npm install --silent
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Run type checking first
echo -e "${BLUE}Running TypeScript type check...${NC}"
if npm run type-check; then
    echo -e "${GREEN}✅ Type check passed${NC}"
else
    echo -e "${RED}❌ Type check failed${NC}"
    exit 1
fi
echo ""

# Run unit tests first to ensure basic functionality
echo -e "${BLUE}Running unit tests...${NC}"
if npm test -- --run --reporter=basic; then
    echo -e "${GREEN}✅ Unit tests passed${NC}"
else
    echo -e "${RED}❌ Unit tests failed${NC}"
    exit 1
fi
echo ""

# Set environment variable for integration tests
export RUN_INTEGRATION_TESTS=true

# Run integration tests
echo -e "${BLUE}Running integration tests...${NC}"
echo -e "${YELLOW}This may take a few minutes as we set up the test environment...${NC}"

if npm run test:integration:direct -- --reporter=verbose; then
    echo -e "${GREEN}✅ Integration tests passed${NC}"
else
    echo -e "${RED}❌ Integration tests failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 All integration tests completed successfully!${NC}"
echo ""

# Provide next steps
echo -e "${BLUE}Next steps:${NC}"
echo "1. Run manual tests: npm run test:flags dev"
echo "2. Run load tests: npm run test:load"
echo "3. Run E2E tests: npm run test:e2e"
echo "4. Deploy to staging: npm run deploy"
echo ""

echo -e "${YELLOW}Integration test summary:${NC}"
echo "- ✅ KV operations with real namespace"
echo "- ✅ Authentication token generation and validation"
echo "- ✅ API endpoint testing with real HTTP requests"
echo "- ✅ User targeting and rollout percentage testing"
echo "- ✅ Route protection with feature flags"
echo "- ✅ Environment isolation testing"
echo "- ✅ Error handling and edge cases"
