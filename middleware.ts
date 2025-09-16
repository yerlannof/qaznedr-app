import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['ru', 'kz', 'en', 'zh'];
const defaultLocale = 'ru';

function getLocale(pathname: string): string {
  const segments = pathname.split('/');
  const firstSegment = segments[1];
  return locales.includes(firstSegment) ? firstSegment : defaultLocale;
}

function hasLocale(pathname: string): boolean {
  const segments = pathname.split('/');
  return locales.includes(segments[1]);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // If the pathname doesn't have a locale, redirect with proper locale
  if (!hasLocale(pathname)) {
    // Try to get locale from cookie first
    const cookieLocale = request.cookies.get('locale')?.value;
    
    // Then check the referer header to preserve current locale
    const referer = request.headers.get('referer');
    let locale = defaultLocale;
    
    if (cookieLocale && locales.includes(cookieLocale)) {
      locale = cookieLocale;
    } else if (referer) {
      const refererUrl = new URL(referer);
      const refererLocale = getLocale(refererUrl.pathname);
      if (locales.includes(refererLocale)) {
        locale = refererLocale;
      }
    }
    
    const newUrl = new URL(`/${locale}${pathname}`, request.url);
    const response = NextResponse.redirect(newUrl, 302);
    
    // Set the locale cookie for future requests
    response.cookies.set('locale', locale, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
      path: '/'
    });
    
    return response;
  }

  // If we have a locale in the path, save it to cookie
  const currentLocale = getLocale(pathname);
  const response = NextResponse.next();
  
  // Update the locale cookie with current locale
  response.cookies.set('locale', currentLocale, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
    path: '/'
  });

  return response;
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - other static files
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
