import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@/i18n/config';

export default createMiddleware({
  // A list of all locales that are supported
  locales,
  
  // Used when no locale matches
  defaultLocale,
  
  // Automatically redirect to the best matching locale
  localeDetection: true,
  
  // Prefix the default locale in the URL
  localePrefix: 'always'
});

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
    // However, match all pathnames within `/users`, including the ones containing a dot
    '/([\\w-]+)?/users/(.+)'
  ]
};