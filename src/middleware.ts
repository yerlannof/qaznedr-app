import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['ru', 'kz', 'en', 'zh'],

  // Used when no locale matches
  defaultLocale: 'ru',

  // Optionally, enable automatic locale detection based on
  // the Accept-Language header
  localeDetection: true,
});

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, etc)
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|images|fonts|manifest.json|sw.js).*)',
  ],
};