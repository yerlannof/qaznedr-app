import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // Temporarily use only Russian locale
  locales: ['ru'],
  
  // Used when no locale matches
  defaultLocale: 'ru'
});

export const config = {
  // Skip all paths that should not be internationalized
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};