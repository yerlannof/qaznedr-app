# 🚀 QAZNEDR.KZ Deployment Instructions

Follow these step-by-step instructions to deploy QAZNEDR.KZ to GitHub and Vercel.

## 📋 Prerequisites

1. **GitHub Account**: Create one at [github.com](https://github.com) if you don't have one
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) (free tier is sufficient)

## 🔧 Step 1: Prepare Local Repository

The git repository has already been initialized and committed. Current status:
- ✅ Git initialized
- ✅ Initial commit made
- ✅ Deployment configuration added

## 📤 Step 2: Push to GitHub

### Option A: Using GitHub Web Interface (Recommended for beginners)

1. **Create a new repository on GitHub**:
   - Go to [github.com/new](https://github.com/new)
   - Repository name: `qaznedr-app`
   - Description: "QAZNEDR.KZ - Kazakhstan mining platform"
   - Keep it **Public** (or Private if you prefer)
   - **DO NOT** initialize with README, .gitignore, or license
   - Click "Create repository"

2. **Push your code**:
   ```bash
   cd /home/yerla/qaznedr-app
   git remote add origin https://github.com/YOUR_USERNAME/qaznedr-app.git
   git branch -M main
   git push -u origin main
   ```
   Replace `YOUR_USERNAME` with your GitHub username.

### Option B: Using GitHub CLI (if installed)

```bash
gh repo create qaznedr-app --public --source=. --remote=origin --push
```

## 🌐 Step 3: Deploy to Vercel

1. **Go to Vercel Dashboard**:
   - Visit [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"

2. **Connect GitHub**:
   - Authorize Vercel to access your GitHub
   - Select the `qaznedr-app` repository

3. **Configure Project**:
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./`
   - Build Command: `prisma generate && next build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **Environment Variables** (CRITICAL):
   Add these in the Vercel dashboard before deploying:

   ```bash
   # Required
   DATABASE_URL=postgresql://[YOUR_POSTGRES_URL]
   NEXTAUTH_SECRET=[GENERATE_32_CHAR_SECRET]
   NEXTAUTH_URL=https://[YOUR-PROJECT].vercel.app

   # Optional but recommended
   NODE_ENV=production
   ```

   To generate NEXTAUTH_SECRET:
   ```bash
   openssl rand -base64 32
   ```

## 🗄️ Step 4: Set Up Database

### Option 1: Vercel Postgres (Easiest)

1. In Vercel Dashboard → Storage → Create Database → Postgres
2. Select your project
3. Create database (takes ~1 minute)
4. Connection string is automatically added to your environment

### Option 2: Supabase (Free tier)

1. Create account at [supabase.com](https://supabase.com)
2. New Project → Choose region closest to you
3. Go to Settings → Database
4. Copy "URI" connection string
5. Add to Vercel as `DATABASE_URL`

### Option 3: Neon (Free tier)

1. Sign up at [neon.tech](https://neon.tech)
2. Create database
3. Copy connection string from dashboard
4. Add to Vercel as `DATABASE_URL`

## 🔄 Step 5: Initialize Database

After first deployment:

1. **Option A: Using Vercel CLI** (if installed):
   ```bash
   vercel env pull .env.local
   npx prisma db push
   npx prisma db seed  # Optional: adds sample data
   ```

2. **Option B: Manual initialization**:
   - Copy DATABASE_URL from Vercel dashboard
   - Create local `.env.local` with the DATABASE_URL
   - Run:
     ```bash
     npx prisma db push
     npx prisma db seed  # Optional
     ```

## ✅ Step 6: Verify Deployment

1. Visit your Vercel URL: `https://[YOUR-PROJECT].vercel.app`
2. Check:
   - [ ] Homepage loads
   - [ ] Can navigate to /listings
   - [ ] Authentication pages load (/auth/login)
   - [ ] API health check: `/api/health`

## 🎯 Step 7: Configure Custom Domain (Optional)

1. Vercel Dashboard → Settings → Domains
2. Add your domain (e.g., `qaznedr.kz`)
3. Follow DNS configuration instructions
4. Update `NEXTAUTH_URL` environment variable

## 🔧 Troubleshooting

### Common Issues:

1. **"Database connection failed"**
   - Verify DATABASE_URL is correctly set in Vercel
   - Ensure database allows connections from Vercel IPs
   - Check if using correct PostgreSQL format (not SQLite)

2. **"Build failed"**
   - Check build logs in Vercel dashboard
   - Run `npm run build` locally to test
   - Ensure all dependencies are in package.json

3. **"Authentication not working"**
   - Verify NEXTAUTH_URL matches your deployment URL
   - Ensure NEXTAUTH_SECRET is set (32+ characters)
   - Check callback URLs in OAuth providers (if using)

4. **"Prisma errors"**
   - Run `npx prisma generate` before building
   - Ensure DATABASE_URL uses PostgreSQL format
   - Check if database schema is synchronized

## 📱 Next Steps

1. **Enable Analytics**:
   - Vercel Analytics (built-in)
   - Add Google Analytics ID
   - Configure Yandex.Metrica for Kazakhstan

2. **Set up Monitoring**:
   - Enable Vercel monitoring
   - Configure Sentry for error tracking (optional)

3. **Performance Optimization**:
   - Enable Vercel Edge Network
   - Configure caching headers
   - Optimize images with Vercel Image Optimization

4. **Security**:
   - Review environment variables
   - Enable Vercel WAF (paid feature)
   - Set up rate limiting

## 🆘 Getting Help

- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Next.js Documentation: [nextjs.org/docs](https://nextjs.org/docs)
- Project issues: Create an issue in your GitHub repository

## 📝 Deployment Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Database connected and initialized
- [ ] Authentication tested
- [ ] Custom domain configured (if applicable)
- [ ] Analytics enabled
- [ ] Error monitoring set up
- [ ] Backup strategy in place
- [ ] Rate limiting configured
- [ ] Security headers verified

---

**Need help?** The project is configured with sensible defaults. Most issues are related to environment variables or database configuration. Double-check these first!