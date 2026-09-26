import type { MetadataRoute } from 'next';
import { INSIGHTS } from '@/lib/insights/registry';
import { buildLanguageAlternates } from '@/lib/seo/metadata';
import { PUBLIC_PAGES } from '@/lib/seo/pages';
import { LOCALES, localeUrl } from '@/lib/seo/site';
import { loadSitemapLeadCodes } from '@/lib/seo/sitemap-leads';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    PUBLIC_PAGES.map((page) => ({
      url: localeUrl(locale, page),
      changeFrequency: 'weekly' as const,
      priority: page === '' ? 1.0 : 0.8,
      alternates: { languages: buildLanguageAlternates(page) },
    }))
  );

  const insightEntries: MetadataRoute.Sitemap = INSIGHTS.flatMap((entry) => {
    const path = `/insights/${entry.slug}`;
    return entry.locales.map((locale) => ({
      url: localeUrl(locale, path),
      lastModified: new Date(entry.updated),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
      alternates: { languages: buildLanguageAlternates(path, entry.locales) },
    }));
  });

  // Throw on failed initial generation/revalidation. Returning fewer URLs with
  // 200 would replace a complete cached sitemap with a misleading success.
  const codes = await loadSitemapLeadCodes();
  const leadEntries: MetadataRoute.Sitemap = codes.flatMap((code) =>
    LOCALES.map((locale) => ({
      url: localeUrl(locale, `/leads/${code}`),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
      alternates: { languages: buildLanguageAlternates(`/leads/${code}`) },
    }))
  );

  return [...staticEntries, ...insightEntries, ...leadEntries];
}
