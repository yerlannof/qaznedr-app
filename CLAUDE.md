# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QAZNEDR.KZ is a Kazakhstan mining platform for buying and selling mineral deposits and licenses. The platform supports three types of listings:

1. **Mining Licenses** (`MINING_LICENSE`) - Active extraction rights
2. **Exploration Licenses** (`EXPLORATION_LICENSE`) - Geological exploration permits
3. **Mineral Occurrences** (`MINERAL_OCCURRENCE`) - Documented mineral findings

## Core Commands

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues automatically
npm run format       # Format code with Prettier
npm run format:check # Check code formatting

# Testing
npm run test         # Run Jest tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

## Architecture Overview

### Tech Stack

- **Framework**: Next.js 15.3.4 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Prisma with SQLite
- **Authentication**: NextAuth.js
- **Testing**: Jest with Testing Library
- **State Management**: React Context (Favorites, i18n, Theme)

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── listings/          # Mining listings pages
│   └── dashboard/         # Analytics dashboard
├── components/
│   ├── features/          # Business logic components
│   ├── layouts/           # Page layouts
│   └── ui/               # Reusable UI components (shadcn/ui style)
├── lib/
│   ├── data/             # Kazakhstan deposits data
│   ├── types/            # TypeScript type definitions
│   ├── services/         # Business services
│   └── utils/            # Utility functions
└── contexts/             # React Context providers
```

### Key Data Models

The platform centers around `KazakhstanDeposit` with specialized fields:

```typescript
// Core listing types
type ListingType =
  | 'MINING_LICENSE'
  | 'EXPLORATION_LICENSE'
  | 'MINERAL_OCCURRENCE';

// Mining licenses have: licenseSubtype, licenseNumber, licenseExpiry
// Exploration licenses have: explorationStage, explorationPeriod, explorationBudget
// Mineral occurrences have: discoveryDate, geologicalConfidence, estimatedReserves
```

### Design System Constraints

**CRITICAL**: This project has strict design requirements:

- **Colors**: Only gray + blue accent (`#0A84FF`). No gradients, no bright colors
- **Components**: Minimal, clean design with subtle shadows and hover effects
- **Animations**: Limited to `hover:shadow-md` and `transition-all`
- **Forbidden**: emerald, purple, orange colors; complex animations; gradients

### Kazakhstan-Specific Features

- **Regions**: 14 Kazakhstan regions (Мангистауская, Атырауская, etc.)
- **Minerals**: Oil, Gas, Gold, Copper, Coal, Uranium, Iron
- **Multilingual**: Supports Kazakh, Russian, English via i18next
- **Currency**: Prices in Tenge (₸)
- **Real Data**: Based on actual Kazakhstan mining sites (Kashagan, Tengiz, etc.)

## Development Workflows

### Adding New Listings

1. Update `src/lib/data/kazakhstan-deposits.ts` with proper listing type
2. Ensure all required fields for the specific type are included
3. Test filters and search functionality

### UI Component Development

1. Follow existing patterns in `/components/ui/`
2. Use only gray/blue color scheme
3. Test hover states and transitions
4. Ensure responsive design (mobile-first)

### Type Safety

- All Kazakhstan-specific types defined in `src/lib/types/listing.ts`
- Strict TypeScript configuration enforced
- Use proper typing for mineral types, regions, and listing statuses

### Testing Strategy

- Unit tests for utilities and components
- Integration tests for key user flows
- Manual testing required for mining-specific business logic

## Important Files to Review

- `src/lib/types/listing.ts` - Core business types
- `src/lib/data/kazakhstan-deposits.ts` - Sample data structure
- `src/components/features/` - Business logic components
- `CLAUDE_TECHNICAL_GUIDE.md` - Detailed implementation guide
- `START_COMMANDS.md` - Step-by-step onboarding

## Development Rules

1. **Incremental Changes**: Never rewrite entire architecture; make file-by-file updates
2. **Preserve Functionality**: Only add/enhance; never remove working features
3. **Follow Design System**: Strict adherence to gray+blue color scheme
4. **Kazakhstan Context**: All content should reflect Kazakhstan mining industry
5. **Type Safety**: Use provided TypeScript types for all Kazakhstan-specific data

## MCP Server Integration

MCP servers extend Claude's capabilities for full automation. See `MCP_COMPLETE_GUIDE.md` for detailed documentation.

### ⚠️ IMPORTANT: MCP Configuration Location

MCP servers must be configured in the **global Claude configuration** file:

