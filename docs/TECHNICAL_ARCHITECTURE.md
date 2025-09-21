# QAZNEDR.KZ Technical Architecture

## System Overview

QAZNEDR.KZ is a modern web platform for Kazakhstan's mining industry, built with Next.js 15 and TypeScript, designed for scalability, security, and performance.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend Layer                          │
├───────────────────────────────────────────────────────────────────
│  Next.js 15 App Router │ React 18 │ TypeScript │ Tailwind CSS   │
│  Components: UI Library │ Features │ Layouts │ Context API      │
└───────────────────────────────────────────────────────────────────
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Middleware Layer                         │
├───────────────────────────────────────────────────────────────────
│  Security Headers │ Rate Limiting │ CSRF Protection │ Auth      │
│  Input Sanitization │ Performance Monitoring │ Caching          │
└───────────────────────────────────────────────────────────────────
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                          API Layer                               │
├───────────────────────────────────────────────────────────────────
│  REST API │ Route Handlers │ Validation │ Error Handling        │
│  GDPR Endpoints │ Analytics │ Webhooks │ File Upload            │
└───────────────────────────────────────────────────────────────────
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                                │
├───────────────────────────────────────────────────────────────────
│  Supabase (PostgreSQL) │ Row Level Security │ Real-time         │
│  Storage (S3-compatible) │ Edge Functions │ Vector DB           │
└───────────────────────────────────────────────────────────────────
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     External Services                            │
├───────────────────────────────────────────────────────────────────
│  Sentry (Monitoring) │ Vercel Analytics │ Stripe (Payments)    │
│  SendGrid (Email) │ Mapbox (Maps) │ Cloudflare (CDN)           │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 15.5.3 with App Router
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS v4
- **State Management**: React Context API
- **UI Components**: Custom component library (shadcn/ui pattern)
- **Forms**: React Hook Form + Zod validation
- **Internationalization**: next-intl
- **Maps**: Mapbox GL / MapLibre GL

### Backend
- **Runtime**: Node.js 20.x
- **API**: Next.js Route Handlers
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Authentication**: Supabase Auth + JWT
- **File Storage**: Supabase Storage
- **Caching**: In-memory + Edge caching

### Infrastructure
- **Hosting**: Vercel / Cloudflare Pages
- **CDN**: Cloudflare
- **Database**: Supabase (PostgreSQL)
- **Monitoring**: Sentry
- **Analytics**: Vercel Analytics + Google Analytics
- **CI/CD**: GitHub Actions

## Core Components

### 1. Authentication & Authorization

```typescript
// Role-Based Access Control
enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  VERIFIED_SELLER = 'verified_seller',
  SELLER = 'seller',
  BUYER = 'buyer'
}

// Permission System
enum Permission {
  CREATE_LISTING = 'create_listing',
  EDIT_ANY_LISTING = 'edit_any_listing',
  DELETE_ANY_LISTING = 'delete_any_listing',
  APPROVE_LISTING = 'approve_listing',
  ACCESS_ADMIN_PANEL = 'access_admin_panel'
}
```

### 2. Data Models

```typescript
// Core Listing Model
interface KazakhstanDeposit {
  id: string;
  title: string;
  description: string;
  type: 'MINING_LICENSE' | 'EXPLORATION_LICENSE' | 'MINERAL_OCCURRENCE';
  mineral: 'Oil' | 'Gas' | 'Gold' | 'Copper' | 'Coal' | 'Uranium' | 'Iron';
  price: number;
  area: number;
  region: string;
  city: string;
  coordinates: { lat: number; lng: number };
  status: 'DRAFT' | 'ACTIVE' | 'SOLD' | 'EXPIRED';
  // Type-specific fields...
}
```

### 3. API Architecture

```
/api
├── listings/         # CRUD operations for listings
├── auth/            # Authentication endpoints
├── gdpr/            # GDPR compliance endpoints
├── analytics/       # Analytics and metrics
├── admin/           # Admin operations
└── webhooks/        # External service webhooks
```

### 4. Security Architecture

#### Security Layers:
1. **Network Security**
   - Cloudflare DDoS protection
   - Rate limiting (30 req/min)
   - IP blocking for malicious activity

2. **Application Security**
   - Input sanitization (XSS prevention)
   - SQL injection protection
   - CSRF tokens
   - Security headers (CSP, HSTS, etc.)

3. **Data Security**
   - Encryption at rest (AES-256)
   - Encryption in transit (TLS 1.3)
   - Row Level Security (RLS)
   - Field-level encryption for PII

4. **Authentication Security**
   - JWT tokens with short expiry
   - Session management
   - Multi-factor authentication (MFA)
   - Account lockout after failed attempts

## Database Schema

### Core Tables

```sql
-- Main deposits table
kazakhstan_deposits (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  mineral TEXT NOT NULL,
  price BIGINT,
  area NUMERIC,
  status TEXT DEFAULT 'DRAFT',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- User profiles
user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT DEFAULT 'buyer',
  company TEXT,
  verified BOOLEAN DEFAULT false,
  metadata JSONB
)

-- Favorites
favorites (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  listing_id UUID REFERENCES kazakhstan_deposits(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Security events
security_events (
  id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  user_id UUID,
  ip_address TEXT,
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
)
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_deposits_type ON kazakhstan_deposits(type);
CREATE INDEX idx_deposits_mineral ON kazakhstan_deposits(mineral);
CREATE INDEX idx_deposits_region ON kazakhstan_deposits(region);
CREATE INDEX idx_deposits_created_at ON kazakhstan_deposits(created_at DESC);
CREATE INDEX idx_security_events_timestamp ON security_events(timestamp DESC);
```

