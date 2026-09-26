import type { MetadataRoute } from 'next';
import { INSIGHTS } from '@/lib/insights/registry';
import { buildLanguageAlternates } from '@/lib/seo/metadata';
import { PUBLIC_PAGES } from '@/lib/seo/pages';
import { LOCALES, SITE_URL, localeUrl } from '@/lib/seo/site';

// Stable build-time date to avoid lastModified churn on every deploy.
const BUILD_DATE = new Date('2026-09-26');

async function fetchLeadCodes(): Promise<string[]> {
  const codes: string[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await fetch(`${SITE_URL}/api/leads?limit=50&page=${page}`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    const leads: { code: string }[] = data?.success
      ? (data.data?.leads ?? [])
      : [];
    if (!leads.length) break;
    codes.push(...leads.map((l) => l.code));
    totalPages = data.data?.totalPages ?? 1;
    page++;
  } while (page <= totalPages);
  return codes;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    PUBLIC_PAGES.map((page) => ({
      url: localeUrl(locale, page),
      lastModified: BUILD_DATE,
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

  let leadEntries: MetadataRoute.Sitemap = [];
  try {
    const codes = await fetchLeadCodes();
    leadEntries = codes.flatMap((code) =>
      LOCALES.map((locale) => ({
        url: localeUrl(locale, `/leads/${code}`),
        lastModified: BUILD_DATE,
        changeFrequency: 'weekly' as const,
        priority: 0.9,
        alternates: { languages: buildLanguageAlternates(`/leads/${code}`) },
      }))
    );
  } catch {
    // Leads API unavailable at build time: ship static entries only.
  }

  return [...staticEntries, ...insightEntries, ...leadEntries];
}
