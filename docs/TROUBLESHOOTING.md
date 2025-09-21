# QAZNEDR Troubleshooting Guide

## Quick Fixes

### Common Commands

```bash
# Clear all caches and reinstall
rm -rf .next node_modules package-lock.json
npm install
npm run dev

# Reset database
npm run db:reset

# Type check
npx tsc --noEmit

# Fix linting issues
npm run lint:fix
npm run format
```

## Build & Compilation Issues

### Error: "Module not found"

**Symptoms**: Cannot resolve module during build

```
Module not found: Can't resolve '@/components/...'
```

**Solutions**:

1. Check import path matches file location
2. Verify tsconfig.json paths:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

3. Clear Next.js cache: `rm -rf .next`

### Error: "Type error in TypeScript"

**Symptoms**: TypeScript compilation fails

```
Type 'undefined' is not assignable to type 'string'
```

**Solutions**:

1. Add proper type guards:

```typescript
// Bad
const value: string = maybeUndefined;

// Good
const value: string = maybeUndefined || '';
const value: string = maybeUndefined!; // if certain
const value: string | undefined = maybeUndefined;
```

2. Fix with type assertion (use sparingly):

```typescript
data={chartData as any}
```

### Error: "Hydration mismatch"

**Symptoms**: Content differs between server and client

```
Warning: Text content did not match
```

**Solutions**:

1. Ensure consistent data between server/client
2. Use `suppressHydrationWarning` for timestamps:

```tsx
<time suppressHydrationWarning>{new Date().toISOString()}</time>
```

3. Move dynamic content to useEffect:

```typescript
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null;
```

## Database Issues

### Error: "Prisma Client not generated"

**Symptoms**: Cannot import from '@prisma/client'

**Solutions**:

```bash
npx prisma generate
```

### Error: "Database connection failed"

**Symptoms**: ECONNREFUSED or timeout errors

**Solutions**:

1. Check DATABASE_URL in .env
2. Verify Supabase project is active
3. Test connection:

```bash
npx prisma db pull
```

### Error: "Migration failed"

**Symptoms**: Database schema out of sync

**Solutions**:

```bash
# Reset database (development only!)
npx prisma migrate reset

# Apply migrations
npx prisma migrate deploy

# Create new migration
npx prisma migrate dev --name fix_schema
```

## Authentication Issues

### Error: "NEXTAUTH_SECRET not set"

**Symptoms**: Authentication fails in production

**Solutions**:

1. Generate secret:

```bash
openssl rand -base64 32
```

2. Add to .env:

```env
NEXTAUTH_SECRET=your_generated_secret
```

### Error: "Callback URL mismatch"

**Symptoms**: OAuth redirect fails

**Solutions**:

1. Update NEXTAUTH_URL:

```env
NEXTAUTH_URL=https://qaznedr.kz
```

2. Configure OAuth provider callbacks

## Internationalization Issues

### Error: "Couldn't find next-intl config"

**Symptoms**: i18n initialization fails

**Solutions**:

1. Check i18n.ts exists in root
2. Verify next.config.ts:

```typescript
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./i18n.ts');
```

### Error: "Missing locale in URL"

**Symptoms**: Pages show 404

**Solutions**:

1. Ensure middleware.ts handles locales:

```typescript
export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
```

2. Add locale to links:

```tsx
<Link href={`/${locale}/listings`}>
```

## API Issues

### Error: "API rate limited"

**Symptoms**: 429 Too Many Requests

**Solutions**:

1. Implement rate limiting:

```typescript
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function GET(request: Request) {
  try {
    await limiter.check(request, 10); // 10 requests per minute
  } catch {
    return new Response('Too Many Requests', { status: 429 });
  }
}
```

### Error: "CORS blocked"

**Symptoms**: Cross-origin requests fail

**Solutions**:

```typescript
// app/api/route.ts
export async function GET(request: Request) {
  return new Response(data, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
  });
}
```

## Performance Issues

### Slow Initial Load

**Symptoms**: Page takes long to load

**Solutions**:

1. Optimize imports:

```typescript
// Bad
import _ from 'lodash';

// Good
import debounce from 'lodash/debounce';
```

2. Enable static generation:

```typescript
export const revalidate = 3600; // Revalidate every hour
```

3. Lazy load components:

```typescript
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

### Memory Leaks

**Symptoms**: Increasing memory usage

**Solutions**:

1. Clean up effects:

```typescript
useEffect(() => {
  const timer = setInterval(() => {}, 1000);
  return () => clearInterval(timer); // Cleanup
}, []);
```

2. Avoid storing large objects in state
3. Use React.memo for expensive components

## Styling Issues

### Error: "Tailwind classes not working"

**Symptoms**: Styles not applied

**Solutions**:

1. Check tailwind.config.ts content paths:

```typescript
content: [
  './src/**/*.{js,ts,jsx,tsx,mdx}',
],
```

2. Avoid dynamic class names:

```typescript
// Bad
className={`text-${color}-500`}