## Performance Optimization

### 1. Frontend Optimization
- **Code Splitting**: Dynamic imports for routes
- **Image Optimization**: Next.js Image with WebP/AVIF
- **Bundle Size**: < 500KB initial load
- **Lazy Loading**: Components and images
- **Prefetching**: Next.js Link prefetch

### 2. Backend Optimization
- **Database Queries**: Optimized with indexes
- **Caching Strategy**:
  - Static pages: 1 year
  - API responses: 5 minutes
  - Images: 30 days
- **Connection Pooling**: Supabase connection pool
- **Query Optimization**: Pagination, selective fields

### 3. Infrastructure Optimization
- **CDN**: Cloudflare global network
- **Edge Functions**: Computation at edge
- **Compression**: Brotli/Gzip
- **HTTP/3**: QUIC protocol support

## Monitoring & Observability

### 1. Error Tracking (Sentry)
```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ]
});
```

### 2. Performance Monitoring
- Core Web Vitals tracking
- Custom metrics for business operations
- Real User Monitoring (RUM)
- Synthetic monitoring

### 3. Security Monitoring
- Real-time threat detection
- Anomaly detection
- Security event logging
- Automated incident response

## Scalability Strategy

### Horizontal Scaling
- **Application**: Serverless functions (auto-scaling)
- **Database**: Read replicas for queries
- **Storage**: S3-compatible object storage
- **Cache**: Distributed caching layer

### Vertical Scaling
- **Database**: Upgrade Supabase tier
- **Compute**: Increase function memory/timeout
- **Storage**: Increase storage limits

### Load Balancing
- Geographic distribution via Cloudflare
- Automatic failover
- Health checks

## Disaster Recovery

### Backup Strategy
- **Database**: Daily automated backups (30-day retention)
- **Files**: Versioned storage with soft delete
- **Code**: Git version control
- **Configuration**: Encrypted secrets backup

### Recovery Procedures
1. **RTO (Recovery Time Objective)**: < 1 hour
2. **RPO (Recovery Point Objective)**: < 24 hours
3. **Failover**: Automatic via Cloudflare
4. **Rollback**: Via deployment platform

## Development Workflow

### Git Flow
```
main (production)
├── develop (staging)
│   ├── feature/feature-name
│   ├── bugfix/bug-description
│   └── hotfix/critical-fix
```

### CI/CD Pipeline
1. **Commit** → GitHub
2. **Test** → Jest, ESLint, TypeScript
3. **Build** → Next.js production build
4. **Deploy** → Vercel/Cloudflare
5. **Monitor** → Sentry, Analytics

### Code Quality
- **Linting**: ESLint with custom rules
- **Formatting**: Prettier
- **Type Checking**: TypeScript strict mode
- **Testing**: Jest with 60%+ coverage
- **Code Review**: Required for main branch

## API Design Principles

### RESTful Design
- Consistent naming conventions
- Proper HTTP methods (GET, POST, PUT, DELETE)
- Status codes follow standards
- Pagination for list endpoints

### Security First
- Authentication required by default
- Input validation on all endpoints
- Rate limiting per endpoint
- Audit logging for sensitive operations

### Performance
- Response time < 200ms (p50)
- Batch operations where possible
- Efficient query patterns
- Caching headers

## Future Enhancements

### Phase 1 (Q1 2025)
- [ ] ElasticSearch integration
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] WebSocket real-time updates

### Phase 2 (Q2 2025)
- [ ] AI-powered recommendations
- [ ] Blockchain integration
- [ ] Advanced GIS features
- [ ] Multi-language support (5+ languages)

### Phase 3 (Q3 2025)
- [ ] Marketplace features
- [ ] Advanced reporting
- [ ] API marketplace
- [ ] White-label solution

## Compliance & Standards

### GDPR Compliance
- Data export functionality
- Right to deletion
- Consent management
- Privacy by design

### Security Standards
- OWASP Top 10 protection
- PCI DSS ready (for payments)
- SOC 2 Type II (in progress)
- ISO 27001 alignment

### Accessibility
- WCAG 2.1 Level AA compliance
- Keyboard navigation
- Screen reader support
- High contrast mode

## Support & Maintenance

### SLA Targets
- **Uptime**: 99.9% (43.2 minutes/month downtime)
- **Response Time**: < 500ms (p95)
- **Error Rate**: < 0.1%
- **Support Response**: < 2 hours (critical)

### Monitoring Dashboard
- Real-time metrics
- Alert thresholds
- Incident management
- Performance trends

## Documentation

### Technical Documentation
- API documentation (OpenAPI 3.0)
- Database schema documentation
- Architecture decision records (ADRs)
- Runbooks for common issues

### User Documentation
- User guides
- Video tutorials
- FAQ section
- API SDK examples