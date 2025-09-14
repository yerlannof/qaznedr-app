import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['ru', 'kz', 'en', 'zh'],
  
  // Used when no locale matches
  defaultLocale: 'ru',
  
  // Disable automatic locale detection for now
  localeDetection: false
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(ru|kz|en|zh)/:path*']
};