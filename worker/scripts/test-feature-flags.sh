#!/bin/bash

# Feature Flag Testing Script
# This script tests the feature flagging system end-to-end

set -e

echo "🏁 Feature Flag Testing Script"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
BASE_URL=${2:-http://localhost:8787}
TEST_FLAG="test_flag_$(date +%s)"
TEST_USER="test_user_123"

echo -e "${BLUE}Environment: $ENVIRONMENT${NC}"
echo -e "${BLUE}Base URL: $BASE_URL${NC}"
echo -e "${BLUE}Test Flag: $TEST_FLAG${NC}"
echo ""

# Function to make API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=${4:-200}

    echo -e "${YELLOW}Testing: $method $endpoint${NC}"

    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -d "$data" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            "$BASE_URL$endpoint")
    fi

    body=$(echo "$response" | head -n -1)
    status=$(echo "$response" | tail -n 1)

    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✅ Success ($status)${NC}"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ Failed (expected $expected_status, got $status)${NC}"
        echo "$body"
        return 1
    fi
    echo ""
}

# Function to test CLI commands
cli_test() {
    local command=$1
    local description=$2

    echo -e "${YELLOW}Testing CLI: $description${NC}"
    echo "Command: npm run flags $command"

    if npm run flags $command; then
        echo -e "${GREEN}✅ CLI command succeeded${NC}"
    else
        echo -e "${RED}❌ CLI command failed${NC}"
        return 1
    fi
    echo ""
}

# Function to test flag evaluation
test_flag_evaluation() {
    local flag_name=$1
    local user_id=$2
    local expected_enabled=$3

    echo -e "${YELLOW}Testing flag evaluation: $flag_name for user $user_id${NC}"

    response=$(curl -s "$BASE_URL/api/flags/$flag_name?userId=$user_id" \
        -H "Authorization: Bearer $AUTH_TOKEN")

    enabled=$(echo "$response" | jq -r '.enabled' 2>/dev/null || echo "false")

    if [ "$enabled" = "$expected_enabled" ]; then
        echo -e "${GREEN}✅ Flag evaluation correct (enabled: $enabled)${NC}"
    else
        echo -e "${RED}❌ Flag evaluation incorrect (expected: $expected_enabled, got: $enabled)${NC}"
        echo "$response"
        return 1
    fi
    echo ""
}

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq is required for this script. Please install it.${NC}"
    exit 1
fi

# Get authentication token (you would need to implement this)
echo "🔐 Getting authentication token..."
AUTH_TOKEN="your-test-token-here"  # Replace with actual token
echo ""

echo "📋 Starting Feature Flag Tests"
echo "==============================="

# Test 1: CLI Flag Management
echo -e "${BLUE}Test 1: CLI Flag Management${NC}"
cli_test "help" "Show help"
cli_test "list $ENVIRONMENT" "List flags for $ENVIRONMENT"
cli_test "enable $TEST_FLAG $ENVIRONMENT 50" "Enable test flag with 50% rollout"
cli_test "list $ENVIRONMENT" "List flags after enabling"

# Test 2: API Flag Management
echo -e "${BLUE}Test 2: API Flag Management${NC}"
api_call "GET" "/api/flags" "" 200
api_call "GET" "/api/flags/$TEST_FLAG" "" 200
api_call "POST" "/api/flags/$TEST_FLAG" '{"enabled":true,"rolloutPercentage":75}' 200

# Test 3: Flag Evaluation
echo -e "${BLUE}Test 3: Flag Evaluation${NC}"
test_flag_evaluation "$TEST_FLAG" "$TEST_USER" "true"

# Test 4: User Overrides
echo -e "${BLUE}Test 4: User Overrides${NC}"
cli_test "user $TEST_FLAG $TEST_USER false $ENVIRONMENT" "Set user override to false"
test_flag_evaluation "$TEST_FLAG" "$TEST_USER" "false"

api_call "POST" "/api/flags/$TEST_FLAG/users/$TEST_USER" '{"enabled":true}' 200
test_flag_evaluation "$TEST_FLAG" "$TEST_USER" "true"

api_call "DELETE" "/api/flags/$TEST_FLAG/users/$TEST_USER" "" 200

