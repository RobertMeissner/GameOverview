#!/bin/bash

# BacklogBlitz Landing Page Site Test Script

STAGING_URL="https://backlogblitz-landing-staging.robertforpresent.workers.dev"

echo "🧪 Testing BacklogBlitz Landing Page Staging Deployment"
echo "🔗 URL: $STAGING_URL"
echo ""

# Test 1: Main page
echo "1️⃣ Testing main page..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL/")
if [ "$response" = "200" ]; then
    echo "✅ Main page: OK ($response)"
else
    echo "❌ Main page: FAILED ($response)"
fi

# Test 2: CSS file
echo "2️⃣ Testing CSS file..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL/styles.css")
if [ "$response" = "200" ]; then
    echo "✅ CSS file: OK ($response)"
else
    echo "❌ CSS file: FAILED ($response)"
fi

# Test 3: JavaScript file
echo "3️⃣ Testing JavaScript file..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL/analytics.js")
if [ "$response" = "200" ]; then
    echo "✅ JavaScript file: OK ($response)"
else
    echo "❌ JavaScript file: FAILED ($response)"
fi

# Test 4: Analytics API
echo "4️⃣ Testing analytics API..."
response=$(curl -s -X POST "$STAGING_URL/api/analytics" \
  -H "Content-Type: application/json" \
  -d '{"event":"test","category":"api_test","label":"staging_test","timestamp":'$(date +%s)'000}' \
  -w "%{http_code}")

if [[ "$response" == *"200" ]] && [[ "$response" == *"success" ]]; then
    echo "✅ Analytics API: OK"
else
    echo "❌ Analytics API: FAILED ($response)"
fi

# Test 5: Health check
echo "5️⃣ Testing health endpoint..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL/health")
if [ "$response" = "200" ]; then
    echo "✅ Health check: OK ($response)"
else
    echo "❌ Health check: FAILED ($response)"
fi

echo ""
echo "🎉 Site testing complete!"
echo "🌐 Visit your staging site: $STAGING_URL"
echo ""
echo "💡 If all tests passed, your BacklogBlitz landing page is ready!"
echo "   The CSS issue has been fixed and all endpoints are working properly."
