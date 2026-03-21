import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/admin/'],
      },
      {
        userAgent: 'Yandex',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/admin/'],
        crawlDelay: 2,
      },
    ],
    sitemap: 'https://qaznedr.kz/sitemap.xml',
    host: 'https://qaznedr.kz',
  };
}
