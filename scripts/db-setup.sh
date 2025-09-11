#!/bin/bash

# Database Setup Script for QAZNEDR.KZ
# Handles both development (SQLite) and production (PostgreSQL) setups

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🗄️  QAZNEDR.KZ Database Setup${NC}"
echo "=================================="

# Check environment
ENV=${NODE_ENV:-development}
echo -e "Environment: ${YELLOW}$ENV${NC}"

# Function to setup development database (SQLite)
setup_development() {
    echo -e "\n${BLUE}Setting up development database (SQLite)...${NC}"
    
    # Generate Prisma client
    echo "📦 Generating Prisma client..."
    npx prisma generate
    
    # Push schema to database
    echo "🔄 Pushing schema to database..."
    npx prisma db push --force-reset
    
    # Seed database
    echo "🌱 Seeding database with Kazakhstan deposits..."
    npm run db:seed
    
    echo -e "${GREEN}✅ Development database setup complete!${NC}"
}

# Function to setup production database (PostgreSQL)
setup_production() {
    echo -e "\n${BLUE}Setting up production database (PostgreSQL)...${NC}"
    
    # Check if DATABASE_URL is set
    if [ -z "$DATABASE_URL" ]; then
        echo -e "${RED}❌ DATABASE_URL environment variable is not set${NC}"
        echo "Please set your PostgreSQL connection string in DATABASE_URL"
        exit 1
    fi
    
    # Use production schema
    cp prisma/schema.production.prisma prisma/schema.prisma
    
    # Generate Prisma client
    echo "📦 Generating Prisma client..."
    npx prisma generate
    
    # Deploy migrations
    echo "🚀 Deploying migrations..."
    npx prisma migrate deploy
    
    # Seed database (production data)
    echo "🌱 Seeding production database..."
    NODE_ENV=production npm run db:seed
    
    echo -e "${GREEN}✅ Production database setup complete!${NC}"
}

# Function to create backup
create_backup() {
    echo -e "\n${BLUE}Creating database backup...${NC}"
    
    if [ "$ENV" = "production" ]; then
        # PostgreSQL backup
        BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
        pg_dump $DATABASE_URL > "backups/$BACKUP_FILE"
        echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
    else
        # SQLite backup
        cp prisma/dev.db "backups/dev-backup-$(date +%Y%m%d-%H%M%S).db"
        echo -e "${GREEN}✅ SQLite backup created${NC}"
    fi
}

# Function to reset database
reset_database() {
    echo -e "\n${YELLOW}⚠️  This will delete all data! Are you sure? (y/N)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        if [ "$ENV" = "production" ]; then
            npx prisma migrate reset --force
        else
            npx prisma db push --force-reset
            npm run db:seed
        fi
        echo -e "${GREEN}✅ Database reset complete${NC}"
    else
        echo "Operation cancelled"
    fi
}

# Main execution
case "${1:-setup}" in
    "setup")
        if [ "$ENV" = "production" ]; then
            setup_production
        else
            setup_development
        fi
        ;;
    "backup")
        create_backup
        ;;
    "reset")
        reset_database
        ;;
    "migrate")
        echo "🔄 Running migrations..."
        npx prisma migrate dev --name "$(date +%Y%m%d_%H%M%S)"
        ;;
    *)
        echo "Usage: $0 {setup|backup|reset|migrate}"
        echo "  setup   - Setup database for current environment"
        echo "  backup  - Create database backup"
        echo "  reset   - Reset database (DANGER!)"
        echo "  migrate - Create and run new migration"
        exit 1
        ;;
esac

echo -e "\n${GREEN}🎉 Database operation completed successfully!${NC}"