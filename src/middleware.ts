// Temporarily disabled to debug SSR issues
// import createMiddleware from 'next-intl/middleware';

// export default createMiddleware({
//   locales: ['ru', 'kz', 'en', 'zh'],
//   defaultLocale: 'ru',
//   localeDetection: true,
// });

export const config = {
  matcher: []  // Disable middleware entirely
};