# Database Schema Documentation

## Overview

QAZNEDR uses Prisma ORM with SQLite for development and PostgreSQL (Supabase) for production. The schema is designed to support mining rights marketplace operations in Kazakhstan.

## Database Configuration

### Development

```env
DATABASE_URL="file:./dev.db"
```

### Production (Supabase)

```env
DATABASE_URL="postgresql://user:password@host:port/database"
DIRECT_URL="postgresql://user:password@host:port/database"
```

## Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Account : has
    User ||--o{ Session : has
    User ||--o{ KazakhstanDeposit : owns
    User ||--o{ Favorite : has
    User ||--o{ View : creates
    User ||--o{ Document : uploads
    User ||--o{ ContactRequest : sends
    User ||--o{ ContactRequest : receives
    User ||--o{ Notification : receives

    KazakhstanDeposit ||--o{ Favorite : has
    KazakhstanDeposit ||--o{ View : receives
    KazakhstanDeposit ||--o{ Document : contains
    KazakhstanDeposit ||--o{ ContactRequest : about
```

## Core Tables

### User

**Purpose**: Stores user account information and authentication data

| Column        | Type      | Description                  | Constraints       |
| ------------- | --------- | ---------------------------- | ----------------- |
| id            | String    | Unique identifier            | PRIMARY KEY, CUID |
| email         | String    | User email address           | UNIQUE, NOT NULL  |
| name          | String?   | User display name            | NULLABLE          |
| password      | String    | Hashed password              | NOT NULL          |
| emailVerified | DateTime? | Email verification timestamp | NULLABLE          |
| image         | String?   | Profile image URL            | NULLABLE          |
| role          | String    | User role                    | DEFAULT "BUYER"   |
| company       | String?   | Company name                 | NULLABLE          |
| phone         | String?   | Contact phone                | NULLABLE          |
| verified      | Boolean   | Verified seller status       | DEFAULT false     |
| createdAt     | DateTime  | Account creation date        | DEFAULT now()     |
| updatedAt     | DateTime  | Last update timestamp        | AUTO UPDATE       |

**Roles**:

- `BUYER` - Can browse and contact sellers
- `SELLER` - Can create and manage listings
- `ADMIN` - Full system access

### KazakhstanDeposit

**Purpose**: Main table for mining rights listings

| Column      | Type     | Description          | Constraints      |
| ----------- | -------- | -------------------- | ---------------- |
| id          | String   | Unique identifier    | PRIMARY KEY      |
| title       | String   | Listing title        | NOT NULL         |
| description | String   | Detailed description | NOT NULL         |
| type        | String   | Listing type         | NOT NULL         |
| mineral     | String   | Mineral type         | NOT NULL         |
| region      | String   | Kazakhstan region    | NOT NULL         |
| city        | String   | City/location        | NOT NULL         |
| area        | Float    | Area in km²          | NOT NULL         |
| price       | Float?   | Price in Tenge       | NULLABLE         |
| coordinates | String   | JSON [lat, lng]      | NOT NULL         |
| verified    | Boolean  | Verification status  | DEFAULT false    |
| featured    | Boolean  | Featured listing     | DEFAULT false    |
| views       | Int      | View counter         | DEFAULT 0        |
| status      | String   | Listing status       | DEFAULT "ACTIVE" |
| images      | String   | JSON array of URLs   | NOT NULL         |
| documents   | String   | JSON array of URLs   | NOT NULL         |
| userId      | String   | Owner reference      | FOREIGN KEY      |
| createdAt   | DateTime | Creation date        | DEFAULT now()    |
| updatedAt   | DateTime | Last update          | AUTO UPDATE      |

**Listing Types**:

- `MINING_LICENSE` - Active extraction rights
- `EXPLORATION_LICENSE` - Exploration permits
- `MINERAL_OCCURRENCE` - Documented findings

**Status Values**:

- `ACTIVE` - Available for sale
- `PENDING` - Under review
- `SOLD` - Transaction completed
- `DRAFT` - Not published

**Minerals** (Kazakhstan focus):

- Нефть (Oil)
- Газ (Gas)
- Золото (Gold)
- Медь (Copper)
- Уголь (Coal)
- Уран (Uranium)
- Железо (Iron)

**Regions** (14 Kazakhstan oblasts):

- Мангистауская
- Атырауская
- Западно-Казахстанская
- Актюбинская
- Костанайская
- Северо-Казахстанская
- Акмолинская
- Павлодарская
- Карагандинская
- Восточно-Казахстанская
- Алматинская
- Жамбылская
- Туркестанская
- Кызылординская

### Type-Specific Fields

#### Mining License Fields

| Column                | Type      | Description             |
| --------------------- | --------- | ----------------------- |
| licenseSubtype        | String?   | License subtype         |
| licenseNumber         | String?   | Official license number |
| licenseExpiry         | DateTime? | License expiration date |
| annualProductionLimit | Float?    | Annual extraction limit |

**License Subtypes**:

- `EXTRACTION_RIGHT` - Full extraction rights
- `PROCESSING_RIGHT` - Processing only
- `TRANSPORT_RIGHT` - Transportation rights

#### Exploration License Fields

| Column            | Type      | Description               |
| ----------------- | --------- | ------------------------- |
| explorationStage  | String?   | Current exploration phase |
| explorationStart  | DateTime? | Exploration start date    |
| explorationEnd    | DateTime? | Exploration end date      |
| explorationBudget | Float?    | Allocated budget          |

**Exploration Stages**:

- `PRELIMINARY` - Initial survey
- `DETAILED` - Detailed exploration
- `FEASIBILITY` - Feasibility study
- `ENVIRONMENTAL` - Environmental assessment

#### Mineral Occurrence Fields

| Column               | Type      | Description        |
| -------------------- | --------- | ------------------ |
| discoveryDate        | DateTime? | Discovery date     |
| geologicalConfidence | String?   | Confidence level   |
| estimatedReserves    | Float?    | Estimated reserves |
| accessibilityRating  | String?   | Site accessibility |

**Geological Confidence**:

- `INFERRED` - Low confidence
- `INDICATED` - Medium confidence
- `MEASURED` - High confidence

**Accessibility Ratings**:

- `EASY` - Road access, infrastructure
- `MODERATE` - Some infrastructure
- `DIFFICULT` - Remote location
- `VERY_DIFFICULT` - Extreme conditions

## Supporting Tables

### Favorite

**Purpose**: User's saved listings

| Column    | Type     | Description       | Constraints   |
| --------- | -------- | ----------------- | ------------- |
| id        | String   | Unique identifier | PRIMARY KEY   |
| userId    | String   | User reference    | FOREIGN KEY   |
| depositId | String   | Deposit reference | FOREIGN KEY   |
| createdAt | DateTime | Favorited date    | DEFAULT now() |

**Unique Constraint**: [userId, depositId]

### View

**Purpose**: Track listing views for analytics

| Column    | Type     | Description           | Constraints           |
| --------- | -------- | --------------------- | --------------------- |
| id        | String   | Unique identifier     | PRIMARY KEY           |
| depositId | String   | Viewed deposit        | FOREIGN KEY           |
| userId    | String?  | Viewer (if logged in) | FOREIGN KEY, NULLABLE |
| ipAddress | String   | Viewer IP             | NOT NULL              |
| userAgent | String   | Browser info          | NOT NULL              |
| createdAt | DateTime | View timestamp        | DEFAULT now()         |

### Document

**Purpose**: Store listing documents

| Column     | Type     | Description        | Constraints   |
| ---------- | -------- | ------------------ | ------------- |
| id         | String   | Unique identifier  | PRIMARY KEY   |
| depositId  | String   | Parent deposit     | FOREIGN KEY   |
| name       | String   | Document name      | NOT NULL      |
| type       | String   | Document type      | NOT NULL      |
| url        | String   | Document URL       | NOT NULL      |
| size       | Int      | File size in bytes | NOT NULL      |
| uploadedBy | String   | Uploader user      | FOREIGN KEY   |
| createdAt  | DateTime | Upload date        | DEFAULT now() |

**Document Types**:

- `LICENSE` - Official licenses
- `GEOLOGICAL_SURVEY` - Geological reports
- `ENVIRONMENTAL` - Environmental assessments
- `FINANCIAL` - Financial statements
- `LEGAL` - Legal documents
- `OTHER` - Miscellaneous

### ContactRequest

**Purpose**: Manage buyer-seller communication

| Column     | Type     | Description       | Constraints       |
| ---------- | -------- | ----------------- | ----------------- |
| id         | String   | Unique identifier | PRIMARY KEY       |
| depositId  | String   | Related deposit   | FOREIGN KEY       |
| fromUserId | String   | Sender            | FOREIGN KEY       |
| toUserId   | String   | Recipient         | FOREIGN KEY       |
| message    | String   | Request message   | NOT NULL          |
| phone      | String?  | Contact phone     | NULLABLE          |
| email      | String?  | Contact email     | NULLABLE          |
| status     | String   | Request status    | DEFAULT "PENDING" |
| createdAt  | DateTime | Request date      | DEFAULT now()     |
| updatedAt  | DateTime | Last update       | AUTO UPDATE       |

**Status Values**:

- `PENDING` - Awaiting response
- `RESPONDED` - Seller responded
- `CLOSED` - Request closed

### Notification

**Purpose**: User notifications system

| Column    | Type     | Description        | Constraints   |
| --------- | -------- | ------------------ | ------------- |
| id        | String   | Unique identifier  | PRIMARY KEY   |
| userId    | String   | Recipient user     | FOREIGN KEY   |
| type      | String   | Notification type  | NOT NULL      |
| title     | String   | Notification title | NOT NULL      |
| message   | String   | Full message       | NOT NULL      |
| data      | String?  | JSON extra data    | NULLABLE      |
| read      | Boolean  | Read status        | DEFAULT false |
| createdAt | DateTime | Creation date      | DEFAULT now() |

**Notification Types**:

- `NEW_DEPOSIT` - New listing matching criteria
- `PRICE_CHANGE` - Price updated on watched item
- `AUCTION_START` - Auction beginning
- `AUCTION_END` - Auction ending
- `MESSAGE` - New message received
- `SYSTEM` - System announcement

## Authentication Tables

### Account

**Purpose**: OAuth provider accounts (NextAuth)

| Column            | Type    | Description         | Constraints |
| ----------------- | ------- | ------------------- | ----------- |
| id                | String  | Unique identifier   | PRIMARY KEY |
| userId            | String  | User reference      | FOREIGN KEY |
| type              | String  | Account type        | NOT NULL    |
| provider          | String  | OAuth provider      | NOT NULL    |
| providerAccountId | String  | Provider's user ID  | NOT NULL    |
| refresh_token     | String? | OAuth refresh token | NULLABLE    |
| access_token      | String? | OAuth access token  | NULLABLE    |
| expires_at        | Int?    | Token expiry        | NULLABLE    |
| token_type        | String? | Token type          | NULLABLE    |
| scope             | String? | OAuth scopes        | NULLABLE    |
| id_token          | String? | OpenID token        | NULLABLE    |
| session_state     | String? | Session state       | NULLABLE    |

**Unique Constraint**: [provider, providerAccountId]

### Session

**Purpose**: Active user sessions (NextAuth)

| Column       | Type     | Description       | Constraints |
| ------------ | -------- | ----------------- | ----------- |
| id           | String   | Unique identifier | PRIMARY KEY |
| sessionToken | String   | Session token     | UNIQUE      |
| userId       | String   | User reference    | FOREIGN KEY |
| expires      | DateTime | Expiry date       | NOT NULL    |

### VerificationToken

**Purpose**: Email verification tokens (NextAuth)

| Column     | Type     | Description        | Constraints |
| ---------- | -------- | ------------------ | ----------- |
| identifier | String   | Email/identifier   | NOT NULL    |
| token      | String   | Verification token | UNIQUE      |
| expires    | DateTime | Token expiry       | NOT NULL    |

**Unique Constraint**: [identifier, token]

## Analytics Tables

### AnalyticsEvent

**Purpose**: Track user actions and events

| Column     | Type     | Description       | Constraints   |
| ---------- | -------- | ----------------- | ------------- |
| id         | String   | Unique identifier | PRIMARY KEY   |
| name       | String   | Event name        | NOT NULL      |
| properties | Json?    | Event properties  | NULLABLE      |
| userId     | String?  | User ID           | NULLABLE      |
| sessionId  | String?  | Session ID        | NULLABLE      |
| timestamp  | DateTime | Event time        | NOT NULL      |
| clientIP   | String?  | Client IP         | NULLABLE      |
| userAgent  | String?  | Browser info      | NULLABLE      |
| createdAt  | DateTime | Record creation   | DEFAULT now() |

**Common Events**:

- `page_view` - Page viewed
- `listing_viewed` - Listing detail viewed
- `contact_request` - Contact request sent
- `favorite_added` - Added to favorites
- `search_performed` - Search executed

### ErrorLog

**Purpose**: Application error tracking

| Column      | Type     | Description       | Constraints   |
| ----------- | -------- | ----------------- | ------------- |
| id          | String   | Unique identifier | PRIMARY KEY   |
| message     | String   | Error message     | NOT NULL      |
| stack       | String?  | Stack trace       | NULLABLE      |
| severity    | String   | Error severity    | NOT NULL      |
| fingerprint | String   | Error fingerprint | NOT NULL      |
| count       | Int      | Occurrence count  | DEFAULT 1     |
| context     | Json?    | Error context     | NULLABLE      |
| timestamp   | DateTime | Error time        | NOT NULL      |
| clientIP    | String?  | Client IP         | NULLABLE      |
| userAgent   | String?  | Browser info      | NULLABLE      |
| userId      | String?  | Affected user     | NULLABLE      |
| sessionId   | String?  | Session ID        | NULLABLE      |
| url         | String?  | Error URL         | NULLABLE      |
| component   | String?  | React component   | NULLABLE      |
| action      | String?  | User action       | NULLABLE      |
| createdAt   | DateTime | Record creation   | DEFAULT now() |

**Severity Levels**:

- `low` - Minor issues
- `medium` - User-facing errors
- `high` - Critical errors
- `critical` - System failures

## Indexes

### Performance Indexes

```sql
-- KazakhstanDeposit
CREATE INDEX idx_deposit_region ON KazakhstanDeposit(region);
CREATE INDEX idx_deposit_mineral ON KazakhstanDeposit(mineral);
CREATE INDEX idx_deposit_type ON KazakhstanDeposit(type);
CREATE INDEX idx_deposit_status ON KazakhstanDeposit(status);
CREATE INDEX idx_deposit_verified ON KazakhstanDeposit(verified);
CREATE INDEX idx_deposit_featured ON KazakhstanDeposit(featured);
CREATE INDEX idx_deposit_created ON KazakhstanDeposit(createdAt);

-- View
CREATE INDEX idx_view_deposit ON View(depositId);
CREATE INDEX idx_view_created ON View(createdAt);

-- Document
CREATE INDEX idx_document_deposit ON Document(depositId);
CREATE INDEX idx_document_type ON Document(type);

-- ContactRequest
CREATE INDEX idx_contact_deposit ON ContactRequest(depositId);
CREATE INDEX idx_contact_from ON ContactRequest(fromUserId);
CREATE INDEX idx_contact_to ON ContactRequest(toUserId);
CREATE INDEX idx_contact_status ON ContactRequest(status);

-- Notification
CREATE INDEX idx_notification_user ON Notification(userId);
CREATE INDEX idx_notification_read ON Notification(read);
CREATE INDEX idx_notification_created ON Notification(createdAt);

-- AnalyticsEvent
CREATE INDEX idx_analytics_name ON AnalyticsEvent(name);
CREATE INDEX idx_analytics_user ON AnalyticsEvent(userId);
CREATE INDEX idx_analytics_session ON AnalyticsEvent(sessionId);
CREATE INDEX idx_analytics_timestamp ON AnalyticsEvent(timestamp);

-- ErrorLog
CREATE INDEX idx_error_severity ON ErrorLog(severity);
CREATE INDEX idx_error_fingerprint ON ErrorLog(fingerprint);
CREATE INDEX idx_error_component ON ErrorLog(component);
CREATE INDEX idx_error_timestamp ON ErrorLog(timestamp);
CREATE INDEX idx_error_user ON ErrorLog(userId);
```

## Database Operations

### Migrations

```bash
# Create migration
npx prisma migrate dev --name description

# Apply migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset

# Generate client
npx prisma generate
```

### Seeding

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { kazakhstanDeposits } from '../src/lib/data/kazakhstan-deposits';

const prisma = new PrismaClient();

async function main() {
  // Seed users
  const user = await prisma.user.create({
    data: {
      email: 'admin@qaznedr.kz',
      name: 'Admin User',
      password: 'hashed_password',
      role: 'ADMIN',
      verified: true,
    },
  });

  // Seed deposits
  for (const deposit of kazakhstanDeposits) {
    await prisma.kazakhstanDeposit.create({
      data: {
        ...deposit,
        userId: user.id,
        coordinates: JSON.stringify(deposit.coordinates),
        images: JSON.stringify(deposit.images),
        documents: JSON.stringify([]),
      },
    });
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
```

### Common Queries

```typescript
// Find active listings
const activeListings = await prisma.kazakhstanDeposit.findMany({
  where: { status: 'ACTIVE' },
  include: { user: true },
  orderBy: { createdAt: 'desc' },
});

// Get user favorites
const favorites = await prisma.favorite.findMany({
  where: { userId: 'user_id' },
  include: {
    deposit: {
      include: { user: true },
    },
  },
});

// Track view
await prisma.view.create({
  data: {
    depositId: 'deposit_id',
    userId: 'user_id',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
  },
});

// Analytics aggregation
const viewStats = await prisma.view.groupBy({
  by: ['depositId'],
  _count: { depositId: true },
  orderBy: { _count: { depositId: 'desc' } },
  take: 10,
});
```

## Security Considerations

### Row Level Security (Supabase)

```sql
-- Enable RLS
ALTER TABLE "KazakhstanDeposit" ENABLE ROW LEVEL SECURITY;

-- Public read for active listings
CREATE POLICY "public_read" ON "KazakhstanDeposit"
  FOR SELECT
  USING (status = 'ACTIVE');

-- Owner write access
CREATE POLICY "owner_write" ON "KazakhstanDeposit"
  FOR ALL
  USING (auth.uid()::text = "userId");

-- Admin full access
CREATE POLICY "admin_all" ON "KazakhstanDeposit"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()::text
      AND role = 'ADMIN'
    )
  );
```

### Data Validation

```typescript
// Validate coordinates
function validateCoordinates(coords: [number, number]): boolean {
  const [lat, lng] = coords;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

// Validate Kazakhstan regions
const VALID_REGIONS = [
  'Мангистауская',
  'Атырауская', // ...
];

function validateRegion(region: string): boolean {
  return VALID_REGIONS.includes(region);
}

// Sanitize user input
function sanitizeInput(input: string): string {
  return input.trim().slice(0, 1000);
}
```

## Backup Strategy

### Development

```bash
# Backup SQLite
cp prisma/dev.db prisma/backups/dev-$(date +%Y%m%d).db
```

### Production (Supabase)

```bash
# Use Supabase dashboard or pg_dump
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20240115.sql
```

### Automated Backups

- Daily snapshots via Supabase
- Point-in-time recovery available
- Cross-region replication recommended

## Performance Optimization

### Query Optimization

1. Use indexes effectively
2. Limit result sets with pagination
3. Select only needed columns
4. Use includes sparingly
5. Cache frequently accessed data

### Connection Pooling

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

## Monitoring

### Database Metrics

- Query performance
- Connection pool usage
- Table sizes
- Index usage
- Slow query log

### Alerts

- Connection failures
- Slow queries (>1s)
- High error rates
- Storage thresholds

## Future Considerations

### Potential Schema Changes

1. **Auction System**: Add auction tables for bidding
2. **Messaging**: Direct messaging between users
3. **Reviews/Ratings**: Seller reputation system
4. **Payment Integration**: Transaction records
5. **Multi-tenancy**: Organization support
6. **Versioning**: Listing history tracking
7. **Advanced Search**: Full-text search with weights
8. **Geo-spatial**: PostGIS for advanced location queries
