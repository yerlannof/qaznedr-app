import type { MetadataRoute } from 'next';
import { INSIGHTS } from '@/lib/insights/registry';
import { buildLanguageAlternates } from '@/lib/seo/metadata';
import { PUBLIC_PAGES } from '@/lib/seo/pages';
import { prospectingEnabled } from '@/lib/prospecting/flags';
import { listPublicPlots } from '@/lib/prospecting/plots';
import { plotPath } from '@/lib/prospecting/present';
import { LOCALES, localeUrl } from '@/lib/seo/site';
import { loadSitemapLeadCodes } from '@/lib/seo/sitemap-leads';
import { listPublishedOffers } from '@/lib/offers';
import { equipmentCatalogEnabled } from '@/lib/equipment-listings/flags';
import { listActiveForSitemap } from '@/lib/equipment-listings/catalog-repository';
import { listCompanies } from '@/lib/equipment-listings/companies';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    PUBLIC_PAGES.filter(
      (page) => page !== '/prospecting' || prospectingEnabled()
    ).map((page) => ({
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

  // Asset cards ship with the code, so their list is always complete.
  const offerEntries: MetadataRoute.Sitemap = listPublishedOffers().flatMap(
    (offer) =>
      LOCALES.map((locale) => ({
        url: localeUrl(locale, `/offers/${offer.code}`),
        lastModified: new Date(offer.published_at),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
        alternates: {
          languages: buildLanguageAlternates(`/offers/${offer.code}`),
        },
      }))
  );

  // Static licence data (src/lib/prospecting/plots.v1.json), no network.
  const plotEntries: MetadataRoute.Sitemap = listPublicPlots().flatMap((plot) =>
    LOCALES.map((locale) => ({
      url: localeUrl(locale, plotPath(plot.code)),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      alternates: { languages: buildLanguageAlternates(plotPath(plot.code)) },
    }))
  );

  // Closed until launch; once on, a failed read fails the sitemap like leads do.
  const equipmentEntries: MetadataRoute.Sitemap = equipmentCatalogEnabled()
    ? [
        ...LOCALES.map((locale) => ({
          url: localeUrl(locale, '/equipment'),
          changeFrequency: 'daily' as const,
          priority: 0.8,
          alternates: { languages: buildLanguageAlternates('/equipment') },
        })),
        ...(await listCompanies('ACTIVE')).flatMap((company) =>
          LOCALES.map((locale) => ({
            url: localeUrl(locale, `/equipment/company/${company.slug}`),
            lastModified: new Date(company.updatedAt),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
            alternates: {
              languages: buildLanguageAlternates(
                `/equipment/company/${company.slug}`
              ),
            },
          }))
        ),
        ...(await listActiveForSitemap()).flatMap((listing) =>
          LOCALES.map((locale) => ({
            url: localeUrl(locale, `/equipment/${listing.id}`),
            lastModified: new Date(listing.updatedAt),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
            alternates: {
              languages: buildLanguageAlternates(`/equipment/${listing.id}`),
            },
          }))
        ),
      ]
    : [];

  return [
    ...staticEntries,
    ...insightEntries,
    ...leadEntries,
    ...offerEntries,
    ...plotEntries,
    ...equipmentEntries,
  ];
}
