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
- **Styling**: Tailwind CSS v3
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

- **Colors**: Gray base (gray-900 primary text) + blue accent (`#0A84FF`). No gradients, no bright colors. Primary buttons are BLACK (bg-gray-900), not blue.
- **Typography**: Inter font via next/font/google. Tight letter-spacing on headings (tracking-tight).
- **Components**: Minimal, clean design with subtle shadows (`shadow-subtle`) and hover effects (`hover:shadow-medium hover:-translate-y-0.5`). Border-based cards (`border border-gray-200 rounded-xl`).
- **Animations**: CSS transitions only for hover (duration-150/200). Framer Motion only for mount/unmount (AnimatePresence). No pulse, glow, sparkle, gradient-shift.
- **Icons**: Lucide React only. NO emoji in UI elements.
- **Copy**: Short, direct, factual. No marketing noise ("инновационная экосистема").
- **Forbidden**: glassmorphism, sparkle badges, emoji icons, blue primary buttons, centered hero text, gradient backgrounds, complex Framer Motion orchestrations

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
6. **No Console Statements**: Remove all console.log/error/warn from production code
7. **Test Coverage**: Maintain minimum 60% test coverage
8. **Build Before Commit**: Always run `npm run build` to ensure no TypeScript errors

## SEO Rules

Every page and feature must follow these SEO requirements:

1. **Every new page** must have a `metadata` export or `generateMetadata` function with unique `title` and `description`
2. **Every new dynamic page** (e.g., `/listings/[id]`) must have `generateMetadata` that uses the content data for title/description
3. **Every new page** must be added to `src/app/sitemap.ts`
4. **No blue backgrounds** in hero sections (design system rule)
5. **Heading hierarchy**: one `h1` per page, then `h2` → `h3` progression
6. **Images** must use `next/image` with `alt` text
7. **No emoji** in UI — use Lucide icons (also important for structured data parsing)
8. **Internal links** — link related pages to each other
9. **JSON-LD structured data** — add appropriate schema.org types for new content pages
10. **Canonical URLs** — use `qaznedr.kz` domain, never `vercel.app`
11. **After adding new content pages** — call `/api/indexnow` to notify search engines
12. **llms.txt** — update `public/llms.txt` when adding new major features or content types

### Key SEO Files

- `src/app/sitemap.ts` — sitemap generation
- `src/app/robots.ts` — crawler rules
- `public/llms.txt` — AI search engine info
- `public/.well-known/ai-plugin.json` — AI agent discovery
- `public/api/openapi.json` — API documentation for AI
- `src/app/[locale]/opengraph-image.tsx` — dynamic OG images

## Known Issues & Solutions

### Common Build Errors

1. **i18n Configuration Error**
   - Ensure `locale` is provided in i18n.ts: `locale: locale || 'ru'`
   - Messages path must be: `./src/messages/${locale}.json`

2. **TypeScript Recharts Errors**
   - Use `as any` for chart data props when needed
   - Example: `data={mineralDistribution as any}`

3. **Missing Dependencies**
   - Required: recharts, zod, react-map-gl, maplibre-gl, date-fns
   - Testing: jest, @testing-library/react, @testing-library/jest-dom

4. **Multiple Dev Servers Running**
   - Check with: `ps aux | grep "npm run dev"`
   - Kill all: `pkill -f "npm run dev"`

### File Organization Best Practices

1. **Component Structure**

   ```
   components/
   ├── features/       # Complex business features
   ├── layouts/        # Page layouts (Navigation, Footer)
   └── ui/            # Simple reusable components
   ```

2. **Test Files**
   - Place in `src/__tests__/` mirroring source structure
   - Name pattern: `ComponentName.test.tsx`

3. **API Routes**
   - All under `app/api/`
   - Use consistent error handling with `handleApiError`

### Performance Optimizations Applied

1. **Removed Unused Dependencies** (84 packages removed)
   - Cleaned production and dev dependencies
   - Kept only essential packages

2. **Component Consolidation**
   - Merged duplicate UI components
   - Removed \*New suffix variants

3. **Code Cleanup**
   - No console statements in production
   - Removed test/debug pages from production build

### Testing Setup

```bash
# Run tests
npm run test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

Key test mocks configured:

- Next.js navigation
- next-intl translations
- Supabase client
- fetch polyfill

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
