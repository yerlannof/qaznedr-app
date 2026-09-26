import { MetadataRoute } from 'next';

const disallow = [
  '/api/',
  '/dashboard/',
  '/admin/',
  '/auth/',
  '/favorites',
  '/*/dashboard/',
  '/*/admin/',
  '/*/auth/',
  '/*/favorites',
  '/*/leads/*/full',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow,
      },
      {
        userAgent: 'Yandex',
        allow: '/',
        disallow,
        crawlDelay: 2,
      },
    ],
    sitemap: 'https://qaznedr.kz/sitemap.xml',
    host: 'https://qaznedr.kz',
  };
}
