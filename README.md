# QAZNEDR.KZ - Kazakhstan Mining Rights Portal 🇰🇿

![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![Tests](https://img.shields.io/badge/Tests-Jest-red)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Overview

QAZNEDR.KZ is a specialized marketplace platform for buying and selling mineral deposits and mining licenses in Kazakhstan. The platform connects license holders with potential investors and mining companies, facilitating transparent transactions in the mining sector.

> 🎯 **Mission**: Digitalize Kazakhstan's mining rights marketplace, making it transparent, efficient, and accessible to global investors.

## Features

### Core Functionality

- **Three types of listings:**
  - Mining Licenses - Active extraction rights with operational permits
  - Exploration Licenses - Geological exploration and survey permits
  - Mineral Occurrences - Documented mineral findings and prospects

- **Advanced Search & Filtering:**
  - By mineral type (Oil, Gas, Gold, Copper, Coal, Uranium, Iron)
  - By region (14 Kazakhstan regions)
  - By price range and listing status
  - Full-text search with fuzzy matching

- **User Features:**
  - Secure authentication system
  - Personal dashboard for managing listings
  - Favorites system for tracking interesting opportunities
  - Multi-language support (Kazakh, Russian, English)

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- SQLite

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/qaznedr-app.git
cd qaznedr-app

# Install dependencies
npm install

# Setup database
npm run db:reset

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run test:e2e     # Run Playwright tests
npm run db:seed      # Seed database with sample data
```

## Tech Stack

- **Framework:** Next.js 15.3 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Prisma ORM with SQLite
- **Authentication:** NextAuth.js
- **Testing:** Playwright for E2E tests
- **Deployment:** Vercel / Docker

## Project Structure

```
src/
├── app/           # Next.js App Router pages and API routes
├── components/    # React components (features, layouts, ui)
├── contexts/      # React Context providers
├── lib/           # Business logic, utilities, and data
└── styles/        # Global styles
```

## Documentation

- [Technical Guide](./CLAUDE_TECHNICAL_GUIDE.md) - Detailed implementation guide
- [Deployment Instructions](./DEPLOY_INSTRUCTIONS.md) - Production deployment steps
- [Production Checklist](./PRODUCTION_READINESS.md) - Pre-launch checklist
- [Quick Commands](./START_COMMANDS.md) - Common development commands

## Environment Variables

Create a `.env.local` file with:

```env
# Database
DATABASE_URL="file:./dev.db"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Optional: Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=""
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Proprietary - All rights reserved

## Support

For questions or support, please contact the development team.
