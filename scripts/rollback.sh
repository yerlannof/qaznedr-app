#!/bin/bash
# Emergency rollback script for QAZNEDR.KZ
# Quickly reverts to the last known good deployment

set -e

echo "🚨 Initiating emergency rollback..."

# 1. Revert to previous Git commit (if needed)
echo "📋 Reverting code changes..."
git log --oneline -5
read -p "Enter commit hash to rollback to: " COMMIT_HASH
git reset --hard $COMMIT_HASH

# 2. Rebuild application
echo "📦 Rebuilding application..."
npm ci
npm run build

# 3. Redeploy to Cloudflare
echo "☁️ Redeploying to Cloudflare..."
./deploy.sh

# 4. Validate rollback
echo "✅ Running post-rollback validation..."
./scripts/validate-deployment.sh

echo "🎯 Rollback completed successfully!"
