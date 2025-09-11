# QAZNEDR.KZ Deployment Guide

## Overview

This guide covers deploying QAZNEDR.KZ to Vercel with proper database configuration.

## Deployment Architecture

- **Frontend & API**: Vercel (Next.js serverless functions)
- **Database**: PostgreSQL (production) / SQLite (development)
- **File Storage**: Vercel Blob Storage or AWS S3
- **CDN**: Vercel Edge Network

## Prerequisites

1. GitHub account with repository access
2. Vercel account (free tier works)
3. PostgreSQL database (Vercel Postgres, Supabase, or Neon)

## Database Migration for Production

Since SQLite isn't supported on Vercel's serverless environment, we need to use PostgreSQL in production.

### Option 1: Vercel Postgres (Recommended)
1. Go to Vercel Dashboard → Storage → Create Database → Postgres
2. Copy the connection string
3. Add to Vercel environment variables as `DATABASE_URL`

### Option 2: Supabase
1. Create a free Supabase project
2. Go to Settings → Database
3. Copy the connection string
4. Add to Vercel environment variables

### Option 3: Neon
1. Create a free Neon project
2. Copy the connection string from dashboard
3. Add to Vercel environment variables

## Environment Variables for Vercel

Required environment variables:

```bash
# Database (PostgreSQL for production)
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="generate-32-char-secret"

# Optional but recommended
NODE_ENV="production"
```

## Deployment Steps

### 1. Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/qaznedr-app.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build` (default)
   - Output Directory: .next (default)

### 3. Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-project.vercel.app
NEXTAUTH_SECRET=your-generated-secret
```

### 4. Configure Build Settings

Ensure these settings in `vercel.json`:

```json
{
  "buildCommand": "prisma generate && prisma db push && next build",
  "devCommand": "next dev",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

### 5. Database Setup

After first deployment, initialize the database:

1. Go to Vercel Dashboard → Functions → Console
2. Run: `npx prisma db push`
3. Run: `npx prisma db seed` (if you want sample data)

## Post-Deployment Checklist

- [ ] Verify all pages load correctly
- [ ] Test authentication flow
- [ ] Check database connections
- [ ] Verify environment variables are set
- [ ] Test API endpoints
- [ ] Check analytics tracking
- [ ] Verify i18n translations work

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure DATABASE_URL is set correctly
   - Check if database allows connections from Vercel IPs

2. **Build Failures**
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are in package.json
   - Verify TypeScript has no errors

3. **Authentication Issues**
   - Verify NEXTAUTH_URL matches your deployment URL
   - Ensure NEXTAUTH_SECRET is set

## Production Considerations

1. **Database Backup**: Set up regular backups
2. **Monitoring**: Enable Vercel Analytics
3. **Error Tracking**: Configure Sentry (optional)
4. **Performance**: Use Vercel Edge Functions for better performance
5. **Security**: Enable Vercel WAF (Web Application Firewall)

## Custom Domain

1. Go to Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update NEXTAUTH_URL to use custom domain

## Continuous Deployment

Vercel automatically deploys:
- Production: Every push to `main` branch
- Preview: Every pull request

## Rollback

If needed, rollback to previous deployment:
1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." menu → "Promote to Production"