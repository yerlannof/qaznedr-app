import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://qaznedr.kz';
  const locales = ['ru', 'kz', 'en', 'zh'];

  // Static pages
  const staticPages = [
    '',
    '/leads',
    '/listings',
    '/services',
    '/services/catalog',
    '/services/geological',
    '/services/legal',
    '/services/equipment',
    '/services/investors',
    '/companies',
    '/blog',
    '/education',
    '/news',
    '/knowledge',
    '/favorites',
    '/map',
  ];
  const staticEntries = locales.flatMap((locale) =>
    staticPages.map((page) => ({
      url: `${baseUrl}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: page === '' ? 1.0 : 0.8,
    }))
  );

  // Dynamic listing pages - fetch ALL listings from Supabase via API
  let listingEntries: MetadataRoute.Sitemap = [];
  try {
    let allDeposits: { id: string; updatedAt?: string; createdAt?: string }[] =
      [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const res = await fetch(
        `${baseUrl}/api/listings?limit=100&page=${page}`,
        {
          next: { revalidate: 3600 },
        }
      );
      const data = await res.json();
      if (data.success && data.data?.deposits) {
        allDeposits = [...allDeposits, ...data.data.deposits];
        hasMore = data.data.pagination?.hasNext ?? false;
        page++;
      } else {
        hasMore = false;
      }
    }

    listingEntries = allDeposits.flatMap((deposit) =>
      locales.map((locale) => ({
        url: `${baseUrl}/${locale}/listings/${deposit.id}`,
        lastModified: new Date(
          deposit.updatedAt || deposit.createdAt || new Date()
        ),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      }))
    );
  } catch {
    // If API is unavailable, return only static entries
  }

  // Dynamic PUBLISHED lead teasers (NOT /full — that is noindex)
  let leadEntries: MetadataRoute.Sitemap = [];
  try {
    let codes: { code: string }[] = [];
    let lpage = 1;
    let lhasMore = true;
    while (lhasMore) {
      const res = await fetch(`${baseUrl}/api/leads?limit=50&page=${lpage}`, {
        next: { revalidate: 3600 },
      });
      const data = await res.json();
      if (data.success && data.data?.leads?.length) {
        codes = [
          ...codes,
          ...data.data.leads.map((l: { code: string }) => ({ code: l.code })),
        ];
        lhasMore = lpage < (data.data.totalPages ?? 1);
        lpage++;
      } else {
        lhasMore = false;
      }
    }
    leadEntries = codes.flatMap((l) =>
      locales.map((locale) => ({
        url: `${baseUrl}/${locale}/leads/${l.code}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      }))
    );
  } catch {
    // If API is unavailable, skip lead entries
  }

  return [...staticEntries, ...listingEntries, ...leadEntries];
}
