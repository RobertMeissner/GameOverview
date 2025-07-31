#!/bin/bash

# BacklogBlitz Landing Page Deployment Script

echo "🚀 Starting BacklogBlitz Landing Page Deployment"

# Update Wrangler to latest version
echo "📦 Updating Wrangler..."
npm install --save-dev wrangler@latest

# Check if we need to create KV namespaces
echo "🗄️ Setting up KV storage for analytics..."
echo "Creating production KV namespace..."
npx wrangler kv namespace create "backlog_blitz_KV"

echo "Creating preview KV namespace..."
npx wrangler kv namespace create "backlog_blitz_KV" --preview

echo ""
echo "⚠️  IMPORTANT: Update wrangler.toml with the KV namespace IDs shown above!"
echo ""
echo "Replace:"
echo "  id = \"your-kv-namespace-id\" with the production ID"
echo "  preview_id = \"your-preview-kv-namespace-id\" with the preview ID"
echo ""

read -p "Have you updated wrangler.toml with the KV namespace IDs? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🎯 Deploying to staging first..."
    npx wrangler deploy --env staging

    echo ""
    echo "✅ Staging deployment complete!"
    echo "🔗 Test your staging site at: https://backlogblitz-landing-staging.robertforpresent..workers.dev"
    echo ""

    read -p "Deploy to production? (y/n): " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 Deploying to production..."
        npx wrangler deploy

        echo ""
        echo "🎉 Production deployment complete!"
        echo "🔗 Your live site: https://backlogblitz-landing.robertforpresent..workers.dev"
        echo ""
        echo "📊 Analytics will be stored in KV storage"
        echo "📈 View analytics with: npm run analytics:view"
        echo ""
        echo "🔧 Next steps:"
        echo "  1. Set up custom domain in Cloudflare dashboard"
        echo "  2. Update Google Analytics tracking ID (G-XXXXXXXXXX)"
        echo "  3. Test all functionality"
        echo "  4. Share your landing page!"
    else
        echo "⏸️  Production deployment skipped"
    fi
else
    echo "❌ Please update wrangler.toml first, then run this script again"
    exit 1
fi
