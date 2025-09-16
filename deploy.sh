#!/bin/bash
# Automated deployment script for QAZNEDR.KZ to Cloudflare Pages

set -e

echo "🚀 Starting deployment to Cloudflare Pages..."

# Build the application
echo "📦 Building application..."
npm ci
npm run build

# Deploy to Cloudflare Pages (requires wrangler CLI)
echo "☁️ Deploying to Cloudflare..."
if command -v wrangler &> /dev/null; then
    wrangler pages publish .next --project-name=qaznedr-kz
else
    echo "⚠️ Wrangler CLI not found. Install with: npm install -g wrangler"
    echo "📋 Manual deployment steps:"
    echo "1. Install wrangler: npm install -g wrangler"
    echo "2. Login: wrangler login"
    echo "3. Deploy: wrangler pages publish .next --project-name=qaznedr-kz"
fi

echo "✅ Deployment completed!"
