import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hiddenRouteRedirect, trackingQuery } from '@/lib/seo/pages';
import { insightLocaleRedirect } from '@/lib/insights/routing';

// Must live in src/ (the app is in src/app); Next.js ignores a root middleware.ts.
// Security headers come from next.config.mjs and vercel.json, not from here.
export function middleware(request: NextRequest) {
  // Legacy marketplace routes hidden after the holding pivot, and guides
  // opened in a language they are not written in → permanent redirect.
  const { pathname, searchParams } = request.nextUrl;
  // One crawlable entry point, independent of JavaScript and hosting provider.
  // Keep the same Russian default and all incoming query parameters.
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/ru';
    return NextResponse.redirect(url, 308);
  }
  const hidden = hiddenRouteRedirect(pathname);
  const target = hidden ?? insightLocaleRedirect(pathname);
  if (target) {
    // Clone keeps the query string, so UTM tags survive the redirect; from
    // hidden marketplace routes only the campaign tags travel.
    const url = request.nextUrl.clone();
    url.pathname = target;
    if (hidden) url.search = trackingQuery(searchParams);
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/(ru|kz|en|zh)/:path*'],
};