// Good
className={color === 'red' ? 'text-red-500' : 'text-blue-500'}
```

### Error: "CSS conflicts"

**Symptoms**: Unexpected styling

**Solutions**:

1. Use CSS modules for isolation
2. Increase specificity with cn():

```typescript
import { cn } from '@/lib/utils';

className={cn('base-class', conditional && 'override-class')}
```

## Testing Issues

### Error: "Test fails with 'Cannot find module'"

**Symptoms**: Jest cannot resolve imports

**Solutions**:

1. Update jest.config.ts:

```typescript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
},
```

### Error: "ReferenceError: fetch is not defined"

**Symptoms**: Tests fail with fetch calls

**Solutions**:

```typescript
// setupTests.ts
import 'whatwg-fetch';
```

## Deployment Issues

### Vercel Build Fails

**Symptoms**: Deployment fails on Vercel

**Solutions**:

1. Check build logs for specific errors
2. Ensure all environment variables are set
3. Test production build locally:

```bash
npm run build
npm run start
```

### Cloudflare Workers Limits

**Symptoms**: Script too large error

**Solutions**:

1. Optimize bundle size
2. Use external dependencies via CDN
3. Split into multiple workers

## Environment Variable Issues

### Variables Not Loading

**Symptoms**: undefined environment variables

**Solutions**:

1. Check file naming:
   - Development: `.env.local`
   - Production: `.env.production`

2. Restart dev server after changes

3. Use correct prefixes:
   - Client: `NEXT_PUBLIC_*`
   - Server: Any name

## Common Error Messages

### "Multiple dev servers running"

**Solution**:

```bash
# Find processes
ps aux | grep "npm run dev"

# Kill all
pkill -f "npm run dev"
```

### "Port 3000 already in use"

**Solution**:

```bash
# Find process using port
lsof -i :3000

# Kill specific process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### "ENOSPC: System limit for watchers"

**Solution** (Linux):

```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### "JavaScript heap out of memory"

**Solution**:

```bash
# Increase memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

## Debugging Techniques

### Enable Debug Logging

1. **Next.js Debug**:

```bash
DEBUG=* npm run dev
```

2. **Prisma Debug**:

```env
DEBUG="prisma:*"
```

3. **Custom Debug**:

```typescript
const debug = process.env.NODE_ENV === 'development';
if (debug) console.log('Debug info:', data);
```

### Browser DevTools

1. **React DevTools**: Install extension
2. **Network tab**: Check API calls
3. **Console**: Look for errors
4. **Application tab**: Inspect cookies/storage

### Server Logs

1. **Vercel Logs**:

```bash
vercel logs
```

2. **PM2 Logs**:

```bash
pm2 logs qaznedr
```

3. **Docker Logs**:

```bash
docker logs -f qaznedr-app
```

## Emergency Procedures

### Rollback Deployment

**Vercel**:

```bash
vercel rollback
```

**Docker**:

```bash
docker stop current_container
docker run previous_image
```

### Database Corruption

1. **Backup first**:

```bash
pg_dump $DATABASE_URL > backup.sql
```

2. **Reset if needed**:

```bash
npx prisma migrate reset --skip-seed
```

### Clear All Caches

```bash
# Next.js cache
rm -rf .next

# Node modules
rm -rf node_modules package-lock.json
npm install

# Prisma
npx prisma generate

# Browser cache
# Add cache-busting query params to assets
```

## Getting Help

### Error Reporting Template

When reporting issues, include:

1. **Error message**: Full error text
2. **Steps to reproduce**: Exact sequence
3. **Environment**: OS, Node version, browser
4. **Logs**: Console output, network requests
5. **Code**: Relevant code snippets
6. **Attempted solutions**: What you've tried

### Resources

- **Next.js Discord**: https://discord.gg/nextjs
- **Supabase Discord**: https://discord.gg/supabase
- **Stack Overflow**: Tag with [nextjs] [typescript]
- **GitHub Issues**: Project repository

### Monitoring Tools

1. **Sentry**: Error tracking
2. **Vercel Analytics**: Performance metrics
3. **Supabase Dashboard**: Database monitoring
4. **Cloudflare Analytics**: CDN and security

## Prevention Checklist

### Daily

- [ ] Check error logs
- [ ] Monitor performance metrics
- [ ] Review recent deployments

### Weekly

- [ ] Update dependencies
- [ ] Run security audit
- [ ] Backup database
- [ ] Test critical paths

### Monthly

- [ ] Review and optimize queries
- [ ] Clean up unused code
- [ ] Update documentation
- [ ] Performance profiling
