#!/bin/bash

# QAZNEDR.KZ Deployment Preparation Script
# This script prepares the project for deployment to Vercel

echo "🚀 Preparing QAZNEDR.KZ for deployment..."

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in the project root directory"
    exit 1
fi

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install

# Step 2: Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Step 3: Run TypeScript check
echo "✅ Running TypeScript check..."
npm run type-check

# Step 4: Run linting
echo "🔍 Running linter..."
npm run lint

# Step 5: Build the project
echo "🏗️ Building project..."
npm run build

# Step 6: Create production schema if needed
if [ ! -f "prisma/schema.production.prisma" ]; then
    echo "📝 Creating production schema..."
    cp prisma/schema.prisma prisma/schema.production.prisma
    # Update SQLite to PostgreSQL in production schema
    sed -i 's/provider = "sqlite"/provider = "postgresql"/g' prisma/schema.production.prisma
fi

echo "✅ Deployment preparation complete!"
echo ""
echo "📝 Next steps:"
echo "1. Create a GitHub repository and push your code"
echo "2. Connect to Vercel and import your repository"
echo "3. Configure environment variables in Vercel dashboard"
echo "4. Deploy!"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"