- Location: `~/.claude.json`
- Under project section: `"/Users/yerlankulumgariyev/Documents/qaznedr-app"`
- NOT in the local `claude.json` file (this won't work!)

### ✅ Active MCP Servers with Full Access:

#### Production-Ready (Fully Configured):

1. **Sentry** - Automatic error monitoring and fixing (Admin access enabled)
   - ✅ Working: Global config with env variables
   - ❌ Not working: Local claude.json, wrapper scripts
2. **Cloudflare** - Infrastructure and deployment management
   - ✅ Working: Global config with env variables
   - ❌ Not working: Local claude.json, wrapper scripts
3. **GitLab** - Repository and CI/CD management
   - ✅ Working: Global config with env variables
   - ❌ Not working: Local claude.json, wrapper scripts
4. **GitHub** - Version control and PR automation
5. **Supabase** - Database operations (PRIMARY DATABASE)
6. **Memory** - Context persistence between sessions (if configured globally)

#### System MCP Servers (Already Active):

- **Git** - Version control operations
- **Filesystem** - Direct file access
- **Sequential-thinking** - Complex task analysis
- **Brave-search** - Web search
- **Puppeteer** - Browser automation
- **Context7** - Library documentation
- **Task-manager** - Task tracking
- **Firecrawl** - Web scraping

### 🔄 Automated Workflows Available:

#### Error Detection → Fix → Deploy:

```
Sentry detects error → Claude analyzes → Fixes code → Creates PR → Deploys to Cloudflare
```

#### Task Management → Implementation:

```
Jira/Linear task → Claude implements → Updates status → Creates PR → Closes on merge
```

### 📝 Key MCP Commands:

```bash
# Sentry Operations
"Show latest errors from Sentry"
"Fix all TypeErrors in the project"
"Analyze error with ID xxx"

# Deployment
"Deploy to Cloudflare Workers"
"Create preview deployment"
"Update DNS records"

# Database
"Optimize database queries"
"Create migration for new schema"
"Setup RLS policies"

# Project Management
"Create PR with fixes"
"Update Jira ticket status"
"Generate sprint report"
```

### 🔐 Security Notes:

- All tokens are stored in global `~/.claude.json` (never commit this file!)
- Sentry has full admin access for automation
- Database has service role access
- Tokens are NOT in `.env.mcp` or local files (this approach doesn't work)

For complete MCP documentation, see `MCP_COMPLETE_GUIDE.md`

## VS Code Extensions Integration

Claude Code can now interact with your VS Code extensions through the MCP server wrapper. This provides automated access to Docker, Error Lens, Python environments, and more.

### ✅ Available VS Code Extension Commands:

#### Docker Integration:

```bash
# Docker operations through VS Code
"List all Docker containers"
"Show logs from container X"
"Execute command in container"
"Docker compose up/down"
"List Docker images"
```

#### Error Lens Diagnostics:

```bash
# Real-time error detection
"Show all TypeScript errors"
"Get diagnostics for current file"
"Show project error summary"
"Get inline error suggestions"
```

#### Python Environments:

```bash
# Python environment management
"List all Python environments"
"Create virtual environment"
"Install packages from requirements"
"Activate conda environment"
"Check outdated packages"
```

#### GitHub Copilot Info:

```bash
# Copilot status and tips
"Check Copilot status"
"Explain Copilot shortcuts"
"Show Copilot best practices"
```

#### Container/Dev Containers:

```bash
# Dev container setup
"Setup Node.js dev container"
"Check if running in container"
"Configure Kubernetes integration"
"List Docker volumes"
```

### 🔧 Extension Tools Reference:

The VS Code extensions are accessed through MCP tools prefixed with their category:

- `docker_*` - Docker operations (containers, images, compose)
- `errorlens_*` - Error diagnostics and analysis
- `python_*` - Python environment management
- `copilot_*` - GitHub Copilot information
- `container_*` - Dev containers and Kubernetes

### 📝 Usage Examples:

```bash
# Check all project errors
"Show me all TypeScript errors in the project"
"What files have the most errors?"

# Docker management
"List running Docker containers"
"Show logs from the api container"
"Run docker-compose up in detached mode"

# Python setup
"Create a new Python virtual environment"
"Install numpy and pandas"
"List outdated Python packages"

# Dev containers
"Setup a Node.js dev container with Docker-in-Docker"
"Am I running in a container environment?"
```

### 🚀 Automatic Integration:

The VS Code extensions MCP server is automatically started when you open Claude Code. All extension features are available immediately without manual activation.

Note: Some operations require the actual VS Code extensions to be installed (which you already have). The MCP server acts as a bridge to interact with these extensions programmatically