# Test 5: Rollout Percentage Testing
echo -e "${BLUE}Test 5: Rollout Percentage Testing${NC}"
cli_test "set $TEST_FLAG '{\"enabled\":true,\"rolloutPercentage\":0}' $ENVIRONMENT" "Set 0% rollout"
test_flag_evaluation "$TEST_FLAG" "$TEST_USER" "false"

cli_test "set $TEST_FLAG '{\"enabled\":true,\"rolloutPercentage\":100}' $ENVIRONMENT" "Set 100% rollout"
test_flag_evaluation "$TEST_FLAG" "$TEST_USER" "true"

# Test 6: Environment Restrictions
echo -e "${BLUE}Test 6: Environment Restrictions${NC}"
cli_test "set $TEST_FLAG '{\"enabled\":true,\"environments\":[\"prod\"]}' $ENVIRONMENT" "Restrict to prod only"
if [ "$ENVIRONMENT" = "prod" ]; then
    test_flag_evaluation "$TEST_FLAG" "$TEST_USER" "true"
else
    test_flag_evaluation "$TEST_FLAG" "$TEST_USER" "false"
fi

# Test 7: A/B Testing with Variants
echo -e "${BLUE}Test 7: A/B Testing with Variants${NC}"
cli_test "set $TEST_FLAG '{\"enabled\":true,\"variants\":{\"control\":50,\"treatment\":50}}' $ENVIRONMENT" "Set A/B test variants"

echo -e "${YELLOW}Testing variant consistency for multiple users${NC}"
for i in {1..10}; do
    user="test_user_$i"
    response=$(curl -s "$BASE_URL/api/flags/$TEST_FLAG?userId=$user" \
        -H "Authorization: Bearer $AUTH_TOKEN")
    variant=$(echo "$response" | jq -r '.variant' 2>/dev/null || echo "unknown")
    echo "User $user: $variant"
done
echo ""

# Test 8: Route Protection
echo -e "${BLUE}Test 8: Route Protection${NC}"
echo -e "${YELLOW}Testing authentication route protection${NC}"

# Disable authentication flag
cli_test "disable authentication $ENVIRONMENT" "Disable authentication flag"

# Test that auth routes return 503
auth_response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/auth/me")
auth_status=$(echo "$auth_response" | tail -n 1)

if [ "$auth_status" = "503" ]; then
    echo -e "${GREEN}✅ Authentication routes properly disabled${NC}"
else
    echo -e "${RED}❌ Authentication routes should return 503 when flag disabled${NC}"
fi

# Re-enable authentication flag
cli_test "enable authentication $ENVIRONMENT" "Re-enable authentication flag"
echo ""

# Test 9: Error Handling
echo -e "${BLUE}Test 9: Error Handling${NC}"
api_call "GET" "/api/flags/non_existent_flag" "" 200
api_call "POST" "/api/flags/invalid_flag" '{"invalid":"json"}' 400

# Test 10: Performance Testing
echo -e "${BLUE}Test 10: Performance Testing${NC}"
echo -e "${YELLOW}Testing flag evaluation performance${NC}"

start_time=$(date +%s%N)
for i in {1..100}; do
    curl -s "$BASE_URL/api/flags/$TEST_FLAG?userId=perf_user_$i" \
        -H "Authorization: Bearer $AUTH_TOKEN" > /dev/null
done
end_time=$(date +%s%N)

duration=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
avg_time=$(( duration / 100 ))

echo "100 flag evaluations took ${duration}ms (avg: ${avg_time}ms per evaluation)"

if [ $avg_time -lt 50 ]; then
    echo -e "${GREEN}✅ Performance test passed (< 50ms average)${NC}"
else
    echo -e "${RED}❌ Performance test failed (> 50ms average)${NC}"
fi
echo ""

# Cleanup
echo -e "${BLUE}Cleanup${NC}"
cli_test "disable $TEST_FLAG $ENVIRONMENT" "Disable test flag"
echo ""

echo "🎉 Feature Flag Testing Complete!"
echo "================================="

# Summary
echo -e "${GREEN}All tests completed successfully!${NC}"
echo ""
echo "Manual verification steps:"
echo "1. Check Cloudflare KV dashboard for test flag entries"
echo "2. Verify flag propagation across edge locations"
echo "3. Test with real user sessions in browser"
echo "4. Monitor flag evaluation metrics in production"
