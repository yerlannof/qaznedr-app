# Production Deployment Checklist

## Pre-Deployment Verification

### 🔒 Security

- [ ] All environment variables are set in production
- [ ] NEXTAUTH_SECRET is strong and unique (32+ characters)
- [ ] Database credentials are secure and not committed
- [ ] API keys are production-ready (not test keys)
- [ ] CORS settings configured correctly
- [ ] CSP headers implemented
- [ ] Rate limiting enabled on all API endpoints
- [ ] Input validation on all forms
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] File upload restrictions in place

### 🗄️ Database

- [ ] Production database created (Supabase)
- [ ] All migrations tested and ready
- [ ] Database backups configured
- [ ] RLS policies enabled and tested
- [ ] Indexes created for performance
- [ ] Connection pooling configured
- [ ] Database monitoring set up

### 🚀 Performance

- [ ] Production build succeeds locally
- [ ] Bundle size optimized (<500KB initial)
- [ ] Images optimized and using next/image
- [ ] Static pages pre-rendered where possible
- [ ] API routes cached appropriately
- [ ] Database queries optimized
- [ ] N+1 queries eliminated
- [ ] Lazy loading implemented
- [ ] Critical CSS inlined

### ✅ Testing

- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Manual testing completed
- [ ] Cross-browser testing done
- [ ] Mobile responsiveness verified
- [ ] Accessibility audit passed
- [ ] Performance audit (Lighthouse 90+)

### 🌍 Internationalization

- [ ] All text translated (KZ, RU, EN)
- [ ] Date/time formatting correct
- [ ] Currency formatting working
- [ ] RTL support (if needed)
- [ ] Locale detection working
- [ ] Language switcher functional

### 📊 Monitoring

- [ ] Sentry error tracking configured
- [ ] Performance monitoring enabled
- [ ] Analytics configured
- [ ] Uptime monitoring set up
- [ ] Log aggregation configured
- [ ] Custom alerts defined
- [ ] Health check endpoints working

### 📦 Dependencies

- [ ] All packages up to date
- [ ] No high severity vulnerabilities
- [ ] License compatibility checked
- [ ] Unused dependencies removed
- [ ] Production dependencies separated from dev

## Deployment Steps

### 1. Environment Setup

```bash
# Verify all environment variables
npm run env:check

# Test with production variables locally
cp .env.production.example .env.production.local
# Fill in actual values
npm run build
npm run start
```

### 2. Database Migration

```bash
# Backup existing database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Run migrations
npx prisma migrate deploy

# Verify schema
npx prisma db pull
```

### 3. Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login and link project
vercel login
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### 4. Cloudflare Setup (Optional)

```bash
# Install Wrangler
npm i -g wrangler

# Login
wrangler login

# Deploy
wrangler deploy --env production
```

### 5. DNS Configuration

```
# Add to DNS provider
Type    Name    Value
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

### 6. SSL Certificate

- [ ] SSL certificate provisioned
- [ ] Auto-renewal configured
- [ ] HTTPS redirect enabled
- [ ] HSTS header configured

### 7. Monitoring Setup

```bash
# Create Sentry release
sentry-cli releases new -p qaznedr-app v1.0.0
sentry-cli releases set-commits v1.0.0 --auto
sentry-cli releases finalize v1.0.0
```

## Post-Deployment Verification

### ✅ Functional Testing

- [ ] Homepage loads correctly
- [ ] All navigation links work
- [ ] Search functionality works
- [ ] Filtering works correctly
- [ ] User registration works
- [ ] User login works
- [ ] Listing creation works
- [ ] Contact forms work
- [ ] Language switching works
- [ ] Maps load correctly
- [ ] Images load properly
- [ ] Documents upload/download works

### 🔍 SEO & Meta

- [ ] Meta tags present on all pages
- [ ] Open Graph tags working
- [ ] Twitter cards configured
- [ ] Sitemap accessible (/sitemap.xml)
- [ ] Robots.txt configured
- [ ] Canonical URLs set
- [ ] Schema.org markup added

### 📱 Performance Metrics

- [ ] Time to First Byte < 200ms
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] First Input Delay < 100ms

### 🛡️ Security Scan

- [ ] Run security headers test
- [ ] Check SSL Labs rating (A+)
- [ ] Verify CSP implementation
- [ ] Test rate limiting
- [ ] Verify authentication flow
- [ ] Check for exposed secrets
- [ ] Test file upload restrictions

### 📊 Analytics Verification

- [ ] Page view tracking working
- [ ] Event tracking functional
- [ ] User flow tracking active
- [ ] Error tracking operational
- [ ] Performance metrics collecting
- [ ] Custom events firing

## Rollback Plan

### Quick Rollback

```bash
# Vercel
vercel rollback

# Database
psql $DATABASE_URL < backup-20240115.sql

# DNS (if needed)
# Point to previous deployment
```

### Emergency Contacts

- **DevOps Lead**: [Contact]
- **Database Admin**: [Contact]
- **Security Team**: [Contact]
- **On-Call Engineer**: [Contact]

## Maintenance Mode

### Enable Maintenance

```bash
# Set environment variable
vercel env add NEXT_PUBLIC_MAINTENANCE_MODE production
# Value: true

# Redeploy
vercel --prod
```

### Disable Maintenance

```bash
# Update environment variable
vercel env rm NEXT_PUBLIC_MAINTENANCE_MODE production
vercel env add NEXT_PUBLIC_MAINTENANCE_MODE production
# Value: false

# Redeploy
vercel --prod
```

## Launch Communication

### Internal

- [ ] Team notified of deployment schedule
- [ ] Stakeholders informed
- [ ] Support team briefed
- [ ] Documentation updated

### External

- [ ] User notification sent (if breaking changes)
- [ ] Status page updated
- [ ] Social media announcement prepared
- [ ] Email campaign scheduled

## Success Criteria

### Week 1

- [ ] < 1% error rate
- [ ] < 100ms p95 response time
- [ ] Zero critical bugs
- [ ] 99.9% uptime

### Month 1

- [ ] User growth targets met
- [ ] Performance SLAs maintained
- [ ] Security audit passed
- [ ] Cost within budget

## Known Issues

### Current Limitations

- Maximum file upload: 10MB
- Rate limit: 100 req/min (anonymous), 1000 req/min (authenticated)
- Supported browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Planned Improvements

- [ ] WebSocket support for real-time updates
- [ ] Advanced search with Elasticsearch
- [ ] Multi-tenant support
- [ ] Mobile application
- [ ] API v2 with GraphQL

## Sign-off

- [ ] **Development Team Lead**: ******\_\_\_****** Date: ****\_\_\_****
- [ ] **QA Lead**: ******\_\_\_****** Date: ****\_\_\_****
- [ ] **Security Officer**: ******\_\_\_****** Date: ****\_\_\_****
- [ ] **Product Owner**: ******\_\_\_****** Date: ****\_\_\_****
- [ ] **DevOps Engineer**: ******\_\_\_****** Date: ****\_\_\_****

---

**Deployment Date**: ****\_\_\_****
**Version**: ****\_\_\_****
**Release Notes**: [Link to release notes]
