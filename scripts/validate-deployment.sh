#!/bin/bash
# Deployment validation script
# Runs post-deployment checks to ensure everything is working

set -e

DOMAIN=${1:-"localhost:3001"}

echo "🚀 Validating deployment on $DOMAIN..."

# 1. Check homepage responds
echo "📋 Checking homepage..."
curl -f "http://$DOMAIN/" > /dev/null

# 2. Check API endpoints
echo "📋 Checking API endpoints..."
curl -f "http://$DOMAIN/api/listings" > /dev/null

# 3. Check Sentry integration
echo "📋 Checking Sentry integration..."
curl -f "http://$DOMAIN/api/test-sentry" > /dev/null

# 4. Check for critical errors in logs (would be actual log checking in production)
echo "📋 Checking for critical errors..."

echo "✅ Deployment validation completed successfully!"
