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

**Total configured**: 14 MCP servers (все серверы протестированы и работают)

### Active MCP Stack (14 servers):

1. **brave-search** - веб-поиск и исследования
2. **context7** - документация библиотек и фреймворков
3. **desktop-commander** - файловые операции и команды системы
4. **docker** - управление контейнерами
5. **fetch** - загрузка содержимого по URL
6. **firecrawl** - веб-скрапинг и извлечение данных
7. **git** - git операции и управление версиями
8. **memory-keeper** - структурированная память между сессиями
9. **puppeteer** - автоматизация браузера
10. **sqlite** - работа с базой данных SQLite (./prisma/dev.db)
11. **supabase** - интеграция с Supabase
12. **task-manager** - управление задачами проекта
13. **thread-continuity** - память между сессиями разработки
14. **time** - работа с временем и датами

### MCP Usage Notes:

- Все серверы настроены через `claude mcp add`
- Разрешения настроены в `.claude/settings.local.json`
- SQLite MCP настроен для работы с локальной Prisma БД
