# QAZNEDR.KZ Deployment Guide

## Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Git
- Supabase account
- Vercel/Cloudflare account (for deployment)
- Domain name (qaznedr.kz)

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/qaznedr-app.git
cd qaznedr-app
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Variables

Create `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-auth-token

# Session
SESSION_SECRET=your-secure-random-string

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id

# API Keys
MAPBOX_API_KEY=your-mapbox-key
STRIPE_SECRET_KEY=your-stripe-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Database Setup

### 1. Supabase Configuration

```sql
-- Run these migrations in Supabase SQL editor

-- Create tables
CREATE TABLE kazakhstan_deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  mineral TEXT NOT NULL,
  price BIGINT,
  area NUMERIC,
  region TEXT,
  city TEXT,
  coordinates JSONB,
  images TEXT[],
  documents TEXT[],
  status TEXT DEFAULT 'DRAFT',
  verified BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_deposits_type ON kazakhstan_deposits(type);
CREATE INDEX idx_deposits_mineral ON kazakhstan_deposits(mineral);
CREATE INDEX idx_deposits_region ON kazakhstan_deposits(region);
CREATE INDEX idx_deposits_status ON kazakhstan_deposits(status);
CREATE INDEX idx_deposits_user_id ON kazakhstan_deposits(user_id);
CREATE INDEX idx_deposits_created_at ON kazakhstan_deposits(created_at DESC);

-- Enable Row Level Security
ALTER TABLE kazakhstan_deposits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public can view active listings" ON kazakhstan_deposits
  FOR SELECT USING (status = 'ACTIVE');

CREATE POLICY "Users can create own listings" ON kazakhstan_deposits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own listings" ON kazakhstan_deposits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own listings" ON kazakhstan_deposits
  FOR DELETE USING (auth.uid() = user_id);
```

### 2. Storage Setup

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('listings', 'listings', true),
  ('documents', 'documents', false),
  ('avatars', 'avatars', true);

-- Set storage policies
CREATE POLICY "Anyone can view listing images" ON storage.objects
  FOR SELECT USING (bucket_id = 'listings');

CREATE POLICY "Users can upload listing images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'listings' AND auth.role() = 'authenticated');
```

## Build and Optimization

### 1. Production Build

```bash
# Build for production
npm run build

# Analyze bundle size
ANALYZE=true npm run build

# Type checking
npm run type-check

# Linting
npm run lint

# Run tests
npm test
```

### 2. Performance Optimization

- Enable Turbopack: `npm run dev -- --turbo`
- Image optimization: Use Next.js Image component
- Code splitting: Dynamic imports for large components
- Caching: Configure cache headers in next.config.ts

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy**
```bash
vercel --prod
```

3. **Configure Domain**
- Add domain in Vercel dashboard
- Update DNS records:
  ```
  A     @     76.76.21.21
  CNAME www   cname.vercel-dns.com
  ```

4. **Environment Variables**
- Add all env variables in Vercel dashboard
- Settings → Environment Variables

### Option 2: Cloudflare Pages

1. **Build Command**
```bash
npm run build
```

2. **Output Directory**
```
.next
```

3. **Environment Variables**
- Add in Cloudflare Pages settings
- Use Cloudflare KV for session storage

### Option 3: Docker

1. **Build Docker Image**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

2. **Build and Run**
```bash
docker build -t qaznedr-app .
docker run -p 3000:3000 --env-file .env.production qaznedr-app
```

## SSL/HTTPS Setup

### Cloudflare SSL

1. Add site to Cloudflare
2. Enable "Always Use HTTPS"
3. Set SSL mode to "Full (strict)"
4. Enable HSTS

### Let's Encrypt (Self-hosted)

```bash
# Install Certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d qaznedr.kz -d www.qaznedr.kz

# Auto-renewal
sudo certbot renew --dry-run
```

## Monitoring Setup

### 1. Sentry Configuration

```typescript
// sentry.client.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
});
```

### 2. Analytics Setup

```html
<!-- Google Analytics -->
<script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', GA_ID);
</script>
```

### 3. Uptime Monitoring

- Use UptimeRobot or Pingdom
- Monitor endpoints:
  - `https://qaznedr.kz` (Homepage)
  - `https://qaznedr.kz/api/health` (API Health)
  - `https://qaznedr.kz/api/listings` (Critical endpoint)

## CI/CD Pipeline

### GitHub Actions

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Post-Deployment Checklist

### Security
- [ ] SSL certificate active
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] CORS properly configured
- [ ] Environment variables secure
- [ ] Database backups configured

### Performance
- [ ] CDN configured
- [ ] Images optimized
- [ ] Gzip/Brotli compression enabled
- [ ] Cache headers set
- [ ] Bundle size < 500KB

### Monitoring
- [ ] Sentry error tracking active
- [ ] Analytics tracking working
- [ ] Uptime monitoring configured
- [ ] Performance monitoring enabled
- [ ] Log aggregation setup

### SEO
- [ ] Meta tags configured
- [ ] Sitemap generated
- [ ] Robots.txt configured
- [ ] Schema.org markup added
- [ ] Open Graph tags set

### Testing
- [ ] Smoke tests pass
- [ ] Critical user flows work
- [ ] Payment processing works
- [ ] Email notifications work
- [ ] Mobile responsive

## Rollback Procedure

### Vercel
```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback [deployment-url]
```

### Manual Rollback
```bash
# Checkout previous version
git checkout [previous-commit]

# Deploy
npm run build && npm run deploy
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version
   - Clear cache: `rm -rf .next node_modules`
   - Reinstall deps: `npm ci`

2. **Database Connection**
   - Verify Supabase URL and keys
   - Check RLS policies
   - Verify network access

3. **Performance Issues**
   - Enable caching
   - Optimize images
   - Use CDN
   - Enable compression

4. **SSL Issues**
   - Check certificate expiry
   - Verify domain configuration
   - Update security headers

## Maintenance Mode

Create `public/maintenance.html`:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <title>Техническое обслуживание - QAZNEDR.KZ</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px; 
        }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>Сайт на техническом обслуживании</h1>
    <p>Мы проводим плановые работы. Пожалуйста, зайдите позже.</p>
    <p>Приносим извинения за неудобства.</p>
</body>
</html>
```

Enable in Vercel/Cloudflare during maintenance.

## Support Contacts

- Technical Support: tech@qaznedr.kz
- DevOps Team: devops@qaznedr.kz
- Emergency: +7 (xxx) xxx-xx-xx