#!/usr/bin/env node

/**
 * Automated Cloudflare Pages Deployment Script for QAZNEDR.KZ
 * This script handles full deployment automation to Cloudflare Pages
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CloudflareDeployment {
  constructor() {
    this.projectName = 'qaznedr-kz';
    this.buildDir = '.next';
    this.envFile = '.env.local';
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix =
      {
        info: '📋',
        success: '✅',
        error: '❌',
        warning: '⚠️',
      }[type] || '📋';

    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  checkPrerequisites() {
    this.log('Checking deployment prerequisites...');

    // Check if build directory exists
    if (!fs.existsSync(this.buildDir)) {
      this.log('Build directory not found. Running build...', 'warning');
      this.runBuild();
    }

    // Check environment variables
    if (fs.existsSync(this.envFile)) {
      this.log('Environment file found', 'success');
    } else {
      this.log('Environment file missing', 'warning');
    }

    // Check if we have Cloudflare credentials
    const hasCloudflareToken =
      process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN;
    if (!hasCloudflareToken) {
      this.log('Cloudflare API token not found in environment', 'warning');
    }

    this.log('Prerequisites check completed', 'success');
  }

  runBuild() {
    this.log('Building Next.js application...');
    try {
      execSync('npm run build', { stdio: 'inherit' });
      this.log('Build completed successfully', 'success');
    } catch (error) {
      this.log(`Build failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  prepareDeployment() {
    this.log('Preparing deployment package...');

    // Create deployment configuration
    const deployConfig = {
      name: this.projectName,
      production_branch: 'master',
      build: {
        command: 'npm run build',
        output_directory: '.next',
      },
      env_vars: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_APP_ENV: 'production',
      },
    };

    fs.writeFileSync(
      'cloudflare-deploy-config.json',
      JSON.stringify(deployConfig, null, 2)
    );
    this.log('Deployment configuration created', 'success');
  }

  generateDeploymentScript() {
    const deployScript = `#!/bin/bash
# Automated deployment script for QAZNEDR.KZ to Cloudflare Pages

set -e

echo "🚀 Starting deployment to Cloudflare Pages..."

# Build the application
echo "📦 Building application..."
npm ci
npm run build

# Deploy to Cloudflare Pages (requires wrangler CLI)
echo "☁️ Deploying to Cloudflare..."
if command -v wrangler &> /dev/null; then
    wrangler pages publish .next --project-name=${this.projectName}
else
    echo "⚠️ Wrangler CLI not found. Install with: npm install -g wrangler"
    echo "📋 Manual deployment steps:"
    echo "1. Install wrangler: npm install -g wrangler"
    echo "2. Login: wrangler login"
    echo "3. Deploy: wrangler pages publish .next --project-name=${this.projectName}"
fi

echo "✅ Deployment completed!"
`;

    fs.writeFileSync('deploy.sh', deployScript);
    execSync('chmod +x deploy.sh');
    this.log('Deployment script created: deploy.sh', 'success');
  }

  generateGitHubActions() {
    const workflowDir = '.github/workflows';
    if (!fs.existsSync(workflowDir)) {
      fs.mkdirSync(workflowDir, { recursive: true });
    }

    const githubAction = `name: Deploy to Cloudflare Pages

on:
  push:
    branches: [ master, main ]
  pull_request:
    branches: [ master, main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy to Cloudflare Pages
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run TypeScript check
        run: npm run type-check
        
      - name: Build application
        run: npm run build
        env:
          NODE_ENV: production
          
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: \${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: \${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: '${this.projectName}'
          directory: '.next'
          gitHubToken: \${{ secrets.GITHUB_TOKEN }}
`;

    fs.writeFileSync(
      path.join(workflowDir, 'deploy-cloudflare.yml'),
      githubAction
    );
    this.log('GitHub Actions workflow created', 'success');
  }

  createReadme() {
    const readmeContent = `# QAZNEDR.KZ - Deployment Guide

## 🚀 Quick Deployment

### Automated Deployment
\`\`\`bash
# Run the automated deployment script
./deploy.sh
\`\`\`

### Manual Deployment
\`\`\`bash
# 1. Build the application
npm run build

# 2. Deploy to Cloudflare Pages
wrangler pages publish .next --project-name=${this.projectName}
\`\`\`

## 📋 Prerequisites

1. **Cloudflare Account**: Sign up at https://cloudflare.com
2. **Wrangler CLI**: Install globally with \`npm install -g wrangler\`
3. **API Token**: Create at https://dash.cloudflare.com/profile/api-tokens

## ⚙️ Environment Variables

Required environment variables for production:
- \`CLOUDFLARE_API_TOKEN\` - Your Cloudflare API token
- \`CLOUDFLARE_ACCOUNT_ID\` - Your Cloudflare account ID
- \`NEXT_PUBLIC_SENTRY_DSN\` - Sentry DSN for error monitoring
- \`SUPABASE_URL\` - Supabase project URL
- \`SUPABASE_ANON_KEY\` - Supabase anonymous key

## 🔧 CI/CD Setup

The project includes GitHub Actions workflow for automated deployment:
- Located in \`.github/workflows/deploy-cloudflare.yml\`
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
`;

    fs.writeFileSync('DEPLOYMENT.md', readmeContent);
    this.log('Deployment documentation created: DEPLOYMENT.md', 'success');
  }

  run() {
    this.log('🚀 Starting Cloudflare deployment setup for QAZNEDR.KZ...');

    try {
      this.checkPrerequisites();
      this.prepareDeployment();
      this.generateDeploymentScript();
      this.generateGitHubActions();
      this.createReadme();

      this.log(
        '🎯 Cloudflare deployment setup completed successfully!',
        'success'
      );
      this.log('📝 Next steps:', 'info');
      this.log('1. Set up Cloudflare API token', 'info');
      this.log('2. Configure GitHub secrets (if using CI/CD)', 'info');
      this.log('3. Run ./deploy.sh to deploy', 'info');
      this.log('4. Execute SQL migration in Supabase', 'info');
    } catch (error) {
      this.log(`Setup failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run the deployment setup
if (require.main === module) {
  const deployment = new CloudflareDeployment();
  deployment.run();
}

module.exports = CloudflareDeployment;
