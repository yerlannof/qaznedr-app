import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales: ['ru', 'kz', 'en', 'zh'],
  
  // Used when no locale matches
  defaultLocale: 'ru',
  
  // Always use the default locale if no other matches
  localePrefix: 'always'
});

export default function middleware(request: NextRequest) {
  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: [
    '/',
    '/(ru|kz|en|zh)/:path*',
    '/((?!_next|_vercel|api|.*\\..*).*)'
  ]
};