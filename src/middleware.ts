import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hiddenRouteRedirect } from '@/lib/seo/pages';
import { insightLocaleRedirect } from '@/lib/insights/routing';

// Must live in src/ (the app is in src/app); Next.js ignores a root middleware.ts.
// Security headers come from next.config.mjs and vercel.json, not from here.
export function middleware(request: NextRequest) {
  // Legacy marketplace routes hidden after the holding pivot, and guides
  // opened in a language they are not written in → permanent redirect.
  const { pathname } = request.nextUrl;
  const target =
    hiddenRouteRedirect(pathname) ?? insightLocaleRedirect(pathname);
  if (target) {
    return NextResponse.redirect(new URL(target, request.url), 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/(ru|kz|en|zh)/:path*'],
};
