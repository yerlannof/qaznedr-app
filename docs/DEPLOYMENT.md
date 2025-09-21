# QAZNEDR Deployment Guide

## Overview

This guide covers deploying the QAZNEDR platform to various environments including Vercel, Cloudflare Workers, and traditional VPS/Docker setups.

## Prerequisites

- Node.js 20+ installed
- Git repository configured
- Environment variables prepared
- Database (Supabase) configured
- Domain name (qaznedr.kz) with DNS access

## Deployment Options

### 1. Vercel (Recommended)

#### Initial Setup

1. **Connect Repository**

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link
```

2. **Configure Project**

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

#### Environment Variables

Set in Vercel Dashboard or via CLI:

```bash
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SENTRY_DSN production
vercel env add SENTRY_AUTH_TOKEN production
```

#### vercel.json Configuration

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["fra1"],
  "functions": {
    "src/app/api/listings/route.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=60, stale-while-revalidate"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/",
      "destination": "/ru",
      "permanent": false
    }
  ]
}
```

#### Domain Configuration

1. Add custom domain in Vercel Dashboard
2. Update DNS records:

```
Type    Name    Value
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

### 2. Cloudflare Workers

#### Setup Worker

1. **Install Wrangler**

```bash
npm install -g wrangler
wrangler login
```

2. **Configure wrangler.toml**

```toml
name = "qaznedr-app"
main = ".cloudflare/worker.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[site]
bucket = ".vercel/output/static"

[build]
command = "npm run build && node .cloudflare/build.js"

[[kv_namespaces]]
binding = "KV_CACHE"
id = "your-kv-namespace-id"

[[r2_buckets]]
binding = "R2_STORAGE"
bucket_name = "qaznedr-assets"

[[d1_databases]]
binding = "DB"
database_name = "qaznedr-db"
database_id = "your-d1-database-id"

[vars]
NEXTAUTH_URL = "https://qaznedr.kz"

[secrets]
NEXTAUTH_SECRET
SUPABASE_SERVICE_KEY
SENTRY_DSN
```

3. **Deploy to Workers**

```bash
# Build for Workers
npm run build:cf

# Deploy
wrangler deploy

# Deploy to production
wrangler deploy --env production
```

#### Edge Functions

Create `.cloudflare/worker.js`:

```javascript
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

export default {
  async fetch(request, env, ctx) {
    try {
      // Serve static assets
      return await getAssetFromKV(
        { request, waitUntil: ctx.waitUntil.bind(ctx) },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: JSON.parse(env.__STATIC_CONTENT_MANIFEST),
        }
      );
    } catch (e) {
      // Handle API routes
      if (request.url.includes('/api/')) {
        return handleAPI(request, env);
      }

      // Return 404
      return new Response('Not Found', { status: 404 });
    }
  },
};
```

### 3. Docker Deployment

#### Dockerfile

```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    volumes:
      - uploads:/app/uploads
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  uploads:
```

#### Nginx Configuration

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name qaznedr.kz www.qaznedr.kz;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name qaznedr.kz www.qaznedr.kz;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /_next/static {
        proxy_pass http://app:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, immutable";
    }
}
```

### 4. VPS Deployment (Ubuntu/Debian)

#### Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Configure firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

#### Application Deployment

```bash
# Clone repository
git clone https://github.com/your-org/qaznedr-app.git
cd qaznedr-app

# Install dependencies
npm ci --production

# Build application
npm run build

# Create .env file
nano .env.production
```

#### PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'qaznedr',
      script: 'npm',
      args: 'start',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
    },
  ],
};
```

Start with PM2:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Database Migrations

### Supabase Production Setup

1. **Create Production Project**
   - Go to supabase.com
   - Create new project in production region
   - Note connection string and keys

2. **Run Migrations**

```bash
# Set production DATABASE_URL
export DATABASE_URL="postgresql://..."

# Run migrations
npx prisma migrate deploy

# Seed initial data (if needed)
npm run db:seed:prod
```

3. **Configure RLS Policies**

```sql
-- Enable RLS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public listings are viewable by everyone"
ON listings FOR SELECT
USING (status = 'ACTIVE');

-- Authenticated write access
CREATE POLICY "Users can insert their own listings"
ON listings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own listings"
ON listings FOR UPDATE
USING (auth.uid() = user_id);
```

## Monitoring & Analytics

### Sentry Configuration

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [Sentry.replayIntegration()],
});
```

### Vercel Analytics

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### Health Checks

Create `app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Check Supabase
    const supabaseHealth = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/health`
    );

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        supabase: supabaseHealth.ok ? 'healthy' : 'unhealthy',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
      },
      { status: 503 }
    );
  }
}
```

## Performance Optimization

### 1. Image Optimization

```typescript
// next.config.ts
const config: NextConfig = {
  images: {
    domains: ['your-cdn.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
  },
};
```

### 2. Static Generation

```typescript
// app/listings/[id]/page.tsx
export async function generateStaticParams() {
  const listings = await getPopularListings();
  return listings.map((listing) => ({
    id: listing.id,
  }));
}
```

### 3. Edge Caching

```typescript
// app/api/listings/route.ts
export async function GET(request: Request) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 's-maxage=60, stale-while-revalidate',
    },
  });
}
```

## Security Checklist

### Pre-deployment

- [ ] Environment variables set correctly
- [ ] NEXTAUTH_SECRET is strong and unique
- [ ] Database has proper RLS policies
- [ ] API rate limiting configured
- [ ] CORS settings reviewed
- [ ] CSP headers configured
- [ ] Input validation on all forms
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled

### Post-deployment

- [ ] SSL certificate installed
- [ ] Security headers tested (securityheaders.com)
- [ ] Monitoring configured (Sentry)
- [ ] Backup strategy implemented
- [ ] Log aggregation setup
- [ ] DDoS protection enabled (Cloudflare)
- [ ] Regular security updates scheduled

## Rollback Strategy

### Vercel

```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback <deployment-url>
```

### Docker

```bash
# Tag before deployment
docker tag qaznedr:latest qaznedr:backup

# Rollback
docker stop qaznedr
docker run -d --name qaznedr qaznedr:backup
```

### PM2

```bash
# Revert to previous version
pm2 reload ecosystem.config.js --update-env
pm2 reset qaznedr
```

## Troubleshooting

### Common Issues

1. **Build Failures**

```bash
# Clear cache
rm -rf .next node_modules
npm ci
npm run build
```

2. **Database Connection**

```bash
# Test connection
npx prisma db pull
```

3. **Environment Variables**

```bash
# Verify variables
npm run env:check
```

4. **Memory Issues**

```javascript
// Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

## Maintenance Mode

Create `middleware.ts`:

```typescript
import { NextResponse } from 'next/server';

export function middleware(request: Request) {
  if (process.env.MAINTENANCE_MODE === 'true') {
    return NextResponse.rewrite(new URL('/maintenance', request.url));
  }
}

export const config = {
  matcher: '/((?!maintenance|_next/static|favicon.ico).*)',
};
```

## CI/CD Pipeline

### GitHub Actions

Already configured in `.github/workflows/ci.yml`

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

test:
  stage: test
  script:
    - npm ci
    - npm run lint
    - npm run test:coverage

build:
  stage: build
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - .next/

deploy:
  stage: deploy
  script:
    - vercel --prod --token $VERCEL_TOKEN
  only:
    - main
```

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Cloudflare Workers**: https://developers.cloudflare.com/workers
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Supabase Guides**: https://supabase.com/docs/guides
- **PM2 Documentation**: https://pm2.keymetrics.io/
