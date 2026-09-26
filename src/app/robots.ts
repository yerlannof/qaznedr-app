import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo/site';

// Private/utility areas. Legacy marketplace routes are 308-redirected in
// middleware (src/lib/seo/pages.ts), so they need no rule here.
// AI crawlers (GPTBot, ClaudeBot, PerplexityBot…) are intentionally allowed.
const disallow = [
  '/api/',
  '/*/admin',
  '/*/auth/',
  '/*/dashboard',
  '/*/favorites',
  '/*/leads/*/full',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: ['/', '/api/openapi.json$'], disallow },
      {
        userAgent: 'Yandex',
        allow: ['/', '/api/openapi.json$'],
        disallow,
        crawlDelay: 2,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
