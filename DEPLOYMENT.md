# QAZNEDR.KZ - Deployment Guide

## 🚀 Quick Deployment

### Automated Deployment

```bash
# Run the automated deployment script
./deploy.sh
```

### Manual Deployment

```bash
# 1. Build the application
npm run build

# 2. Deploy to Cloudflare Pages
wrangler pages publish .next --project-name=qaznedr-kz
```

## 📋 Prerequisites

1. **Cloudflare Account**: Sign up at https://cloudflare.com
2. **Wrangler CLI**: Install globally with `npm install -g wrangler`
3. **API Token**: Create at https://dash.cloudflare.com/profile/api-tokens

## ⚙️ Environment Variables

Required environment variables for production:

- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN for error monitoring
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key

## 🔧 CI/CD Setup

The project includes GitHub Actions workflow for automated deployment:

- Located in `.github/workflows/deploy-cloudflare.yml`
- Triggers on push to master/main branch
- Runs type checking and builds before deployment
- Automatically deploys to Cloudflare Pages

## 🎯 Production Checklist

- [ ] Environment variables configured
- [ ] Database schema deployed to Supabase
- [ ] Sentry project created and configured
- [ ] Cloudflare Pages project created
- [ ] GitHub Actions secrets configured
- [ ] Domain configured (if custom domain needed)

## 📊 Monitoring

- **Error Tracking**: Sentry dashboard at https://yerlans-company.sentry.io
- **Performance**: Cloudflare Analytics
- **Logs**: Cloudflare Pages Function logs

## 🚨 Troubleshooting

### Build Issues

- Ensure all TypeScript errors are resolved
- Check environment variables are set
- Verify all dependencies are installed

### Deployment Issues

- Check Cloudflare API token permissions
- Verify account ID is correct
- Check build output directory exists

For detailed troubleshooting, see the project documentation.
